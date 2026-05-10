/**
 * amEmployer — 125 Wallet Interaction Script
 *
 * Generates 125 wallets (25 employers + 100 workers), funds them, and runs a
 * full interaction cycle against the amEmployer platform on Celo Alfajores
 * testnet (or mainnet via env).
 *
 * ─── Minimum cUSD per wallet ─────────────────────────────────────────────────
 *
 *   EMPLOYER (25 wallets)
 *     • Must escrow cUSD into TaskManager for each task created
 *     • Contract minimum: reward > 0 (any positive amount)
 *     • Practical minimum: 1 cUSD (1 job × 5 tasks × 0.2 cUSD each)
 *     • RECOMMENDED:       5 cUSD  (comfortable for 5 tasks × 1 cUSD each)
 *     • Platform fee:      5% taken at payout — employer pays full reward
 *
 *   WORKER (100 wallets)
 *     • Do NOT need cUSD upfront — they EARN it from task completion
 *     • Need gas (CELO, or cUSD via Celo feeCurrency)
 *     • Gas per worker: registerWorker (~50k gas) + submitWork × N (~60k gas)
 *     • At 5 gwei on Alfajores: ~0.001 CELO per tx
 *     • Via cUSD feeCurrency: ~0.015 cUSD per tx
 *     • MINIMUM cUSD for gas: 0.05 cUSD (~3 transactions)
 *     • RECOMMENDED:          0.1  cUSD
 *
 *   TOTALS
 *     Absolute minimum:  25 × 1.0  + 100 × 0.05 = ~30.0  cUSD
 *     Recommended:       25 × 5.0  + 100 × 0.10 = ~135.0 cUSD
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   npx ts-node src/interact125.ts generate           # Step 1: create wallets
 *   npx ts-node src/interact125.ts fund               # Step 2: fund from funder
 *   npx ts-node src/interact125.ts register           # Step 3: register workers
 *   npx ts-node src/interact125.ts create-jobs        # Step 4: employers post jobs
 *   npx ts-node src/interact125.ts work               # Step 5: workers complete tasks
 *   npx ts-node src/interact125.ts stats              # Step 6: print final stats
 *   npx ts-node src/interact125.ts all                # Run steps 1-6 end-to-end
 *
 * ─── Env vars ─────────────────────────────────────────────────────────────────
 *   CELO_RPC_URL            = https://alfajores-forno.celo-testnet.org
 *   CUSD_ADDRESS            = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 (Alfajores)
 *   TASK_MANAGER_ADDRESS    = <deployed TaskManager address>
 *   FUNDER_PRIVATE_KEY      = <your funded wallet private key>
 *   EMPLOYER_CUSD_AMOUNT    = 5     (cUSD per employer, default 5)
 *   WORKER_CUSD_AMOUNT      = 0.1   (cUSD per worker for gas, default 0.1)
 *   TASK_REWARD_CUSD        = 1     (cUSD reward per task, default 1)
 *   API_BASE                = http://localhost:4000
 *   CONCURRENCY             = 10    (parallel wallet ops)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import axios from 'axios';
import pLimit from 'p-limit';
import { MetricsCollector } from './metrics';

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL      = process.env.CELO_RPC_URL         || 'https://alfajores-forno.celo-testnet.org';
const CUSD_ADDRESS = process.env.CUSD_ADDRESS          || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
const TM_ADDRESS   = process.env.TASK_MANAGER_ADDRESS  || ethers.ZeroAddress;
const API_BASE     = process.env.API_BASE              || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const CONCURRENCY  = parseInt(process.env.CONCURRENCY  || '10');

const EMPLOYER_CUSD  = parseFloat(process.env.EMPLOYER_CUSD_AMOUNT || '5');
const WORKER_CUSD    = parseFloat(process.env.WORKER_CUSD_AMOUNT   || '0.1');
const TASK_REWARD    = parseFloat(process.env.TASK_REWARD_CUSD     || '1');
const TASKS_PER_JOB  = parseInt(process.env.TASKS_PER_JOB          || '1');

const N_EMPLOYERS = 25;
const N_WORKERS   = 100;
const N_TOTAL     = N_EMPLOYERS + N_WORKERS;

const DATA_DIR     = path.join(__dirname, '..', 'data');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets_125.json');
const REPORT_FILE  = path.join(DATA_DIR, 'interact_report.json');

// ─── ABIs (minimal fragments) ──────────────────────────────────────────────────

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const TASK_MANAGER_ABI = [
  'function registerWorker() external',
  'function createTask(uint256 reward, bytes32 metadataHash, uint256 deadlineDuration) returns (uint256)',
  'function submitWork(uint256 taskId, string calldata submissionData) external',
  'function getWorkerStats(address worker) view returns (uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered)',
  'function getPlatformStats() view returns (uint256 totalTasks, uint256 completedTasks, uint256 paidOut)',
  'function taskCounter() view returns (uint256)',
  'function platformFeePercent() view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed employer, uint256 reward, bytes32 metadataHash, uint256 deadline)',
  'event WorkerRegistered(address indexed worker)',
  'event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount)',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoleWallet {
  address:    string;
  privateKey: string;
  index:      number;
  role:       'employer' | 'worker';
  personaName: string;
  workerType?: 'SCRIPTED' | 'AI_AGENT' | 'HUMAN';
  stats: {
    jobsCreated:      number;
    tasksCreated:     number;
    cUSDSpent:        string;
    tasksCompleted:   number;
    cUSDEarned:       string;
    onChainTxHashes:  string[];
    errors:           string[];
  };
}

interface InteractReport {
  generatedAt:     string;
  network:         string;
  rpcUrl:          string;
  cusdAddress:     string;
  taskManagerAddr: string;
  totals: {
    wallets:         number;
    employers:       number;
    workers:         number;
    cUSDFunded:      string;
    tasksCreated:    number;
    tasksCompleted:  number;
    cUSDPaidOut:     string;
    platformFees:    string;
    txCount:         number;
    errors:          number;
    durationSeconds: number;
  };
  wallets: RoleWallet[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadWallets(): RoleWallet[] {
  if (!fs.existsSync(WALLETS_FILE)) {
    throw new Error(`wallets_125.json not found. Run: npx ts-node src/interact125.ts generate`);
  }
  return JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf-8'));
}

function saveWallets(wallets: RoleWallet[]) {
  ensureDataDir();
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
}

const PERSONA_NAMES = [
  'DataLabeler', 'Translator', 'Moderator', 'Researcher',
  'Annotator',   'Reviewer',   'Analyst',   'Validator',
  'Classifier',  'Tagger',     'Curator',   'Proofreader',
];

const JOB_TEMPLATES = [
  {
    title: 'Label 200 E-commerce Product Images',
    description: 'Categorize 200 product images: primary category, subcategory, quality rating 1-5, defect flags. Use the provided taxonomy guide.',
    budget: TASK_REWARD * TASKS_PER_JOB,
  },
  {
    title: 'Sentiment Analysis on Customer Reviews',
    description: 'Analyze 150 customer reviews. Extract: sentiment, primary complaint/praise category, urgency 1-3, compliance risk flags.',
    budget: TASK_REWARD * TASKS_PER_JOB,
  },
  {
    title: 'Moderate User-Generated Content Batch',
    description: 'Review 300 UGC posts for policy violations. Output: approve/reject, violation type, confidence score.',
    budget: TASK_REWARD * TASKS_PER_JOB,
  },
  {
    title: 'Translate Spanish Product Descriptions',
    description: 'Translate 100 product descriptions from English to Spanish. Maintain brand tone and technical accuracy.',
    budget: TASK_REWARD * TASKS_PER_JOB,
  },
  {
    title: 'Data Quality Audit — CSV Dataset',
    description: 'Audit 500-row CSV for: duplicate records, formatting errors, outliers, missing required fields. Produce a QA report.',
    budget: TASK_REWARD * TASKS_PER_JOB,
  },
];

// ─── Phase 1: Generate 125 Wallets ────────────────────────────────────────────

async function cmdGenerate(): Promise<void> {
  log(`Generating ${N_TOTAL} wallets (${N_EMPLOYERS} employers + ${N_WORKERS} workers)…`);

  const wallets: RoleWallet[] = [];

  // Create a master HD wallet for deterministic derivation
  const masterMnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
  const masterNode = ethers.HDNodeWallet.fromMnemonic(masterMnemonic);

  for (let i = 0; i < N_TOTAL; i++) {
    const hdWallet = masterNode.deriveChild(i);
    const role: 'employer' | 'worker' = i < N_EMPLOYERS ? 'employer' : 'worker';
    const workerIdx = i - N_EMPLOYERS;

    wallets.push({
      address:    hdWallet.address,
      privateKey: hdWallet.privateKey,
      index:      i,
      role,
      personaName: role === 'employer'
        ? `Employer_${String(i + 1).padStart(2, '0')}`
        : PERSONA_NAMES[workerIdx % PERSONA_NAMES.length] + `_${workerIdx + 1}`,
      workerType: role === 'worker'
        ? (workerIdx % 10 === 0 ? 'AI_AGENT' : 'SCRIPTED')
        : undefined,
      stats: {
        jobsCreated:     0,
        tasksCreated:    0,
        cUSDSpent:       '0',
        tasksCompleted:  0,
        cUSDEarned:      '0',
        onChainTxHashes: [],
        errors:          [],
      },
    });
  }

  saveWallets(wallets);

  log(`✅ Generated ${N_TOTAL} wallets → ${WALLETS_FILE}`);
  log(`   Master mnemonic (STORE SAFELY): ${masterMnemonic.phrase}`);
  log(`   Employers [0..${N_EMPLOYERS - 1}]: ${wallets[0].address} … ${wallets[N_EMPLOYERS - 1].address}`);
  log(`   Workers  [${N_EMPLOYERS}..${N_TOTAL - 1}]: ${wallets[N_EMPLOYERS].address} … ${wallets[N_TOTAL - 1].address}`);
  log('');
  log('   ⚠  wallets_125.json contains private keys — never commit this file.');
  log('');
  log(`   Minimum cUSD needed to fund:`);
  log(`     Employers: ${N_EMPLOYERS} × ${EMPLOYER_CUSD} cUSD = ${N_EMPLOYERS * EMPLOYER_CUSD} cUSD`);
  log(`     Workers:   ${N_WORKERS} × ${WORKER_CUSD} cUSD  = ${N_WORKERS * WORKER_CUSD} cUSD`);
  log(`     ──────────────────────────────────────────────`);
  log(`     Total:     ${N_EMPLOYERS * EMPLOYER_CUSD + N_WORKERS * WORKER_CUSD} cUSD  (on Alfajores: use faucet)`);
  log(`     Faucet:    https://faucet.celo.org/alfajores`);
}

// ─── Phase 2: Fund Wallets ────────────────────────────────────────────────────

async function cmdFund(): Promise<void> {
  const funderKey = process.env.FUNDER_PRIVATE_KEY;
  if (!funderKey) {
    log('');
    log('ℹ  FUNDER_PRIVATE_KEY not set. Manual funding mode:');
    log('');
    log('  For Alfajores testnet, use the faucet to fund the wallet addresses below.');
    log('  Faucet: https://faucet.celo.org/alfajores');
    log('');

    const wallets = loadWallets();
    log(`  EMPLOYERS (need ${EMPLOYER_CUSD} cUSD each):`);
    wallets.filter((w) => w.role === 'employer').forEach((w) =>
      log(`    ${w.address}  (${w.personaName})`)
    );
    log('');
    log(`  WORKERS (need ${WORKER_CUSD} cUSD each for gas):`);
    wallets.filter((w) => w.role === 'worker').forEach((w) =>
      log(`    ${w.address}  (${w.personaName})`)
    );
    log('');
    log('  Or set FUNDER_PRIVATE_KEY in .env to auto-fund from a funded wallet.');
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const funder   = new ethers.Wallet(funderKey, provider);
  const cusd     = new ethers.Contract(CUSD_ADDRESS, ERC20_ABI, funder);

  const funderBalance = await cusd.balanceOf(funder.address);
  const totalNeeded   = ethers.parseEther(
    String(N_EMPLOYERS * EMPLOYER_CUSD + N_WORKERS * WORKER_CUSD)
  );

  log(`Funder: ${funder.address}`);
  log(`Funder cUSD balance: ${ethers.formatEther(funderBalance)} cUSD`);
  log(`Total cUSD needed:   ${ethers.formatEther(totalNeeded)} cUSD`);

  if (funderBalance < totalNeeded) {
    log(`❌ Insufficient funder balance. Need ${ethers.formatEther(totalNeeded)} cUSD, have ${ethers.formatEther(funderBalance)} cUSD.`);
    log(`   Fund the funder wallet first: ${funder.address}`);
    log(`   Alfajores faucet: https://faucet.celo.org/alfajores`);
    return;
  }

  const wallets = loadWallets();
  const limit   = pLimit(5); // 5 concurrent transfers
  let funded    = 0;
  let failed    = 0;

  log(`\nFunding ${N_TOTAL} wallets (${CONCURRENCY} concurrent)…`);

  const tasks = wallets.map((w) =>
    limit(async () => {
      const amount = w.role === 'employer'
        ? ethers.parseEther(String(EMPLOYER_CUSD))
        : ethers.parseEther(String(WORKER_CUSD));
      try {
        const tx = await cusd.transfer(w.address, amount);
        await tx.wait();
        funded++;
        w.stats.onChainTxHashes.push(tx.hash);
        if (funded % 10 === 0) log(`  Funded ${funded}/${N_TOTAL}…`);
      } catch (err: any) {
        failed++;
        w.stats.errors.push(`Fund failed: ${err.message?.slice(0, 80)}`);
        log(`  ⚠  Fund failed for ${shortAddr(w.address)}: ${err.message?.slice(0, 60)}`);
      }
    })
  );

  await Promise.all(tasks);
  saveWallets(wallets);

  log(`\n✅ Funded: ${funded}  Failed: ${failed}`);
  log(`   Wallets updated → ${WALLETS_FILE}`);
}

// ─── Phase 3: Register Workers (on-chain + API) ────────────────────────────────

async function cmdRegister(): Promise<void> {
  const provider  = new ethers.JsonRpcProvider(RPC_URL);
  const wallets   = loadWallets();
  const workers   = wallets.filter((w) => w.role === 'worker');
  const limit     = pLimit(CONCURRENCY);
  let registered  = 0;
  let skipped     = 0;
  let failed      = 0;

  log(`Registering ${workers.length} workers (on-chain + API)…`);
  log(`  TaskManager: ${TM_ADDRESS}`);

  const tasks = workers.map((w) =>
    limit(async () => {
      const signer = new ethers.Wallet(w.privateKey, provider);

      // ── 1. On-chain registerWorker() ──
      if (TM_ADDRESS !== ethers.ZeroAddress) {
        try {
          const tm    = new ethers.Contract(TM_ADDRESS, TASK_MANAGER_ABI, signer);
          const stats = await tm.getWorkerStats(w.address);
          if (!stats[4]) { // isRegistered = false
            const tx = await tm.registerWorker({ gasLimit: 120_000 });
            await tx.wait();
            w.stats.onChainTxHashes.push(tx.hash);
            log(`  ⛓  Registered on-chain: ${shortAddr(w.address)} (${w.personaName})`);
          } else {
            skipped++;
          }
        } catch (err: any) {
          w.stats.errors.push(`OnChain register: ${err.message?.slice(0, 80)}`);
          log(`  ⚠  On-chain register failed ${shortAddr(w.address)}: ${err.message?.slice(0, 60)}`);
        }
      }

      // ── 2. Backend API register ──
      try {
        await axios.post(`${API_BASE}/api/workers/register`, {
          walletAddress: w.address,
          workerType:    w.workerType ?? 'SCRIPTED',
          personaName:   w.personaName,
        });
        registered++;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || '';
        if (msg.toLowerCase().includes('already')) {
          skipped++;
        } else {
          failed++;
          w.stats.errors.push(`API register: ${msg.slice(0, 80)}`);
          log(`  ⚠  API register failed ${shortAddr(w.address)}: ${msg.slice(0, 60)}`);
        }
      }
    })
  );

  await Promise.all(tasks);
  saveWallets(wallets);

  log(`\n✅ Registered: ${registered}  Already registered: ${skipped}  Failed: ${failed}`);
}

// ─── Phase 4: Employers Create Jobs (API + on-chain tasks) ────────────────────

async function cmdCreateJobs(): Promise<void> {
  const provider  = new ethers.JsonRpcProvider(RPC_URL);
  const wallets   = loadWallets();
  const employers = wallets.filter((w) => w.role === 'employer');
  const limit     = pLimit(5); // Keep sequential-ish — each job submission is heavy
  let jobsCreated = 0;
  let failed      = 0;

  log(`Creating jobs for ${employers.length} employers…`);
  log(`  Task reward: ${TASK_REWARD} cUSD each  |  Tasks per job: ${TASKS_PER_JOB}  |  Total: ${employers.length * TASKS_PER_JOB} tasks`);

  const tasks = employers.map((w, ei) =>
    limit(async () => {
      const template  = JOB_TEMPLATES[ei % JOB_TEMPLATES.length];
      const signer    = new ethers.Wallet(w.privateKey, provider);

      // ── 1. API: create job (backend decomposes into tasks automatically) ──
      try {
        const res = await axios.post(`${API_BASE}/api/jobs`, {
          title:           `${template.title} [Employer ${ei + 1}]`,
          description:     template.description,
          totalBudget:     template.budget,
          employerAddress: w.address,
        });

        const job = res.data.data;
        w.stats.jobsCreated++;
        w.stats.tasksCreated += TASKS_PER_JOB; // backend decomposes into tasks
        jobsCreated++;
        log(`  📋 Job created: ${job.id.slice(0, 8)} — "${template.title}" by ${shortAddr(w.address)}`);

        // ── 2. On-chain: approve + createTask per task (if TaskManager deployed) ──
        if (TM_ADDRESS !== ethers.ZeroAddress) {
          try {
            const cusd = new ethers.Contract(CUSD_ADDRESS, ERC20_ABI, signer);
            const tm   = new ethers.Contract(TM_ADDRESS, TASK_MANAGER_ABI, signer);

            const rewardWei   = ethers.parseEther(String(TASK_REWARD));
            const totalReward = rewardWei * BigInt(TASKS_PER_JOB);

            // Approve if needed
            const allowance = await cusd.allowance(w.address, TM_ADDRESS);
            if (allowance < totalReward) {
              const approveTx = await cusd.approve(TM_ADDRESS, ethers.MaxUint256, { gasLimit: 100_000 });
              await approveTx.wait();
              w.stats.onChainTxHashes.push(approveTx.hash);
              log(`    ✅ Approved cUSD for ${shortAddr(w.address)}`);
            }

            // Create on-chain tasks
            for (let t = 0; t < TASKS_PER_JOB; t++) {
              const metaHash = ethers.keccak256(
                ethers.toUtf8Bytes(`${job.id}:task:${t}:${Date.now()}`)
              );
              const tx = await tm.createTask(
                rewardWei,
                metaHash,
                86400, // 24h deadline
                { gasLimit: 200_000 }
              );
              const receipt = await tx.wait();
              w.stats.onChainTxHashes.push(tx.hash);
              w.stats.tasksCreated++;

              // Parse taskId from receipt logs
              const iface = new ethers.Interface(TASK_MANAGER_ABI);
              for (const log_ of receipt.logs) {
                try {
                  const parsed = iface.parseLog(log_);
                  if (parsed?.name === 'TaskCreated') {
                    log(`    ⛓  Task #${parsed.args.taskId} created on-chain (${ethers.formatEther(rewardWei)} cUSD)`);
                  }
                } catch {}
              }
            }

            const spent = ethers.formatEther(totalReward);
            w.stats.cUSDSpent = (parseFloat(w.stats.cUSDSpent) + parseFloat(spent)).toFixed(4);
          } catch (err: any) {
            w.stats.errors.push(`OnChain task create: ${err.message?.slice(0, 80)}`);
            log(`    ⚠  On-chain task create failed: ${err.message?.slice(0, 60)}`);
          }
        }
      } catch (err: any) {
        failed++;
        const msg = err.response?.data?.error || err.message || '';
        w.stats.errors.push(`Create job: ${msg.slice(0, 80)}`);
        log(`  ❌ Job creation failed for ${shortAddr(w.address)}: ${msg.slice(0, 60)}`);
      }
    })
  );

  await Promise.all(tasks);
  saveWallets(wallets);

  log(`\n✅ Jobs created: ${jobsCreated}  Failed: ${failed}`);
}

// ─── Phase 5: Workers Complete Tasks ──────────────────────────────────────────

async function cmdWork(): Promise<void> {
  const provider  = new ethers.JsonRpcProvider(RPC_URL);
  const wallets   = loadWallets();
  const workers   = wallets.filter((w) => w.role === 'worker');
  const limit     = pLimit(CONCURRENCY);
  let completed   = 0;
  let noTask      = 0;
  let failed      = 0;

  log(`Running work loop for ${workers.length} workers…`);
  log(`  API: ${API_BASE}  |  Concurrency: ${CONCURRENCY}`);

  const MAX_TASKS_PER_WORKER = 3;

  const tasks = workers.map((w) =>
    limit(async () => {
      const signer = new ethers.Wallet(w.privateKey, provider);

      for (let round = 0; round < MAX_TASKS_PER_WORKER; round++) {
        // ── Fetch an open task ──
        let openTask: any = null;
        try {
          const res = await axios.get(`${API_BASE}/api/tasks/open`, { timeout: 8000 });
          const pool: any[] = res.data?.data || [];
          if (pool.length > 0) {
            openTask = pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
          }
        } catch {}

        if (!openTask) {
          // ── On-chain: if TaskManager deployed, check for open tasks there ──
          if (TM_ADDRESS !== ethers.ZeroAddress) {
            try {
              const tm      = new ethers.Contract(TM_ADDRESS, TASK_MANAGER_ABI, signer);
              const counter = await tm.taskCounter();
              // Scan last 50 tasks for ones still OPEN (status 0)
              const start = Number(counter) > 50 ? Number(counter) - 50 : 1;
              for (let id = start; id <= Number(counter); id++) {
                // submitWork is only callable by assigned worker — skip on-chain direct here
              }
            } catch {}
          }
          noTask++;
          await sleep(500 + Math.random() * 1000);
          continue;
        }

        // ── Submit work via API ──
        try {
          const submission = generateSubmission(openTask.title ?? '');
          await axios.post(
            `${API_BASE}/api/tasks/${openTask.id}/submit`,
            { submission, workerAddress: w.address },
            { timeout: 12000 }
          );
          w.stats.tasksCompleted++;
          completed++;
          log(`  ✅ ${shortAddr(w.address)} (${w.personaName}) completed task: ${openTask.title?.slice(0, 40)}`);
        } catch (err: any) {
          const msg = err.response?.data?.error || err.message || '';
          // 403/404 = not assigned to this worker, skip silently
          if (err.response?.status !== 403 && err.response?.status !== 404) {
            failed++;
            w.stats.errors.push(`Submit: ${msg.slice(0, 80)}`);
          }
        }

        await sleep(300 + Math.random() * 700);
      }
    })
  );

  await Promise.all(tasks);
  saveWallets(wallets);

  log(`\n✅ Completed: ${completed}  No-task: ${noTask}  Failed: ${failed}`);
}

// ─── Phase 6: Stats Report ─────────────────────────────────────────────────────

async function cmdStats(): Promise<void> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallets  = loadWallets();

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  amEmployer — 125 Wallet Interaction Report');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Platform stats from API
  try {
    const res = await axios.get(`${API_BASE}/api/stats`);
    const s   = res.data?.data || {};
    log(`\n  Platform (API):`);
    log(`    Total jobs:         ${s.totalJobs ?? 'n/a'}`);
    log(`    Active workers:     ${s.activeWorkers ?? 'n/a'}`);
    log(`    Tasks completed:    ${s.tasksCompleted ?? 'n/a'}`);
    log(`    cUSD paid out:      ${s.totalPaidOut ?? 'n/a'} cUSD`);
  } catch {
    log('  (API stats unavailable — backend may not be running)');
  }

  // Platform stats from chain
  if (TM_ADDRESS !== ethers.ZeroAddress) {
    try {
      const tm  = new ethers.Contract(TM_ADDRESS, TASK_MANAGER_ABI, provider);
      const [totalTasks, completedTasks, paidOut] = await tm.getPlatformStats();
      log(`\n  Platform (on-chain):`);
      log(`    Total tasks:     ${totalTasks}`);
      log(`    Completed tasks: ${completedTasks}`);
      log(`    Total paid out:  ${ethers.formatEther(paidOut)} cUSD`);
    } catch (err: any) {
      log(`  (On-chain stats unavailable: ${err.message?.slice(0, 60)})`);
    }
  }

  // Wallet balances
  const cusd = new ethers.Contract(CUSD_ADDRESS, ERC20_ABI, provider);
  log('\n  Wallet Balances (cUSD):');

  let totalEmployerSpent  = 0;
  let totalWorkerEarned   = 0;
  let totalJobsCreated    = 0;
  let totalTasksCompleted = 0;
  let totalTxCount        = 0;
  let totalErrors         = 0;

  for (const w of wallets) {
    try {
      const bal = await cusd.balanceOf(w.address);
      const balFmt = parseFloat(ethers.formatEther(bal)).toFixed(4);
      const roleTag = w.role === 'employer' ? 'EMPLr' : 'WRKR ';
      log(`    [${roleTag}] ${w.address} | ${balFmt} cUSD | ${w.personaName}`);
    } catch {
      log(`    [?????] ${w.address} | balance check failed`);
    }

    if (w.role === 'employer') {
      totalEmployerSpent += parseFloat(w.stats.cUSDSpent);
      totalJobsCreated   += w.stats.jobsCreated;
    } else {
      totalWorkerEarned    += parseFloat(w.stats.cUSDEarned);
      totalTasksCompleted  += w.stats.tasksCompleted;
    }
    totalTxCount  += w.stats.onChainTxHashes.length;
    totalErrors   += w.stats.errors.length;

    await sleep(80); // avoid RPC rate-limiting
  }

  const employers = wallets.filter((w) => w.role === 'employer');
  const workers   = wallets.filter((w) => w.role === 'worker');

  log('\n  Summary:');
  log(`    Total wallets:       ${N_TOTAL} (${N_EMPLOYERS} employers + ${N_WORKERS} workers)`);
  log(`    Jobs created:        ${totalJobsCreated}`);
  log(`    Tasks completed:     ${totalTasksCompleted}`);
  log(`    cUSD spent (escrow): ${totalEmployerSpent.toFixed(4)} cUSD`);
  log(`    cUSD earned (est):   ${totalWorkerEarned.toFixed(4)} cUSD`);
  log(`    On-chain tx count:   ${totalTxCount}`);
  log(`    Errors:              ${totalErrors}`);
  log(`\n  Top 5 Workers by tasks completed:`);

  workers
    .sort((a, b) => b.stats.tasksCompleted - a.stats.tasksCompleted)
    .slice(0, 5)
    .forEach((w, i) =>
      log(`    ${i + 1}. ${w.personaName} (${shortAddr(w.address)}) — ${w.stats.tasksCompleted} tasks, ${w.stats.cUSDEarned} cUSD earned`)
    );

  // Save report
  const report: InteractReport = {
    generatedAt:     new Date().toISOString(),
    network:         RPC_URL.includes('alfajores') ? 'Celo Alfajores (testnet)' : RPC_URL.includes('forno.celo.org') ? 'Celo Mainnet' : RPC_URL,
    rpcUrl:          RPC_URL,
    cusdAddress:     CUSD_ADDRESS,
    taskManagerAddr: TM_ADDRESS,
    totals: {
      wallets:         N_TOTAL,
      employers:       N_EMPLOYERS,
      workers:         N_WORKERS,
      cUSDFunded:      String(N_EMPLOYERS * EMPLOYER_CUSD + N_WORKERS * WORKER_CUSD),
      tasksCreated:    employers.reduce((s, w) => s + w.stats.tasksCreated, 0),
      tasksCompleted:  totalTasksCompleted,
      cUSDPaidOut:     totalWorkerEarned.toFixed(4),
      platformFees:    (totalEmployerSpent * 0.05).toFixed(4),
      txCount:         totalTxCount,
      errors:          totalErrors,
      durationSeconds: 0,
    },
    wallets,
  };

  ensureDataDir();
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  log(`\n  📄 Full report saved → ${REPORT_FILE}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ─── All phases end-to-end ─────────────────────────────────────────────────────

async function cmdAll(): Promise<void> {
  const start = Date.now();
  log('🚀 Running all phases: generate → fund → register → create-jobs → work → stats\n');

  await cmdGenerate();
  await sleep(1000);
  await cmdFund();
  await sleep(2000);
  await cmdRegister();
  await sleep(3000);
  await cmdCreateJobs();
  await sleep(5000);
  await cmdWork();
  await sleep(2000);
  await cmdStats();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log(`\n✅ All phases complete in ${elapsed}s`);
}

// ─── Submission generator ──────────────────────────────────────────────────────

function generateSubmission(title: string): string {
  const t = title.toLowerCase();

  if (t.includes('label') || t.includes('image')) {
    return JSON.stringify({
      category:   ['electronics', 'clothing', 'food', 'furniture', 'other'][Math.floor(Math.random() * 5)],
      quality:    Math.floor(Math.random() * 5) + 1,
      confidence: Math.floor(Math.random() * 30) + 70,
      defects:    [],
    });
  }
  if (t.includes('sentiment') || t.includes('review')) {
    return JSON.stringify({
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      score:     (Math.random() * 2 - 1).toFixed(2),
      urgency:   Math.ceil(Math.random() * 3),
      summary:   'Thorough analysis completed per provided taxonomy.',
    });
  }
  if (t.includes('translat')) {
    return `Translated content: ${title.slice(0, 80)} — traducción completada con precisión al 98%.`;
  }
  if (t.includes('modera')) {
    return JSON.stringify({ verdict: 'approved', flags: [], confidence: 95, notes: 'Content complies with community guidelines.' });
  }
  if (t.includes('audit') || t.includes('quality') || t.includes('data')) {
    return JSON.stringify({ duplicates: 3, formattingErrors: 7, missingFields: 2, outliers: 1, recommendation: 'Clean rows 45, 102, 318.' });
  }

  return `Task completed: "${title}". All requirements met. Deliverable produced as per specification.`;
}

// ─── CLI dispatcher ────────────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] || 'all';

  const commands: Record<string, () => Promise<void>> = {
    generate:    cmdGenerate,
    fund:        cmdFund,
    register:    cmdRegister,
    'create-jobs': cmdCreateJobs,
    work:        cmdWork,
    stats:       cmdStats,
    all:         cmdAll,
  };

  if (!commands[cmd]) {
    console.error(`Unknown command: ${cmd}`);
    console.error(`Usage: npx ts-node src/interact125.ts [${Object.keys(commands).join(' | ')}]`);
    process.exit(1);
  }

  log(`amEmployer — 125-Wallet Interaction Script`);
  log(`Command: ${cmd}  |  Network: ${RPC_URL}`);
  log(`TaskManager: ${TM_ADDRESS}`);
  log(`cUSD: ${CUSD_ADDRESS}`);
  log('');

  await commands[cmd]();
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
