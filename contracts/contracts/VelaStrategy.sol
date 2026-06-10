// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VelaStrategy
 * @notice Stores and validates user-defined portfolio strategies.
 *         Strategies define how agents allocate assets across protocols.
 */
contract VelaStrategy is Ownable {

    struct Strategy {
        string description;         // Plain-English strategy description
        uint8 riskLevel;            // 1=conservative, 2=balanced, 3=aggressive
        uint16 aaveAllocation;      // basis points (0-10000 = 0-100%)
        uint16 stableHoldAlloc;     // basis points held as stablecoins
        uint16 ethHoldAlloc;        // basis points held as ETH
        bool autoRebalance;
        uint256 rebalanceThreshold; // drift in bps before rebalance triggers
        bool emergencyExitEnabled;
        uint256 stopLossThreshold;  // bps below entry to trigger emergency exit
        uint64 updatedAt;
        bool isActive;
    }

    // Preset templates
    struct StrategyTemplate {
        string name;
        string description;
        uint8 riskLevel;
        uint16 aaveAllocation;
        uint16 stableHoldAlloc;
        uint16 ethHoldAlloc;
        uint256 rebalanceThreshold;
        uint256 stopLossThreshold;
    }

    mapping(address => Strategy) public userStrategies;
    StrategyTemplate[] public templates;

    // Events
    event StrategySet(address indexed user, string description, uint8 riskLevel);
    event StrategyDeactivated(address indexed user);
    event TemplateAdded(uint256 indexed templateId, string name);

    // Errors
    error AllocationsMustSum10000(uint16 total);
    error InvalidRiskLevel(uint8 level);
    error InvalidThreshold();

    constructor() Ownable(msg.sender) {
        _initializeTemplates();
    }

    /**
     * @notice Initialize preset strategy templates
     */
    function _initializeTemplates() internal {
        // Conservative: 70% Aave stable yield, 20% stables, 10% ETH
        templates.push(StrategyTemplate({
            name: "Stable Income",
            description: "Maximize stability. 70% Aave lending, 20% USDC, 10% ETH. Low risk, consistent yield.",
            riskLevel: 1,
            aaveAllocation: 7000,
            stableHoldAlloc: 2000,
            ethHoldAlloc: 1000,
            rebalanceThreshold: 500,   // 5% drift
            stopLossThreshold: 1000    // 10% stop loss
        }));

        // Balanced: 50% Aave, 20% stables, 30% ETH
        templates.push(StrategyTemplate({
            name: "Balanced Growth",
            description: "Balance yield and growth. 50% Aave, 20% USDC, 30% ETH. Medium risk, steady returns.",
            riskLevel: 2,
            aaveAllocation: 5000,
            stableHoldAlloc: 2000,
            ethHoldAlloc: 3000,
            rebalanceThreshold: 800,   // 8% drift
            stopLossThreshold: 2000    // 20% stop loss
        }));

        // Aggressive: 30% Aave, 10% stables, 60% ETH
        templates.push(StrategyTemplate({
            name: "Aggressive Yield",
            description: "Maximize returns. 30% Aave, 10% USDC, 60% ETH exposure. Higher risk, higher upside.",
            riskLevel: 3,
            aaveAllocation: 3000,
            stableHoldAlloc: 1000,
            ethHoldAlloc: 6000,
            rebalanceThreshold: 1500,  // 15% drift
            stopLossThreshold: 3500    // 35% stop loss
        }));
    }

    /**
     * @notice Set a custom strategy
     */
    function setStrategy(
        string calldata description,
        uint8 riskLevel,
        uint16 aaveAllocation,
        uint16 stableHoldAlloc,
        uint16 ethHoldAlloc,
        bool autoRebalance,
        uint256 rebalanceThreshold,
        bool emergencyExitEnabled,
        uint256 stopLossThreshold
    ) external {
        if (riskLevel < 1 || riskLevel > 3) revert InvalidRiskLevel(riskLevel);
        uint16 total = aaveAllocation + stableHoldAlloc + ethHoldAlloc;
        if (total != 10000) revert AllocationsMustSum10000(total);
        if (rebalanceThreshold == 0 || rebalanceThreshold > 5000) revert InvalidThreshold();

        userStrategies[msg.sender] = Strategy({
            description: description,
            riskLevel: riskLevel,
            aaveAllocation: aaveAllocation,
            stableHoldAlloc: stableHoldAlloc,
            ethHoldAlloc: ethHoldAlloc,
            autoRebalance: autoRebalance,
            rebalanceThreshold: rebalanceThreshold,
            emergencyExitEnabled: emergencyExitEnabled,
            stopLossThreshold: stopLossThreshold,
            updatedAt: uint64(block.timestamp),
            isActive: true
        });

        emit StrategySet(msg.sender, description, riskLevel);
    }

    /**
     * @notice Apply a preset template
     */
    function applyTemplate(uint256 templateId) external {
        require(templateId < templates.length, "Invalid template");
        StrategyTemplate memory t = templates[templateId];

        userStrategies[msg.sender] = Strategy({
            description: t.description,
            riskLevel: t.riskLevel,
            aaveAllocation: t.aaveAllocation,
            stableHoldAlloc: t.stableHoldAlloc,
            ethHoldAlloc: t.ethHoldAlloc,
            autoRebalance: true,
            rebalanceThreshold: t.rebalanceThreshold,
            emergencyExitEnabled: true,
            stopLossThreshold: t.stopLossThreshold,
            updatedAt: uint64(block.timestamp),
            isActive: true
        });

        emit StrategySet(msg.sender, t.description, t.riskLevel);
    }

    /**
     * @notice Deactivate strategy (pause agent execution)
     */
    function deactivateStrategy() external {
        userStrategies[msg.sender].isActive = false;
        emit StrategyDeactivated(msg.sender);
    }

    function getStrategy(address user) external view returns (Strategy memory) {
        return userStrategies[user];
    }

    function getTemplates() external view returns (StrategyTemplate[] memory) {
        return templates;
    }

    function hasActiveStrategy(address user) external view returns (bool) {
        return userStrategies[user].isActive;
    }
}