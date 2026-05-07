# amEmployer

<p align="center">
  <strong>Autonomous AI Employer Platform on Celo</strong><br/>
  Decomposes jobs into microtasks · Validates worker output with AI · Pays in cUSD automatically
</p>

<p align="center">
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white"/>
  <img alt="Celo" src="https://img.shields.io/badge/Celo-Alfajores-FCFF52?logo=celo&logoColor=black"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white"/>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white"/>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white"/>
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green"/>
</p>

---

## Overview

amEmployer is an end-to-end autonomous work platform where AI agents handle the entire employment lifecycle on-chain:

| Step | Actor | Action |
|------|-------|--------|
| 1 | **AI Employer Agent** | Receives a job description and decomposes it into structured microtasks |
| 2 | **TaskManager Contract** | Locks cUSD in escrow per task; enforces deadlines and payment rules |
| 3 | **Workers** | Human, scripted, or AI agents pick up open tasks and submit work |
| 4 | **AI Validator Agent** | Scores each submission; approves payment or rejects and re-queues |
| 5 | **Smart Contract** | Releases cUSD directly to the worker's wallet — no intermediary |

No manual approvals. No payment delays. Fully autonomous.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         amEmployer Platform                             │
├────────────────┬───────────────────────────────┬────────────────────────┤
│    Frontend    │           Backend             │    Celo Blockchain     │
│  Next.js 14    │   Express · BullMQ · WS       │   Alfajores Testnet    │
│                │                               │                        │
│  Employer      │  ┌─────────────────────────┐  │  ┌──────────────────┐  │
│  Dashboard  ───┼──│    AI Orchestrator      │──┼──│ TaskManager.sol  │  │
│                │  │  · Job Decomposition    │  │  │ · createTask()   │  │
│  Worker        │  │  · Task Assignment      │  │  │ · submitWork()   │  │
│  Dashboard     │  │  · Result Validation    │  │  │ · verifyTask()   │  │
│                │  │  · Payment Trigger      │  │  │ · auto-payout    │  │
│  Simulation    │  └─────────────────────────┘  │  └──────────────────┘  │
│  Dashboard     │                               │                        │
│                │  ┌─────────────────────────┐  │  ┌──────────────────┐  │
│  Treasury      │  │   Queue System (BullMQ) │  │  │WorkerRegistry    │  │
│  Dashboard     │  │  · Decomposition        │  │  │· Soulbound NFT   │  │
│                │  │  · Assignment           │  │  │· Reputation 1-10 │  │
│                │  │  · Validation           │  │  └──────────────────┘  │
│                │  │  · Payment              │  │                        │
│                │  │  · Simulation           │  │  cUSD · ERC-20         │
│                │  └─────────────────────────┘  │  Escrow + Auto-Pay     │
└────────────────┴───────────────────────────────┴────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24 · Hardhat · OpenZeppelin 5.x |
| Blockchain | Celo Alfajores testnet · cUSD stablecoin · ethers.js v6 |
| Backend | Node.js 20 · Express · TypeScript · Prisma ORM |
| Database | PostgreSQL 16 |
| Queues | BullMQ · Redis 7 |
| AI Providers | Anthropic Claude Opus · OpenAI GPT-4o · Mock (no-key demo) |
| Real-time | Socket.io WebSockets |
| Frontend | Next.js 14 App Router · Tailwind CSS · Framer Motion · Recharts |
| Infrastructure | Docker Compose (postgres · redis · backend · frontend) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- A Celo Alfajores wallet with testnet CELO and cUSD — [faucet.celo.org](https://faucet.celo.org)

### 1. Clone & Install

```bash
git clone https://github.com/phessophissy/amEmployer.git
cd amEmployer
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and set the following required values:

| Variable | Description |
|----------|-------------|
| `EMPLOYER_PRIVATE_KEY` | Wallet private key that will sign job creation transactions |
| `AI_VALIDATOR_PRIVATE_KEY` | Validator wallet (can reuse the employer key for local testing) |
| `ANTHROPIC_API_KEY` | From [console.anthropic.com](https://console.anthropic.com) |
| `DATABASE_URL` | Pre-configured for Docker Compose — no change needed |
| `REDIS_URL` | Pre-configured for Docker Compose — no change needed |
| `ENCRYPTION_KEY` | Random 32+ character string for wallet key storage |

> **Running without API keys?**  Set `AI_PROVIDER=mock` in `.env` — the built-in mock provider works fully offline with no external services required.

### 3. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Deploy Smart Contracts

```bash
# Compile
npm run contracts:compile

# Deploy to Alfajores testnet
npm run contracts:deploy:alfajores
```

After deployment, copy the printed contract addresses into your `.env`:

```env
TASK_MANAGER_ADDRESS=0x...
WORKER_REGISTRY_ADDRESS=0x...
```

### 5. Initialize the Database

```bash
npm run db:generate
cd packages/backend && npx prisma migrate dev --name init
```

### 6. Start Development Servers

```bash
# Start all services concurrently
npm run dev

# Or individually:
npm run dev --workspace=packages/backend    # API → http://localhost:4000
npm run dev --workspace=packages/frontend   # UI  → http://localhost:3000
```

### 7. Launch the Demo

1. Open [http://localhost:3000](http://localhost:3000)
2. Navigate to the **Employer Dashboard**
3. Click **Launch Autonomous Economy** — two demo jobs are created on-chain
4. Watch the AI decompose jobs → assign tasks → validate submissions → release payments
5. Open the **Simulation** dashboard to run the 100-wallet stress test

---

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:4000
#   Health    → http://localhost:4000/health
```

---

## Stress Test — 100 Concurrent Wallets

```bash
# Default: 100 wallets · 5 tasks each · 20 concurrent
npm run simulate

# Full stress test
npm run simulate:stress

# Custom parameters: [walletCount] [maxTasksPerWallet] [concurrency]
cd packages/simulation
npx ts-node src/stressTest.ts 500 10 50
```

The stress test runner:
- Generates N wallets using ethers.js BIP-32 HD derivation
- Registers all wallets as workers via the backend REST API
- Spawns concurrent `WorkerSimulator` instances with configurable parallelism
- Applies per-worker retry logic and RPC rate limiting
- Prints a live terminal dashboard: TPS, success rate, total payout, avg completion time

---

## API Reference

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create a new job |
| GET  | `/api/jobs` | List all jobs |
| GET  | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs/demo/launch` | Launch 2 demo jobs |
| GET  | `/api/jobs/ai-logs` | AI activity logs |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/tasks` | List tasks (filter by status/worker/jobId) |
| GET  | `/api/tasks/open` | Get open tasks |
| GET  | `/api/tasks/:id` | Get task details |
| POST | `/api/tasks/:id/submit` | Submit work |
| POST | `/api/tasks/:id/assign` | Assign task to worker |

### Workers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workers/register` | Register a worker |
| GET  | `/api/workers` | List workers |
| GET  | `/api/workers/leaderboard` | Worker leaderboard |
| GET  | `/api/workers/:address` | Worker details |

### Simulation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simulation/start` | Start a simulation run |
| GET  | `/api/simulation` | List simulations |
| GET  | `/api/simulation/:id` | Simulation details |
| GET  | `/api/simulation/queue-stats` | BullMQ queue metrics |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/stats` | Platform-wide stats |
| GET  | `/api/stats/activity` | 24h payment activity |

---

## Contract Addresses

### Alfajores Testnet (chainId: 44787)

| Contract | Address |
|----------|---------|
| TaskManager | *(deploy and update)* |
| WorkerRegistry | *(deploy and update)* |
| cUSD | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |

### Celo Mainnet (chainId: 42220)

| Contract | Address |
|----------|---------|
| TaskManager | [`0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b`](https://celoscan.io/address/0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b) |
| WorkerRegistry | [`0x7b08eb88a15911BcF00b22011def1E02d7F7640b`](https://celoscan.io/address/0x7b08eb88a15911BcF00b22011def1E02d7F7640b) |
| cUSD | [`0x765DE816845861e75A25fCA122bb6898B8B1282a`](https://celoscan.io/address/0x765DE816845861e75A25fCA122bb6898B8B1282a) |

---

## Demo Walkthrough

| Step | Action |
|------|--------|
| 1 | Landing page — system architecture and tech overview |
| 2 | Click **Launch Autonomous Economy** — creates 2 on-chain jobs (image labeling + content moderation) |
| 3 | Employer Dashboard — AI decomposes jobs into 10+ tasks in real time, visible in the AI log sidebar |
| 4 | Worker Dashboard — workers pick up tasks; live task feed updates as submissions come in |
| 5 | Simulation Dashboard — run 20-wallet simulation; watch the wallet grid animate per payment |
| 6 | Treasury Dashboard — cUSD payment activity chart; on-chain payment history table |
| 7 | Terminal — `npm run simulate:stress` — 100-wallet live TPS and payout metrics |

---

## Project Structure

```
amEmployer/
├── packages/
│   ├── contracts/          # Solidity smart contracts (Hardhat)
│   │   ├── contracts/
│   │   │   ├── TaskManager.sol
│   │   │   └── WorkerRegistry.sol
│   │   └── scripts/deploy.ts
│   ├── backend/            # Node.js API + AI + Queues
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── services/
│   │       │   ├── ai/          # Claude, OpenAI, Mock providers
│   │       │   ├── queue/       # 5 BullMQ workers
│   │       │   └── blockchain/  # ethers.js v6 wrapper
│   │       ├── routes/          # REST API
│   │       └── websocket/       # Socket.io
│   ├── frontend/           # Next.js 14 App Router
│   │   └── src/app/
│   │       ├── page.tsx         # Landing page
│   │       ├── employer/        # Employer dashboard
│   │       ├── worker/          # Worker dashboard
│   │       ├── simulation/      # Simulation dashboard
│   │       └── treasury/        # Treasury & payments
│   └── simulation/         # 100-wallet stress test CLI
│       └── src/
│           ├── index.ts          # Live simulation
│           ├── walletGenerator.ts
│           ├── workerSimulator.ts
│           ├── stressTest.ts     # 100+ wallet orchestrator
│           └── metrics.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

See [.env.example](.env.example) for the complete reference.

Key variables:

| Variable | Description |
|----------|-------------|
| `AI_PROVIDER` | `claude` / `openai` / `mock` |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `EMPLOYER_PRIVATE_KEY` | Employer wallet for on-chain tx |
| `TASK_MANAGER_ADDRESS` | Deployed TaskManager contract |
| `CUSD_ADDRESS` | cUSD token address |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |

---

## License

MIT © 2025 phessophissy
