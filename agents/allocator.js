import "dotenv/config";
import { askClaude } from "./lib/claude.js";
import { buildMarketContext, getVaultMetrics } from "./lib/onchain.js";
import {
  executeDeployToAave,
  executeWithdrawFromAave,
  executeLogRebalance,
} from "./lib/contracts.js";

const ALLOCATOR_SYSTEM_PROMPT = `You are VELA Allocator, an autonomous AI portfolio manager executing real DeFi transactions on Arbitrum.

You receive:
- Current market assessment from Scout agent
- Current vault state (how much is in Aave vs liquid)
- User strategy settings

Your job is to decide whether to execute an allocation change and construct the EXACT reasoning string that will be stored permanently on the Arbitrum blockchain.

Your blockchain reasoning must be clear, specific, and reference real data. Users will read this reasoning in their dashboard.

Respond with JSON:
{
  "shouldExecute": true | false,
  "action": "DEPLOY_TO_AAVE" | "WITHDRAW_FROM_AAVE" | "REBALANCE" | "HOLD",
  "amountUSDC": <number or null>,
  "onchainReasoning": "<the exact string to store on Arbitrum blockchain — reference specific numbers>",
  "userFacingExplanation": "<friendly explanation for dashboard>",
  "expectedOutcome": "<what this action achieves>",
  "riskAssessment": "<one sentence risk note>"
}`;

/**
 * Run one Allocator decision cycle
 */
export async function runAllocatorCycle(scoutReport, broadcastFn = null) {
  console.log("[ALLOCATOR] Running allocation decision cycle...");

  const vaultMetrics = await getVaultMetrics();
  if (!vaultMetrics) {
    console.log("[ALLOCATOR] Cannot read vault metrics. Skipping cycle.");
    return null;
  }

  const totalTVL = parseFloat(vaultMetrics.tvl);
  const currentAave = parseFloat(vaultMetrics.aaveBalance);
  const liquidBalance = parseFloat(vaultMetrics.liquidBalance);
  const currentAavePct = totalTVL > 0 ? (currentAave / totalTVL) * 100 : 0;

  const userPrompt = `Make a portfolio allocation decision based on Scout report and vault state.

Scout Assessment:
${JSON.stringify(scoutReport.assessment, null, 2)}

Current Vault State:
- Total TVL: $${totalTVL.toFixed(2)} USDC
- In Aave: $${currentAave.toFixed(2)} USDC (${currentAavePct.toFixed(1)}%)
- Liquid: $${liquidBalance.toFixed(2)} USDC
- Emergency Mode: ${vaultMetrics.emergencyMode}
- Total Agent Executions: ${vaultMetrics.agentExecutions}

Target Aave Allocation: ${scoutReport.assessment.recommendedAaveAllocation}%
Current Aave Allocation: ${currentAavePct.toFixed(1)}%

Market Data:
- ETH Price: $${scoutReport.marketData.ethPriceUSD}
- Aave USDC APY: ${scoutReport.marketData.aaveUSDCSupplyAPY}%

Rules:
- Only execute if allocation drift > 5% from target
- Never deploy if risk is CRITICAL or emergency mode active
- Keep minimum 10% liquid at all times
- DEPLOY if current% < target% and risk is LOW or MEDIUM
- WITHDRAW if current% > target% or risk is HIGH/CRITICAL
- Amounts must be whole USDC numbers

Return ONLY valid JSON.`;

  const decision = await askClaude(ALLOCATOR_SYSTEM_PROMPT, userPrompt);

  console.log("[ALLOCATOR] Decision:", JSON.stringify(decision, null, 2));

  let txHash = null;

  if (decision.shouldExecute && !vaultMetrics.emergencyMode) {
    try {
      if (
        decision.action === "DEPLOY_TO_AAVE" &&
        decision.amountUSDC > 0 &&
        decision.amountUSDC <= liquidBalance * 0.9 // keep 10% liquid
      ) {
        const result = await executeDeployToAave(
          decision.amountUSDC,
          decision.onchainReasoning,
          process.env.ALLOCATOR_PRIVATE_KEY
        );
        txHash = result.hash;
      } else if (
        decision.action === "WITHDRAW_FROM_AAVE" &&
        decision.amountUSDC > 0 &&
        decision.amountUSDC <= currentAave
      ) {
        const result = await executeWithdrawFromAave(
          decision.amountUSDC,
          decision.onchainReasoning,
          process.env.ALLOCATOR_PRIVATE_KEY
        );
        txHash = result.hash;
      } else if (decision.action === "REBALANCE") {
        const result = await executeLogRebalance(
          decision.onchainReasoning,
          process.env.ALLOCATOR_PRIVATE_KEY
        );
        txHash = result.hash;
      }
    } catch (err) {
      console.error("[ALLOCATOR] Execution error:", err.message);
    }
  }

  // Broadcast to dashboard
  if (broadcastFn) {
    broadcastFn({
      agentType: "ALLOCATOR",
      agentName: "VELA Allocator",
      action: decision.action,
      reasoning: decision.userFacingExplanation,
      onchainReasoning: decision.onchainReasoning,
      amountUSDC: decision.amountUSDC,
      executed: decision.shouldExecute && txHash !== null,
      txHash,
      expectedOutcome: decision.expectedOutcome,
      timestamp: new Date().toISOString(),
      vaultState: {
        tvl: totalTVL,
        aaveBalance: currentAave,
        liquidBalance,
      },
    });
  }

  return { decision, txHash };
}