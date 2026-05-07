/**
 * amEmployer — 100 Wallet Stress Test
 *
 * Generates N wallets, registers them as workers, spawns the AI employer,
 * and runs concurrent task completion simulation with metrics tracking.
 *
 * Usage:
 *   npx ts-node src/stressTest.ts [walletCount] [maxTasksPerWallet] [concurrency]
 *
 * Example:
 *   npx ts-node src/stressTest.ts 100 5 20
 */
import 'dotenv/config';
import axios from 'axios';
import { generateWallets } from './walletGenerator';
import { WorkerSimulator } from './workerSimulator';
import { MetricsCollector } from './metrics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface StressTestConfig {
  walletCount: number;
  maxTasksPerWallet: number;
  concurrency: number;
  registrationBatchSize: number;
  taskDelayMs: number;
}

async function launchDemoJobs(): Promise<void> {
  try {
    const res = await axios.post(`${API_BASE}/api/jobs/demo/launch`);
    console.log(`✅ Demo jobs launched: ${res.data.data?.length || 0} jobs`);
  } catch (err: any) {
    console.warn('Demo job launch failed (may already be running):', err.message);
  }
}

async function registerWorkersBatch(
  wallets: ReturnType<typeof generateWallets>,
  batchSize: number,
  metrics: MetricsCollector
): Promise<void> {
  console.log(`\n📝 Registering ${wallets.length} workers in batches of ${batchSize}...`);
  let registered = 0;

  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (w) => {
        try {
          await axios.post(`${API_BASE}/api/workers/register`, {
            walletAddress: w.address,
            workerType: w.index % 3 === 0 ? 'AI_AGENT' : 'SCRIPTED',
            personaName: ['DataLabeler','Translator','Moderator','Researcher','Annotator','Reviewer','Analyst','Validator'][w.index % 8],
          });
          registered++;
          metrics.record({ walletsGenerated: 1 });
        } catch (err: any) {
          if (!err.response?.data?.message?.includes('Already registered')) {
            metrics.recordError(`Registration failed for ${w.address.slice(0, 8)}: ${err.message}`);
          }
        }
      })
    );

    process.stdout.write(`\r  Registered: ${Math.min(i + batchSize, wallets.length)}/${wallets.length}`);
    await new Promise((res) => setTimeout(res, 100)); // Rate limit
  }
  console.log(`\n  ✅ ${registered} workers registered`);
}

async function runWorkerPool(
  wallets: ReturnType<typeof generateWallets>,
  config: StressTestConfig,
  metrics: MetricsCollector
): Promise<void> {
  console.log(`\n🚀 Starting ${wallets.length} worker simulators (concurrency: ${config.concurrency})...`);

  // Process in concurrent batches using a simple semaphore
  const queue = [...wallets];
  let activeCount = 0;
  const results: Promise<void>[] = [];

  while (queue.length > 0 || activeCount > 0) {
    while (activeCount < config.concurrency && queue.length > 0) {
      const wallet = queue.shift()!;
      activeCount++;

      const simulator = new WorkerSimulator({
        wallet,
        metrics,
        maxTasks: config.maxTasksPerWallet,
        delayMs: config.taskDelayMs + Math.floor(Math.random() * 500),
        retryCount: 3,
      });

      const promise = simulator
        .run()
        .catch((err) => metrics.recordError(`Worker ${wallet.address.slice(0, 8)}: ${err.message}`))
        .finally(() => {
          activeCount--;
        });

      results.push(promise);
    }

    // Wait a bit before checking again to avoid tight loop
    await new Promise((res) => setTimeout(res, 200));
  }

  await Promise.allSettled(results);
}

async function main() {
  const config: StressTestConfig = {
    walletCount: parseInt(process.argv[2] || '100'),
    maxTasksPerWallet: parseInt(process.argv[3] || '5'),
    concurrency: parseInt(process.argv[4] || '20'),
    registrationBatchSize: 25,
    taskDelayMs: parseInt(process.env.TASK_DELAY_MS || '500'),
  };

  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       amEmployer — Stress Test Suite               ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║  Wallets:     ${config.walletCount.toString().padEnd(36)}║`);
  console.log(`║  Max Tasks:   ${config.maxTasksPerWallet.toString().padEnd(36)}║`);
  console.log(`║  Concurrency: ${config.concurrency.toString().padEnd(36)}║`);
  console.log(`║  API:         ${API_BASE.padEnd(36)}║`);
  console.log('╚════════════════════════════════════════════════════╝');

  // Health check
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('\n✅ Backend is healthy');
  } catch {
    console.error('\n❌ Backend is not responding. Start the backend first:\n   npm run dev --workspace=packages/backend');
    process.exit(1);
  }

  const metrics = new MetricsCollector();
  metrics.startPrinting(3000);

  // 1. Generate wallets
  console.log(`\n🔑 Generating ${config.walletCount} wallets...`);
  const wallets = generateWallets(config.walletCount);
  console.log(`   ✅ ${wallets.length} wallets generated`);

  // 2. Launch demo jobs (so workers have tasks to pick up)
  await launchDemoJobs();

  // 3. Register workers
  await registerWorkersBatch(wallets, config.registrationBatchSize, metrics);

  // 4. Wait for AI to decompose jobs
  console.log('\n⏳ Waiting for AI to decompose jobs into tasks (5s)...');
  await new Promise((res) => setTimeout(res, 5000));

  // 5. Run worker pool
  await runWorkerPool(wallets, config, metrics);

  // 6. Final metrics
  metrics.printFinal();
  console.log('\n✅ Stress test complete!');
}

main().catch((err) => {
  console.error('Stress test failed:', err);
  process.exit(1);
});
