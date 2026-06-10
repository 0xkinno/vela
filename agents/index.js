import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { runScoutCycle } from "./scout.js";
import { runAllocatorCycle } from "./allocator.js";
import { runSentinelCycle } from "./sentinel.js";
import { getVaultMetrics, buildMarketContext } from "./lib/onchain.js";
import { askClaude } from "./lib/claude.js";

const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  ws.on("close", () => { clients.delete(ws); });
  ws.on("error", () => clients.delete(ws));
});

function broadcast(event) {
  const msg = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ─── REST Endpoints ───────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", agents: ["scout", "allocator", "sentinel"], timestamp: new Date().toISOString() });
});

app.get("/api/feed", async (req, res) => {
  res.json(recentLogs.slice(0, parseInt(req.query.limit) || 50));
});

app.get("/api/vault/metrics", async (req, res) => {
  const metrics = await getVaultMetrics();
  res.json(metrics || { error: "Could not fetch vault metrics" });
});

app.get("/api/market", async (req, res) => {
  const context = await buildMarketContext();
  res.json(context);
});

app.post("/api/generate-strategy", async (req, res) => {
  const { preset, stopLoss, rebalance } = req.body;
  try {
    const result = await askClaude(
      "You are a DeFi portfolio strategy advisor. Write exactly 2-3 sentences of specific plain English portfolio rules. No preamble, no explanation, just the rules themselves.",
      `Generate custom DeFi strategy rules for: ${preset} strategy, stop-loss at ${stopLoss}%, rebalance ${rebalance}. Include specific percentage thresholds and conditions.`
    );
    const strategy = typeof result === 'string' ? result : (result.text || JSON.stringify(result));
    res.json({ strategy });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/agents/scout/run", async (req, res) => {
  try { res.json({ success: true, report: await runScoutCycle(broadcast) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/agents/allocator/run", async (req, res) => {
  try {
    const scout = await runScoutCycle(null);
    res.json({ success: true, result: await runAllocatorCycle(scout, broadcast) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/agents/sentinel/run", async (req, res) => {
  try { res.json({ success: true, result: await runSentinelCycle(broadcast) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/agents/run-all", async (req, res) => {
  try {
    const scoutReport = await runScoutCycle(broadcast);
    const allocatorResult = await runAllocatorCycle(scoutReport, broadcast);
    const sentinelResult = await runSentinelCycle(broadcast);
    res.json({ success: true, scoutReport, allocatorResult, sentinelResult });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── In-memory log store (for /api/feed) ─────────────────────────────────────

const recentLogs = [];

const originalBroadcast = broadcast;
function broadcastAndLog(event) {
  recentLogs.unshift({ ...event, ts: Date.now() });
  if (recentLogs.length > 200) recentLogs.pop();
  originalBroadcast(event);
}

// ─── Autonomous Agent Loop ────────────────────────────────────────────────────

let lastScoutReport = null;

async function runAgentLoop() {
  console.log("\n[VELA] ═══ Starting Agent Cycle ═══");
  try {
    lastScoutReport = await runScoutCycle(broadcastAndLog);
    await sleep(3000);
    if (lastScoutReport) await runAllocatorCycle(lastScoutReport, broadcastAndLog);
    await sleep(3000);
    await runSentinelCycle(broadcastAndLog);
  } catch (err) {
    console.error("[VELA] Agent loop error:", err.message);
    broadcastAndLog({ agent: "system", action: "ERROR", text: err.message, timestamp: new Date().toISOString() });
  }
  console.log("[VELA] ═══ Cycle Complete ═══\n");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n[VELA] Agent server running on http://localhost:${PORT}`);
  console.log("[VELA] WebSocket: ws://localhost:" + PORT);
  runAgentLoop();
  setInterval(runAgentLoop, 5 * 60 * 1000);
  setInterval(() => runSentinelCycle(broadcastAndLog), 2 * 60 * 1000);
});