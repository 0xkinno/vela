import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { arbitrumSepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.ARBITRUM_SEPOLIA_RPC),
});

// Minimal ABIs for reading
const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);

const CHAINLINK_ABI = parseAbi([
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
  "function decimals() view returns (uint8)",
]);

const AAVE_POOL_ABI = parseAbi([
  "function getReserveData(address asset) view returns (uint256, uint128, uint128, uint128, uint128, uint128, uint40, uint16, address, address, address, address, uint128, uint128, uint128)",
]);

const VAULT_ABI = parseAbi([
  "function totalAssets() view returns (uint256)",
  "function totalAaveDeposited() view returns (uint256)",
  "function totalAgentExecutions() view returns (uint256)",
  "function totalYieldGenerated() view returns (uint256)",
  "function emergencyMode() view returns (bool)",
  "function getVaultMetrics() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)",
  "function getUserInfo(address) view returns (uint256, uint256, uint256, uint256, uint64)",
]);

/**
 * Get ETH/USD price from Chainlink
 */
export async function getEthPrice() {
  try {
    const [, answer, , ,] = await publicClient.readContract({
      address: process.env.CHAINLINK_ETH_USD,
      abi: CHAINLINK_ABI,
      functionName: "latestRoundData",
    });
    const decimals = await publicClient.readContract({
      address: process.env.CHAINLINK_ETH_USD,
      abi: CHAINLINK_ABI,
      functionName: "decimals",
    });
    return Number(formatUnits(answer, decimals));
  } catch (e) {
    console.error("Chainlink read error:", e.message);
    return null;
  }
}

/**
 * Get Aave USDC supply APY
 */
export async function getAaveUSDCRate() {
  try {
    const data = await publicClient.readContract({
      address: process.env.AAVE_POOL_ADDRESS,
      abi: AAVE_POOL_ABI,
      functionName: "getReserveData",
      args: [process.env.USDC_ADDRESS],
    });
    // currentLiquidityRate is in RAY (1e27), convert to APY %
    const rayRate = data[2]; // currentLiquidityRate
    const apy = (Number(rayRate) / 1e27) * 100;
    return apy;
  } catch (e) {
    console.error("Aave rate read error:", e.message);
    return null;
  }
}

/**
 * Get vault metrics
 */
export async function getVaultMetrics() {
  try {
    const result = await publicClient.readContract({
      address: process.env.VELA_VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "getVaultMetrics",
    });
    return {
      tvl: formatUnits(result[0], 6),
      liquidBalance: formatUnits(result[1], 6),
      aaveBalance: formatUnits(result[2], 6),
      totalDeposited: formatUnits(result[3], 6),
      totalWithdrawn: formatUnits(result[4], 6),
      yieldGenerated: formatUnits(result[5], 6),
      agentExecutions: Number(result[6]),
      emergencyMode: result[7],
    };
  } catch (e) {
    console.error("Vault metrics error:", e.message);
    return null;
  }
}

/**
 * Get USDC balance of an address
 */
export async function getUSDCBalance(address) {
  try {
    const balance = await publicClient.readContract({
      address: process.env.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    return formatUnits(balance, 6);
  } catch (e) {
    return "0";
  }
}

/**
 * Get recent block gas prices
 */
export async function getGasPrice() {
  try {
    const gasPrice = await publicClient.getGasPrice();
    return formatUnits(gasPrice, 9); // in gwei
  } catch (e) {
    return null;
  }
}

/**
 * Build complete market context for Claude
 */
export async function buildMarketContext() {
  const [ethPrice, aaveRate, vaultMetrics, gasPrice] = await Promise.all([
    getEthPrice(),
    getAaveUSDCRate(),
    getVaultMetrics(),
    getGasPrice(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    ethPriceUSD: ethPrice,
    aaveUSDCSupplyAPY: aaveRate?.toFixed(4),
    vault: vaultMetrics,
    gasPriceGwei: gasPrice,
    network: "Arbitrum Sepolia",
  };
}