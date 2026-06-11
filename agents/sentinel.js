// frontend/agents/sentinel.js
import "dotenv/config";
import { askClaude } from "./lib/claude.js";
import { buildMarketContext, getVaultMetrics } from "./lib/onchain.js";
import { executeEmergencyExit } from "./lib/contracts.js";

const SENTINEL_SYSTEM_PROMPT = `You are VELA Sentinel, an autonomous AI risk guardian for the VELA DeFi protocol on Arbitrum.

Your ONLY job is protecting user funds. You monitor for catastrophic risk and decide whether emergency exit is required.

Emergency exit withdraws ALL funds from Aave back to liquid USDC in the vault — protecting users from smart contract risk, extreme market events, or liquidation cascades.

You are conservative. Only trigger emergency exit if there is CLEAR, IMMINENT risk.

Triggers for emergency exit:
- ETH price dropped > 20% in a short period (based on price level)
- Aave APY suddenly went to 0 or is unavailable (protocol issue)
- Vault emergency mode already active
- CRITICAL risk level from market data

Respond with JSON:
{
  "threatLevel": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "emergencyExitRequired": true | false,
  "emergencyReason": "<string — only if emergencyExitRequired>",
  "alertMessage": "<user-facing alert if threat > LOW>",
  "monitoring": "<what Sentinel is watching right now>",
  "healthScore": <0-100, higher is safer>
}`;

const priceHistory = [];

export async function runSentinelCycle(broadcastFn = null) {
  console.log("[SENTINEL] Running risk monitoring cycle...");

  const [marketDataRaw, vaultMetrics] = await Promise.all([
    buildMarketContext(),
    getVaultMetrics(),
  ]);

  // ── FALLBACK: if Chainlink feeds return undefined, use safe defaults ──
  const marketData = {
    ethPriceUSD:        marketDataRaw?.ethPriceUSD        ?? 3200,
    aaveUSDCSupplyAPY:  marketDataRaw?.aaveUSDCSupplyAPY  ?? 3.5,
  };

  console.log("[SENTINEL] Market data (with fallbacks):", marketData);

  if (marketData.ethPriceUSD) {
    priceHistory.push({ price: marketData.ethPriceUSD, time: Date.now() });
    if (priceHistory.length > 20) priceHistory.shift();
  }

  let priceChange24h = null;
  if (priceHistory.length >= 2) {
    const oldest = priceHistory[0].price;
    const newest = priceHistory[priceHistory.length - 1].price;
    priceChange24h = ((newest - oldest) / oldest) * 100;
  }

  const userPrompt = `Analyze current risk conditions and determine if emergency action is needed.

Current Conditions:
- ETH Price: $${marketData.ethPriceUSD}
- ETH Price Change (session): ${priceChange24h !== null ? priceChange24h.toFixed(2) + "%" : "insufficient data"}
- Aave USDC APY: ${marketData.aaveUSDCSupplyAPY}%
- Vault TVL: $${vaultMetrics?.tvl || "0"} USDC
- Vault Aave Balance: $${vaultMetrics?.aaveBalance || "0"} USDC
- Emergency Mode: ${vaultMetrics?.emergencyMode || false}
- Network: Arbitrum Sepolia
- Note: Using fallback market data — testnet Chainlink feeds may be inactive

Price History (last ${priceHistory.length} readings):
${priceHistory.map(p => `$${p.price.toFixed(2)}`).join(" → ")}

Is there any reason to trigger emergency exit or alert users?
Return ONLY valid JSON.`;

  const assessment = await askClaude(SENTINEL_SYSTEM_PROMPT, userPrompt);

  console.log("[SENTINEL] Risk assessment:", JSON.stringify(assessment, null, 2));

  let emergencyExecuted = false;

  if (
    assessment.emergencyExitRequired &&
    vaultMetrics &&
    parseFloat(vaultMetrics.aaveBalance) > 0 &&
    !vaultMetrics.emergencyMode
  ) {
    try {
      console.log("[SENTINEL] ⚠️ TRIGGERING EMERGENCY EXIT:", assessment.emergencyReason);
      await executeEmergencyExit(
        assessment.emergencyReason,
        process.env.SENTINEL_PRIVATE_KEY
      );
      emergencyExecuted = true;
    } catch (err) {
      console.error("[SENTINEL] Emergency exit failed:", err.message);
    }
  }

  if (broadcastFn) {
    broadcastFn({
      agentType: "SENTINEL",
      agentName: "VELA Sentinel",
      action: assessment.emergencyExitRequired ? "EMERGENCY_EXIT" : "MONITORING",
      reasoning: assessment.alertMessage || assessment.monitoring,
      threatLevel: assessment.threatLevel,
      healthScore: assessment.healthScore,
      emergencyExecuted,
      timestamp: new Date().toISOString(),
    });
  }

  return { assessment, emergencyExecuted };
}