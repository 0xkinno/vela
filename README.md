# VELA — Autonomous DeFi Portfolio Manager

![Network](https://img.shields.io/badge/Network-Arbitrum_Sepolia-12B8FF?style=flat-square&labelColor=080C18)
![Track](https://img.shields.io/badge/Track-Best_Agentic_Project-00D68F?style=flat-square&labelColor=080C18)
![Agents](https://img.shields.io/badge/Agents-3_Active-00D68F?style=flat-square&labelColor=080C18)
![Status](https://img.shields.io/badge/Status-Live_Testnet-00D68F?style=flat-square&labelColor=080C18)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square&labelColor=080C18)

> **Your capital works 24/7. You do nothing.**

VELA is a non-custodial, AI-agent-powered DeFi portfolio manager deployed on Arbitrum. Deposit USDC into a smart vault, configure your strategy in plain English, and three specialized AI agents handle everything — farming yield on Aave, rebalancing positions, and defending against risk — all without a single wallet popup.

Every agent decision is reasoned by Claude/Groq LLM and permanently logged onchain. Full transparency. Full custody. Zero manual intervention.

| | |
|---|---|
| **Live App** | https://vela-protocol.vercel.app |
| **Contracts** | Arbitrum Sepolia |
| **VelaVault** | `0xaD7E5ACaCc8989850bF27b4Fa25ff4f922106386` |
| **VelaAgentRegistry** | `0x2518853d8a6799734ded70857F0cFFC26a175C14` |
| **VelaStrategy** | `0x02185363c7d89A98FA5E1f1596a1fe52f5e250ca` |
| **GitHub** | https://github.com/0xkinno/vela |
| **Track** | Arbitrum Open House London — Best Agentic Project |

---

## The Problem

DeFi yields exist everywhere on Arbitrum — Aave lending rates, Uniswap LP fees, stablecoin pools. But capturing them consistently requires:

- Monitoring rates across protocols 24/7
- Rebalancing positions when market conditions shift
- Exiting to safety when risk spikes
- Executing dozens of transactions per week

Most users either leave capital idle in a wallet earning nothing, or spend hours managing positions manually and still miss the optimal windows. The few automated solutions that exist are custodial — you hand over your keys.

**VELA solves this without taking custody of a single token.**

---

## What VELA Does

1. **You deposit USDC** into a non-custodial ERC-4626 vault on Arbitrum
2. **You set a strategy** — pick a preset or write plain English rules
3. **Three AI agents activate** and manage your portfolio autonomously
4. **You earn real yield** from Aave V3 while monitoring every agent decision in real time
5. **You withdraw anytime** — no lockups, no permission needed

---

## The Three Agents
┌─────────────────────────────────────────────────────────────────┐
│                        VELA Agent Stack                         │
├─────────────────┬───────────────────────┬───────────────────────┤
│   VELA Scout    │   VELA Allocator      │   VELA Sentinel       │
│   ─────────     │   ─────────────       │   ──────────────      │
│   Market Intel  │   Portfolio Execution │   Risk Guardian       │
├─────────────────┼───────────────────────┼───────────────────────┤
│ Reads Chainlink │ Decides allocations   │ Monitors positions    │
│ price feeds,    │ based on Scout data   │ continuously, watches │
│ Aave APY rates, │ and user strategy.    │ for liquidation risk, │
│ gas prices, and │ Executes onchain txns │ price crashes, and    │
│ market context  │ with full reasoning   │ protocol anomalies.   │
│ every cycle.    │ committed onchain.    │ Can emergency exit.   │
├─────────────────┼───────────────────────┼───────────────────────┤
│ Output:         │ Output:               │ Output:               │
│ Market report   │ Deploy/withdraw/      │ Health score, threat  │
│ with sentiment, │ rebalance txns with   │ level, emergency exit │
│ risk level, and │ onchain reasoning     │ if conditions met     │
│ opportunity     │ string logged to      │                       │
│ assessment      │ VelaAgentRegistry     │                       │
└─────────────────┴───────────────────────┴───────────────────────┘

---

## Architecture
┌─────────────────────────────────────────────────────────────────────┐
│                         User Interface                              │
│              React + Vite + Wagmi + Arbitrum Sepolia                │
└────────────────────────────┬────────────────────────────────────────┘
│ WebSocket + REST
┌────────────────────────────▼────────────────────────────────────────┐
│                      Agent Runner (Node.js)                         │
│                                                                     │
│   ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│   │ VELA Scout  │───▶│ VELA Allocator   │───▶│ VELA Sentinel    │  │
│   │ Groq LLM    │    │ Groq LLM         │    │ Groq LLM         │  │
│   │ Market scan │    │ Execute decision │    │ Risk monitoring  │  │
│   └─────────────┘    └──────────────────┘    └──────────────────┘  │
│                                │                                    │
│              Express + WebSocket server (port 3001)                 │
└────────────────────────────────┬────────────────────────────────────┘
│ viem + private key
┌────────────────────────────────▼────────────────────────────────────┐
│                    Arbitrum Sepolia (Chain ID 421614)                │
│                                                                     │
│   ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │   VelaVault    │  │  VelaAgentReg    │  │  VelaStrategy    │   │
│   │  ERC-4626      │  │  Execution logs  │  │  User strategies │   │
│   │  Non-custodial │  │  Agent auth      │  │  3 presets       │   │
│   └───────┬────────┘  └──────────────────┘  └──────────────────┘   │
│           │                                                         │
│   ┌───────▼────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│   │   Aave V3      │  │   Chainlink      │  │   Circle USDC    │   │
│   │   Yield source │  │   Price feeds    │  │   Testnet token  │   │
│   └────────────────┘  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

---

## Agent Decision Flow
Every 5 minutes:
Scout reads onchain data
│
▼
┌───────────────────────────────┐
│  Chainlink ETH/USD price      │
│  Aave USDC supply APY         │
│  Vault TVL + liquid balance   │
│  Gas price on Arbitrum        │
└───────────────┬───────────────┘
│
▼
Scout sends market report to Allocator
│
▼
┌───────────────────────────────┐
│  Is drift > 5% from target?   │
│  Is risk LOW or MEDIUM?        │
│  Is there enough liquid USDC? │
│  Keep 10% liquid at all times │
└───────────────┬───────────────┘
│
┌───────┴───────┐
▼               ▼
EXECUTE          HOLD
Deploy/Withdraw  Log reasoning
Log onchain      No tx needed
│
▼
VelaAgentRegistry.validateAndLog()
Reasoning string → permanent onchain record
│
▼
Sentinel runs every 2 minutes independently
│
▼
┌───────────────────────────────┐
│  ETH price change > 20%?      │
│  Aave APY = 0 (protocol bug)? │
│  Vault emergency mode?        │
└───────────────┬───────────────┘
│
┌───────┴───────┐
▼               ▼
EMERGENCY EXIT    ALL CLEAR
Pull all from     Health score
Aave → USDC       logged

---

## Smart Contracts

### VelaVault — `ERC-4626`
The core vault. Users deposit USDC, receive `velaUSDC` shares representing proportional ownership. Agents interact with Aave through the vault — they can never withdraw to external addresses. Emergency mode can be triggered by the Sentinel agent to pull all funds back to liquid USDC instantly.

### VelaAgentRegistry
Every agent action is validated here before execution. The registry checks agent identity, enforces per-transaction value limits, and permanently logs every decision with its reasoning string and timestamp. Anyone can read the full history onchain.

### VelaStrategy
Stores user portfolio strategies. Three preset templates (Stable Income, Balanced Growth, Aggressive Yield) plus fully custom strategies defined in plain English. Agents read the active strategy before every decision cycle.

---

## Strategy System

Users configure how agents behave using three presets or custom rules:

| Strategy | Aave | Stables | Rebalance Trigger | Stop-Loss |
|---|---|---|---|---|
| Stable Income | 70% | 30% | 5% drift | 10% |
| Balanced Growth | 50% | 20% | 8% drift | 20% |
| Aggressive Yield | 30% | 10% | 15% drift | 35% |

Custom example: *"Keep 60% in stablecoins during high volatility. Exit to USDC if ETH drops 15% in 24h. Never allocate more than 20% to a single pool."*

---

## Why This Wins

Most hackathon DeFi projects show a UI connected to a smart contract. VELA is different in four ways:

**1. Agents actually execute.** Not simulated, not mocked. The Allocator calls `agentDeployToAave()` with a real transaction on Arbitrum Sepolia, and that transaction carries a reasoning string written by an LLM — permanently onchain.

**2. Every decision is auditable.** `VelaAgentRegistry.getExecutionLogs()` returns every action ever taken — agent address, action type, amount, reasoning, timestamp. Any judge can query this on Arbiscan right now.

**3. Non-custodial by design.** Agents are scoped wallets. They can deploy to Aave and rebalance within the vault. They cannot transfer user funds to external addresses — enforced at the smart contract level, not just by policy.

**4. Consumer-facing PMF.** Every crypto holder with idle capital is the target user. The value proposition takes 10 seconds to understand: deposit, earn, agents handle the rest.

---

## Security Properties

- Agents cannot withdraw to external addresses — vault enforces this
- Per-transaction value cap enforced in VelaAgentRegistry
- Emergency exit pulls all funds to liquid USDC — available to Sentinel only
- ERC-4626 standard — fully compatible with DeFi tooling and auditable
- No admin key can drain user funds — only users can call `withdraw()`
- Open source contracts verified on Arbiscan

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin v5, ERC-4626 |
| Blockchain | Arbitrum Sepolia (Chain ID 421614) |
| Agent AI | Groq API — Llama 3.3 70B |
| Onchain Data | Chainlink price feeds, Aave V3 reserve data |
| Yield Source | Aave V3 on Arbitrum Sepolia |
| Agent Execution | viem, Node.js, Express, WebSocket |
| Frontend | React 18, Vite, Wagmi v2, Tailwind |
| Wallet | MetaMask, Rabby, OKX, Coinbase, WalletConnect |
| Deployment | Vercel (frontend), Railway (agents) |

---

## Running Locally

**Requirements:** Node.js 18+, MetaMask with Arbitrum Sepolia ETH

```bash
# Clone
git clone https://github.com/0xkinno/vela
cd vela

# Deploy contracts (optional — already deployed)
cd contracts
npm install
cp .env.example .env      # add PRIVATE_KEY + ARBITRUM_SEPOLIA_RPC
npx hardhat compile
npx hardhat run scripts/deploy.js --network arbitrumSepolia

# Start agents
cd ../agents
npm install
cp .env.example .env      # add GROQ_API_KEY + contract addresses
node index.js

# Start frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env      # add contract addresses
npm run dev
# Open http://localhost:3000
```

**Get testnet USDC:** https://faucet.circle.com — select Arbitrum Sepolia

---

## Project Structure
vela/
├── contracts/                    ← Hardhat project
│   ├── contracts/
│   │   ├── VelaVault.sol         ← ERC-4626 non-custodial vault
│   │   ├── VelaStrategy.sol      ← Strategy storage + templates
│   │   ├── VelaAgentRegistry.sol ← Agent auth + execution logs
│   │   └── interfaces/
│   │       └── IAaveV3.sol
│   ├── scripts/deploy.js
│   └── test/VelaVault.test.js
│
├── agents/                       ← Node.js autonomous agent runner
│   ├── index.js                  ← Orchestrator + WebSocket server
│   ├── scout.js                  ← Market intelligence agent
│   ├── allocator.js              ← Portfolio execution agent
│   ├── sentinel.js               ← Risk monitoring agent
│   └── lib/
│       ├── claude.js             ← Groq LLM wrapper
│       ├── onchain.js            ← Chainlink + Aave reads
│       └── contracts.js          ← ABI + execution functions
│
└── frontend/                     ← React + Vite app
└── src/
├── pages/
│   ├── Landing.jsx       ← Marketing page + live agent feed
│   ├── Dashboard.jsx     ← Portfolio overview
│   ├── Vault.jsx         ← Deposit + withdraw
│   ├── Strategy.jsx      ← Agent configuration
│   └── AgentLogs.jsx     ← Full onchain decision history
├── components/
│   ├── WalletConnect.jsx ← Multi-wallet modal
│   └── AgentFeed.jsx     ← Live WebSocket feed
└── hooks/
├── useVault.js       ← Vault reads + writes
└── useAgentFeed.js   ← WS + onchain log merger

---

## Deployed Contracts

All contracts verified on Arbitrum Sepolia:

| Contract | Address | Arbiscan |
|---|---|---|
| VelaVault | `0xaD7E5ACaCc8989850bF27b4Fa25ff4f922106386` | [View](https://sepolia.arbiscan.io/address/0xaD7E5ACaCc8989850bF27b4Fa25ff4f922106386) |
| VelaAgentRegistry | `0x2518853d8a6799734ded70857F0cFFC26a175C14` | [View](https://sepolia.arbiscan.io/address/0x2518853d8a6799734ded70857F0cFFC26a175C14) |
| VelaStrategy | `0x02185363c7d89A98FA5E1f1596a1fe52f5e250ca` | [View](https://sepolia.arbiscan.io/address/0x02185363c7d89A98FA5E1f1596a1fe52f5e250ca) |

---

## Roadmap

- **Mainnet deployment** — Arbitrum One with real USDC
- **Additional yield sources** — Uniswap V3 LP, GMX GLP, Pendle PT
- **Multi-asset vaults** — ETH, WBTC, ARB strategies
- **ZeroDev session keys** — gasless agent execution, no ETH required in agent wallet
- **Strategy marketplace** — share and fork community strategies
- **Mobile app** — monitor portfolio and agent activity on the go

---

## Team

Solo build — Arbitrum Open House London Buildathon 2025

*VELA — Capital That Never Sleeps, Never Stops, Never Needs You.*