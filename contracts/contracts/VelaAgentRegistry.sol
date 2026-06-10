// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VelaAgentRegistry
 * @notice Registers and authenticates VELA AI agents.
 *         Each agent has a type, permissions scope, and execution log.
 *         Only registered agents can call privileged vault functions.
 */
contract VelaAgentRegistry is Ownable, ReentrancyGuard {

    enum AgentType { SCOUT, ALLOCATOR, SENTINEL }
    enum AgentStatus { INACTIVE, ACTIVE, SUSPENDED }

    struct Agent {
        address agentAddress;
        AgentType agentType;
        AgentStatus status;
        string name;
        uint256 registeredAt;
        uint256 totalExecutions;
        uint256 lastExecutionAt;
        uint256 maxSingleTxValue;  // max USD value per single action (18 decimals)
        bool canEmergencyExit;
    }

    struct ExecutionLog {
        address agent;
        uint8 actionType;
        address asset;
        uint256 amount;
        string reasoning;
        uint64 timestamp;
        bytes32 txHash;
    }

    // Storage
    mapping(address => Agent) public agents;
    mapping(address => bool) public isRegistered;
    address[] public agentList;
    ExecutionLog[] public executionLogs;
    mapping(address => uint256[]) public agentExecutionIndices;

    // Events
    event AgentRegistered(address indexed agentAddress, AgentType agentType, string name);
    event AgentStatusChanged(address indexed agentAddress, AgentStatus newStatus);
    event ExecutionLogged(
        address indexed agent,
        uint8 actionType,
        uint256 amount,
        string reasoning,
        uint64 timestamp
    );

    // Errors
    error AgentNotRegistered(address agent);
    error AgentNotActive(address agent);
    error AgentAlreadyRegistered(address agent);
    error ExceedsMaxTxValue(uint256 requested, uint256 maximum);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new AI agent
     */
    function registerAgent(
        address agentAddress,
        AgentType agentType,
        string calldata name,
        uint256 maxSingleTxValue,
        bool canEmergencyExit
    ) external onlyOwner {
        if (isRegistered[agentAddress]) revert AgentAlreadyRegistered(agentAddress);

        agents[agentAddress] = Agent({
            agentAddress: agentAddress,
            agentType: agentType,
            status: AgentStatus.ACTIVE,
            name: name,
            registeredAt: block.timestamp,
            totalExecutions: 0,
            lastExecutionAt: 0,
            maxSingleTxValue: maxSingleTxValue,
            canEmergencyExit: canEmergencyExit
        });

        isRegistered[agentAddress] = true;
        agentList.push(agentAddress);

        emit AgentRegistered(agentAddress, agentType, name);
    }

    /**
     * @notice Set agent status (owner can suspend/reactivate)
     */
    function setAgentStatus(address agentAddress, AgentStatus status) external onlyOwner {
        if (!isRegistered[agentAddress]) revert AgentNotRegistered(agentAddress);
        agents[agentAddress].status = status;
        emit AgentStatusChanged(agentAddress, status);
    }

    /**
     * @notice Called by vault — validates agent and logs execution
     */
    function validateAndLog(
        address agentAddress,
        uint8 actionType,
        address asset,
        uint256 amount,
        string calldata reasoning
    ) external nonReentrant returns (bool) {
        if (!isRegistered[agentAddress]) revert AgentNotRegistered(agentAddress);
        if (agents[agentAddress].status != AgentStatus.ACTIVE) revert AgentNotActive(agentAddress);
        if (amount > agents[agentAddress].maxSingleTxValue) {
            revert ExceedsMaxTxValue(amount, agents[agentAddress].maxSingleTxValue);
        }

        // Update agent stats
        agents[agentAddress].totalExecutions++;
        agents[agentAddress].lastExecutionAt = block.timestamp;

        // Log execution
        uint256 logIndex = executionLogs.length;
        executionLogs.push(ExecutionLog({
            agent: agentAddress,
            actionType: actionType,
            asset: asset,
            amount: amount,
            reasoning: reasoning,
            timestamp: uint64(block.timestamp),
            txHash: blockhash(block.number - 1)
        }));

        agentExecutionIndices[agentAddress].push(logIndex);

        emit ExecutionLogged(agentAddress, actionType, amount, reasoning, uint64(block.timestamp));
        return true;
    }

    /**
     * @notice Check if agent can perform emergency exit
     */
    function canAgentEmergencyExit(address agentAddress) external view returns (bool) {
        if (!isRegistered[agentAddress]) return false;
        if (agents[agentAddress].status != AgentStatus.ACTIVE) return false;
        return agents[agentAddress].canEmergencyExit;
    }

    /**
     * @notice Get all execution logs (paginated)
     */
    function getExecutionLogs(uint256 offset, uint256 limit)
        external
        view
        returns (ExecutionLog[] memory)
    {
        uint256 total = executionLogs.length;
        if (offset >= total) return new ExecutionLog[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 size = end - offset;
        ExecutionLog[] memory result = new ExecutionLog[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = executionLogs[offset + i];
        }
        return result;
    }

    /**
     * @notice Get logs for a specific agent
     */
    function getAgentLogs(address agentAddress)
        external
        view
        returns (ExecutionLog[] memory)
    {
        uint256[] memory indices = agentExecutionIndices[agentAddress];
        ExecutionLog[] memory result = new ExecutionLog[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            result[i] = executionLogs[indices[i]];
        }
        return result;
    }

    /**
     * @notice Get total number of logs
     */
    function totalLogs() external view returns (uint256) {
        return executionLogs.length;
    }

    /**
     * @notice Get all registered agents
     */
    function getAllAgents() external view returns (Agent[] memory) {
        Agent[] memory result = new Agent[](agentList.length);
        for (uint256 i = 0; i < agentList.length; i++) {
            result[i] = agents[agentList[i]];
        }
        return result;
    }
}