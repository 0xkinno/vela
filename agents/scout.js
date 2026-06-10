import "dotenv/config";
import { askClaude } from "./lib/claude.js";
import { buildMarketContext } from "./lib/onchain.js";

const SCOUT_SYSTEM_PROMPT = `You are VELA Scout, an AI market intelligence agent for the VELA autonomous DeFi protocol on Arbitrum.

Your job is to analyze real onchain and market data, then produce a structured JSON market assessment that other VELA agents will use to make portfolio decisions.

You analyze:
- ETH price movements and trend
- Aave V3 USDC lending APY
- Vault health metrics
- Gas prices on Arbitrum
- Overall DeFi risk environment

You always respond with a JSON object in this exact format:
{
  "marketSentiment": "BULLISH" | "NEUTRAL" | "BEARISH" | "VOLATILE",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "ethTrend": "UP" | "FLAT" | "DOWN",
  "aaveOpportunity": "STRONG" | "MODERATE" | "WEAK",
  "recommendedAaveAllocation": <number 0-100 percent>,
  "reasoning": "<2-3 sentence plain English explanation visible to users>",
  "actionRequired": true | false,
  "suggestedAction": "DEPLOY_TO_AAVE" | "WITHDRAW_FROM_AAVE" | "REBALANCE" | "EMERGENCY_EXIT" | "HOLD",
  "urgency": "IMMEDIATE" | "NORMAL" | "LOW",
  "confidenceScore": <number 0-100>
}`;

/**
 * Run one Scout analysis cycle
 */
export async function runScoutCycle(broadcastFn = null) {
  console.log("[SCOUT] Starting market analysis cycle...");

  const marketData = await buildMarketContext();

  const userPrompt = `Analyze current market conditions and provide a portfolio recommendation.

Current market data:
${JSON.stringify(marketData, null, 2)}

Provide your structured assessment. Consider:
1. Is the Aave APY attractive enough to deploy capital?
2. Is ETH price stable or volatile? Should we hold more ETH or reduce exposure?
3. Is there any urgent risk that requires immediate action?
4. What percentage of vault assets should be in Aave right now?

Return ONLY valid JSON.`;

  const assessment = await askClaude(SCOUT_SYSTEM_PROMPT, userPrompt);

  const result = {
    type: "SCOUT_REPORT",
    timestamp: new Date().toISOString(),
    marketData,
    assessment,
  };

  console.log("[SCOUT] Assessment complete:", JSON.stringify(assessment, null, 2));

  // Broadcast to connected WebSocket clients
  if (broadcastFn) {
    broadcastFn({
      agentType: "SCOUT",
      agentName: "VELA Scout",
      action: assessment.suggestedAction,
      reasoning: assessment.reasoning,
      sentiment: assessment.marketSentiment,
      riskLevel: assessment.riskLevel,
      confidence: assessment.confidenceScore,
      timestamp: new Date().toISOString(),
      marketData: {
        ethPrice: marketData.ethPriceUSD,
        aaveAPY: marketData.aaveUSDCSupplyAPY,
      },
    });
  }

  return result;
}