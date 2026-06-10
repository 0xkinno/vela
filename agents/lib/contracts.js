import {
    formatUnits,
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
  } from "viem";
  import { privateKeyToAccount } from "viem/accounts";
  import { arbitrumSepolia } from "viem/chains";
  
  export const ADDRESSES = {
    VelaVault:         process.env.VELA_VAULT_ADDRESS,
    VelaAgentRegistry: process.env.VELA_REGISTRY_ADDRESS,
    VelaStrategy:      process.env.VELA_STRATEGY_ADDRESS,
    USDC:              process.env.USDC_ADDRESS,
    AavePool:          process.env.AAVE_POOL_ADDRESS,
    ChainlinkETHUSD:   process.env.CHAINLINK_ETH_USD,
  };
  
  export const VAULT_WRITE_ABI = [
    {
      name: "agentDeployToAave",
      type: "function",
      inputs: [
        { name: "amount", type: "uint256" },
        { name: "reasoning", type: "string" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      name: "agentWithdrawFromAave",
      type: "function",
      inputs: [
        { name: "amount", type: "uint256" },
        { name: "reasoning", type: "string" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      name: "agentLogRebalance",
      type: "function",
      inputs: [{ name: "reasoning", type: "string" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      name: "agentEmergencyExit",
      type: "function",
      inputs: [{ name: "reason", type: "string" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ];
  
  export const VAULT_READ_ABI = [
    {
      name: "getVaultMetrics",
      type: "function",
      inputs: [],
      outputs: [
        { name: "tvl", type: "uint256" },
        { name: "liquidBalance", type: "uint256" },
        { name: "aaveBalance", type: "uint256" },
        { name: "totalDep", type: "uint256" },
        { name: "totalWith", type: "uint256" },
        { name: "yieldGenerated", type: "uint256" },
        { name: "agentExecs", type: "uint256" },
        { name: "isEmergency", type: "bool" },
      ],
      stateMutability: "view",
    },
    {
      name: "totalAaveDeposited",
      type: "function",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
    {
      name: "emergencyMode",
      type: "function",
      inputs: [],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "view",
    },
  ];
  
  export const REGISTRY_ABI = [
    {
      name: "validateAndLog",
      type: "function",
      inputs: [
        { name: "agentAddress", type: "address" },
        { name: "actionType", type: "uint8" },
        { name: "asset", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "reasoning", type: "string" },
      ],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
    },
    {
      name: "isRegistered",
      type: "function",
      inputs: [{ name: "", type: "address" }],
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "view",
    },
    {
      name: "totalLogs",
      type: "function",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
    },
  ];
  
  export const CHAINLINK_ABI = [
    {
      name: "latestRoundData",
      type: "function",
      inputs: [],
      outputs: [
        { name: "roundId", type: "uint80" },
        { name: "answer", type: "int256" },
        { name: "startedAt", type: "uint256" },
        { name: "updatedAt", type: "uint256" },
        { name: "answeredInRound", type: "uint80" },
      ],
      stateMutability: "view",
    },
  ];
  
  export const AAVE_POOL_ABI = [
    {
      name: "getReserveData",
      type: "function",
      inputs: [{ name: "asset", type: "address" }],
      outputs: [
        { name: "configuration", type: "uint256" },
        { name: "liquidityIndex", type: "uint128" },
        { name: "currentLiquidityRate", type: "uint128" },
        { name: "variableBorrowIndex", type: "uint128" },
        { name: "currentVariableBorrowRate", type: "uint128" },
        { name: "currentStableBorrowRate", type: "uint128" },
        { name: "lastUpdateTimestamp", type: "uint40" },
        { name: "id", type: "uint16" },
        { name: "aTokenAddress", type: "address" },
        { name: "stableDebtTokenAddress", type: "address" },
        { name: "variableDebtTokenAddress", type: "address" },
        { name: "interestRateStrategyAddress", type: "address" },
        { name: "accruedToTreasury", type: "uint128" },
        { name: "unbacked", type: "uint128" },
        { name: "isolationModeTotalDebt", type: "uint128" },
      ],
      stateMutability: "view",
    },
  ];
  
  export function formatVaultMetrics(raw) {
    if (!raw) return null;
    return {
      tvl:            parseFloat(formatUnits(raw.tvl, 6)).toFixed(2),
      liquidBalance:  parseFloat(formatUnits(raw.liquidBalance, 6)).toFixed(2),
      aaveBalance:    parseFloat(formatUnits(raw.aaveBalance, 6)).toFixed(2),
      yieldGenerated: parseFloat(formatUnits(raw.yieldGenerated, 6)).toFixed(4),
      agentExecs:     Number(raw.agentExecs),
      isEmergency:    raw.isEmergency,
    };
  }
  
  function getAgentClients() {
    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(process.env.ARBITRUM_SEPOLIA_RPC),
    });
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.ARBITRUM_SEPOLIA_RPC),
    });
    return { account, walletClient, publicClient };
  }
  
  export async function executeDeployToAave(amountUSDC, reasoning) {
    const { account, walletClient, publicClient } = getAgentClients();
    const amount = parseUnits(amountUSDC.toString(), 6);
    const hash = await walletClient.writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_WRITE_ABI,
      functionName: "agentDeployToAave",
      args: [amount, reasoning],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[ALLOCATOR] Deployed to Aave. Tx: ${hash}`);
    return { hash };
  }
  
  export async function executeWithdrawFromAave(amountUSDC, reasoning) {
    const { account, walletClient, publicClient } = getAgentClients();
    const amount = parseUnits(amountUSDC.toString(), 6);
    const hash = await walletClient.writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_WRITE_ABI,
      functionName: "agentWithdrawFromAave",
      args: [amount, reasoning],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[ALLOCATOR] Withdrew from Aave. Tx: ${hash}`);
    return { hash };
  }
  
  export async function executeLogRebalance(reasoning) {
    const { account, walletClient, publicClient } = getAgentClients();
    const hash = await walletClient.writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_WRITE_ABI,
      functionName: "agentLogRebalance",
      args: [reasoning],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return { hash };
  }
  
  export async function executeEmergencyExit(reason) {
    const { account, walletClient, publicClient } = getAgentClients();
    const hash = await walletClient.writeContract({
      address: ADDRESSES.VelaVault,
      abi: VAULT_WRITE_ABI,
      functionName: "agentEmergencyExit",
      args: [reason],
      account,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[SENTINEL] Emergency exit. Tx: ${hash}`);
    return { hash };
  }