// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVelaVault {
    // Events
    event Deposited(address indexed user, uint256 assets, uint256 shares, uint64 timestamp);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares, uint64 timestamp);
    event AgentActionExecuted(
        address indexed agent,
        uint8 actionType,
        address asset,
        uint256 amount,
        string reasoning,
        uint64 timestamp
    );
    event StrategyUpdated(address indexed user, string strategy);
    event EmergencyExitTriggered(address indexed sentinel, string reason);
    event YieldHarvested(uint256 amount, uint64 timestamp);

    // Action types
    enum ActionType {
        DEPOSIT_AAVE,
        WITHDRAW_AAVE,
        REBALANCE,
        EMERGENCY_EXIT,
        HARVEST_YIELD
    }

    // Strategy struct
    struct UserStrategy {
        string description;
        uint8 riskLevel;        // 1=conservative, 2=balanced, 3=aggressive
        uint16 aaveAllocation;  // basis points (0-10000)
        uint16 stableAllocation;
        uint16 ethAllocation;
        bool autoRebalance;
        uint256 rebalanceThreshold; // basis points deviation trigger
        bool emergencyExitEnabled;
        uint256 stopLossThreshold;  // basis points from entry
    }

    // Position snapshot
    struct PositionSnapshot {
        uint256 totalValueUSD;
        uint256 aaveBalance;
        uint256 stableBalance;
        uint256 ethBalance;
        uint256 pendingYield;
        uint64 lastUpdated;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function totalAssets() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function getUserStrategy(address user) external view returns (UserStrategy memory);
    function setUserStrategy(UserStrategy calldata strategy) external;
    function getUserPosition(address user) external view returns (PositionSnapshot memory);
}