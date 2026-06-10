// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./VelaAgentRegistry.sol";
import "./VelaStrategy.sol";
import "./interfaces/IAaveV3.sol";

/**
 * @title VelaVault
 * @notice Non-custodial ERC-4626 vault. Users deposit USDC.
 *         Registered AI agents allocate capital across Aave V3 on Arbitrum.
 *         Every agent action is logged on-chain with full reasoning.
 *         Users retain withdrawal rights at all times.
 */
contract VelaVault is ERC4626, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant PROTOCOL_FEE_BPS = 50;      // 0.5% performance fee
    uint256 public constant MAX_BPS = 10_000;
    uint256 public constant MIN_DEPOSIT = 1e6;           // 1 USDC minimum

    // ─── Immutables ───────────────────────────────────────────────────────────
    VelaAgentRegistry public immutable agentRegistry;
    VelaStrategy public immutable strategyContract;
    IAaveV3Pool public immutable aavePool;
    IERC20 public immutable usdc;
    address public immutable treasury;

    // ─── State ────────────────────────────────────────────────────────────────
    uint256 public totalAaveDeposited;
    uint256 public totalProtocolFees;
    uint256 public lastHarvestTimestamp;
    bool public emergencyMode;

    // Per-user accounting
    mapping(address => uint256) public userDepositedAssets;
    mapping(address => uint64) public userLastDepositTime;
    mapping(address => uint256) public userTotalYieldEarned;

    // All-time metrics
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public totalYieldGenerated;
    uint256 public totalAgentExecutions;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event AgentDeployedToAave(address indexed agent, uint256 amount, string reasoning);
    event AgentWithdrewFromAave(address indexed agent, uint256 amount, string reasoning);
    event AgentRebalanced(address indexed agent, string reasoning);
    event EmergencyExitTriggered(address indexed sentinel, string reason);
    event YieldHarvested(uint256 gross, uint256 fee, uint256 net);
    event EmergencyModeToggled(bool active);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error OnlyRegisteredAgent();
    error EmergencyModeActive();
    error BelowMinDeposit(uint256 amount, uint256 minimum);
    error InsufficientVaultBalance(uint256 requested, uint256 available);
    error NotAuthorizedForEmergencyExit();
    error ZeroAmount();

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _usdc,
        address _aavePool,
        address _agentRegistry,
        address _strategyContract,
        address _treasury
    )
        ERC4626(IERC20(_usdc))
        ERC20("VELA Vault Shares", "velaUSDC")
        Ownable(msg.sender)
    {
        usdc = IERC20(_usdc);
        aavePool = IAaveV3Pool(_aavePool);
        agentRegistry = VelaAgentRegistry(_agentRegistry);
        strategyContract = VelaStrategy(_strategyContract);
        treasury = _treasury;
    }

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyActiveAgent() {
        if (!agentRegistry.isRegistered(msg.sender)) revert OnlyRegisteredAgent();
        _;
    }

    modifier notInEmergency() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }

    // ─── ERC-4626 Overrides ───────────────────────────────────────────────────

    /**
     * @notice Total assets under management including Aave deposits
     */
    function totalAssets() public view override returns (uint256) {
        uint256 vaultBalance = usdc.balanceOf(address(this));
        return vaultBalance + totalAaveDeposited;
    }

    /**
     * @notice Deposit USDC, receive vault shares
     */
    function deposit(uint256 assets, address receiver)
        public
        override
        nonReentrant
        whenNotPaused
        notInEmergency
        returns (uint256 shares)
    {
        if (assets < MIN_DEPOSIT) revert BelowMinDeposit(assets, MIN_DEPOSIT);

        shares = super.deposit(assets, receiver);

        // Track per-user deposits
        userDepositedAssets[receiver] += assets;
        userLastDepositTime[receiver] = uint64(block.timestamp);
        totalDeposited += assets;

        emit Deposited(receiver, assets, shares);
        return shares;
    }

    /**
     * @notice Withdraw USDC by burning vault shares
     */
    function withdraw(uint256 assets, address receiver, address owner_)
        public
        override
        nonReentrant
        returns (uint256 shares)
    {
        if (assets == 0) revert ZeroAmount();

        // If insufficient liquid balance, withdraw from Aave first
        uint256 liquidBalance = usdc.balanceOf(address(this));
        if (assets > liquidBalance) {
            uint256 needed = assets - liquidBalance;
            _withdrawFromAaveInternal(needed);
        }

        shares = super.withdraw(assets, receiver, owner_);

        // Track withdrawals
        uint256 deposited = userDepositedAssets[owner_];
        if (assets >= deposited) {
            uint256 yield = assets - deposited;
            userTotalYieldEarned[owner_] += yield;
            totalYieldGenerated += yield;
            userDepositedAssets[owner_] = 0;
        } else {
            userDepositedAssets[owner_] -= assets;
        }

        totalWithdrawn += assets;
        emit Withdrawn(owner_, assets, shares);
        return shares;
    }

    // ─── Agent Functions ──────────────────────────────────────────────────────

    /**
     * @notice ALLOCATOR agent: Deploy capital to Aave V3
     */
    function agentDeployToAave(
        uint256 amount,
        string calldata reasoning
    ) external onlyActiveAgent notInEmergency nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 available = usdc.balanceOf(address(this));
        if (amount > available) revert InsufficientVaultBalance(amount, available);

        // Validate and log through registry
        agentRegistry.validateAndLog(
            msg.sender,
            uint8(0), // DEPOSIT_AAVE
            address(usdc),
            amount,
            reasoning
        );

        // Execute Aave deposit
        usdc.approve(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        totalAaveDeposited += amount;
        totalAgentExecutions++;

        emit AgentDeployedToAave(msg.sender, amount, reasoning);
    }

    /**
     * @notice ALLOCATOR agent: Withdraw capital from Aave V3
     */
    function agentWithdrawFromAave(
        uint256 amount,
        string calldata reasoning
    ) external onlyActiveAgent nonReentrant {
        if (amount == 0) revert ZeroAmount();

        agentRegistry.validateAndLog(
            msg.sender,
            uint8(1), // WITHDRAW_AAVE
            address(usdc),
            amount,
            reasoning
        );

        _withdrawFromAaveInternal(amount);
        totalAgentExecutions++;

        emit AgentWithdrewFromAave(msg.sender, amount, reasoning);
    }

    /**
     * @notice SENTINEL agent: Emergency exit — pull all funds from Aave
     */
    function agentEmergencyExit(string calldata reason)
        external
        onlyActiveAgent
        nonReentrant
    {
        if (!agentRegistry.canAgentEmergencyExit(msg.sender)) {
            revert NotAuthorizedForEmergencyExit();
        }

        agentRegistry.validateAndLog(
            msg.sender,
            uint8(3), // EMERGENCY_EXIT
            address(usdc),
            totalAaveDeposited,
            reason
        );

        if (totalAaveDeposited > 0) {
            _withdrawFromAaveInternal(type(uint256).max);
        }

        emergencyMode = true;
        totalAgentExecutions++;

        emit EmergencyExitTriggered(msg.sender, reason);
    }

    /**
     * @notice ALLOCATOR agent: Rebalance (log rebalance decision)
     */
    function agentLogRebalance(string calldata reasoning)
        external
        onlyActiveAgent
        nonReentrant
    {
        agentRegistry.validateAndLog(
            msg.sender,
            uint8(2), // REBALANCE
            address(usdc),
            0,
            reasoning
        );

        totalAgentExecutions++;
        emit AgentRebalanced(msg.sender, reasoning);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _withdrawFromAaveInternal(uint256 amount) internal {
        if (totalAaveDeposited == 0) return;

        uint256 toWithdraw = amount > totalAaveDeposited ? totalAaveDeposited : amount;

        try aavePool.withdraw(address(usdc), toWithdraw, address(this)) returns (uint256 withdrawn) {
            if (withdrawn > totalAaveDeposited) {
                uint256 yield = withdrawn - totalAaveDeposited;
                totalYieldGenerated += yield;
                totalAaveDeposited = 0;
            } else {
                totalAaveDeposited -= withdrawn;
            }
        } catch {
            // If Aave withdraw fails, mark emergency mode
            emergencyMode = true;
        }
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    function toggleEmergencyMode(bool active) external onlyOwner {
        emergencyMode = active;
        emit EmergencyModeToggled(active);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getUserInfo(address user)
        external
        view
        returns (
            uint256 shares,
            uint256 assets,
            uint256 depositedAssets,
            uint256 yieldEarned,
            uint64 lastDepositTime
        )
    {
        shares = balanceOf(user);
        assets = convertToAssets(shares);
        depositedAssets = userDepositedAssets[user];
        yieldEarned = assets > depositedAssets ? assets - depositedAssets : 0;
        lastDepositTime = userLastDepositTime[user];
    }

    function getVaultMetrics()
        external
        view
        returns (
            uint256 tvl,
            uint256 liquidBalance,
            uint256 aaveBalance,
            uint256 totalDep,
            uint256 totalWith,
            uint256 yieldGenerated,
            uint256 agentExecs,
            bool isEmergency
        )
    {
        return (
            totalAssets(),
            usdc.balanceOf(address(this)),
            totalAaveDeposited,
            totalDeposited,
            totalWithdrawn,
            totalYieldGenerated,
            totalAgentExecutions,
            emergencyMode
        );
    }
}