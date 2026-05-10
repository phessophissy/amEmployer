import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../../lib/logger';
import { broadcastAILog, broadcastTaskUpdate, broadcastPayment } from '../../websocket';
import { orchestrator } from '../ai/orchestrator';
import { blockchain } from '../blockchain';
import prisma from '../../lib/prisma';

// ─── Redis connection ──────────────────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
});

// ─── Queue names ──────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  JOB_DECOMPOSITION: 'job:decomposition',
  TASK_ASSIGNMENT: 'task:assignment',
  TASK_VALIDATION: 'task:validation',
  PAYMENT_RELEASE: 'payment:release',
  WORKER_SIMULATION: 'worker:simulation',
} as const;

// ─── Queues ───────────────────────────────────────────────────────────────────

export const decompositionQueue = new Queue(QUEUE_NAMES.JOB_DECOMPOSITION, {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
});

export const assignmentQueue = new Queue(QUEUE_NAMES.TASK_ASSIGNMENT, {
  connection,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
});

export const validationQueue = new Queue(QUEUE_NAMES.TASK_VALIDATION, {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
});

export const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT_RELEASE, {
  connection,
  defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 3000 } },
});

export const simulationQueue = new Queue(QUEUE_NAMES.WORKER_SIMULATION, {
  connection,
  defaultJobOptions: { attempts: 2, backoff: { type: 'fixed', delay: 1000 } },
  // Note: limiter moved to Worker options in BullMQ v5
});

// ─── Workers ──────────────────────────────────────────────────────────────────

export function initQueues() {
  // 1. Job decomposition worker
  new Worker(
    QUEUE_NAMES.JOB_DECOMPOSITION,
    async (job: Job) => {
      const { jobId } = job.data;
      logger.info(`[Queue:Decompose] Processing job ${jobId}`);

      await prisma.job.update({ where: { id: jobId }, data: { status: 'DECOMPOSING' } });

      const workerCount = await prisma.worker.count({ where: { isActive: true } });
      const result = await orchestrator.decomposeJob(jobId, Math.max(workerCount, 10));

      const job_ = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
      const rewardPerTask = parseFloat(job_.totalBudget.toString()) / result.tasks.length;

      // Persist tasks to DB
      const createdTasks = await Promise.all(
        result.tasks.map((t) =>
          prisma.task.create({
            data: {
              jobId,
              title: t.title,
              description: t.description,
              reward: parseFloat(t.reward) || rewardPerTask,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
          })
        )
      );

      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'ACTIVE', taskCount: createdTasks.length, aiSummary: result.summary },
      });

      // Enqueue each task for assignment
      for (const task of createdTasks) {
        await assignmentQueue.add('assign', { taskId: task.id }, { delay: 500 });
      }

      logger.info(`[Queue:Decompose] Created ${createdTasks.length} tasks for job ${jobId}`);
    },
    { connection, concurrency: 3 }
  );

  // 2. Task assignment worker
  new Worker(
    QUEUE_NAMES.TASK_ASSIGNMENT,
    async (job: Job) => {
      const { taskId } = job.data;

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.status !== 'OPEN') return;

      // Find available workers
      const busyWorkers = await prisma.task.findMany({
        where: { status: { in: ['ASSIGNED', 'SUBMITTED'] }, assignedWorker: { not: null } },
        select: { assignedWorker: true },
      });
      const busyAddresses = busyWorkers.map((t: { assignedWorker: string | null }) => t.assignedWorker!);

      const availableWorkers = await prisma.worker.findMany({
        where: {
          isActive: true,
          walletAddress: { notIn: busyAddresses },
        },
        orderBy: { reputation: 'desc' },
        take: 20,
      });

      if (availableWorkers.length === 0) {
        // Retry after a delay
        throw new Error('No available workers — will retry');
      }

      const workerAddresses = availableWorkers.map((w: { walletAddress: string }) => w.walletAddress);
      const selectedAddress = await orchestrator.selectWorkerForTask(taskId, workerAddresses);
      if (!selectedAddress) throw new Error('Worker selection failed');

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'ASSIGNED', assignedWorker: selectedAddress },
      });

      broadcastTaskUpdate({ id: taskId, status: 'ASSIGNED', assignedWorker: selectedAddress });

      // Queue AI worker simulation if it's a scripted worker
      const worker = await prisma.worker.findFirst({
        where: { walletAddress: selectedAddress },
      });
      if (worker?.workerType === 'AI_AGENT' || worker?.workerType === 'SCRIPTED') {
        await simulationQueue.add(
          'simulate-work',
          { taskId, workerAddress: selectedAddress, personaName: worker.personaName },
          { delay: 2000 + Math.random() * 8000 }
        );
      }
    },
    { connection, concurrency: 10 }
  );

  // 3. Validation worker
  new Worker(
    QUEUE_NAMES.TASK_VALIDATION,
    async (job: Job) => {
      const { taskId } = job.data;

      const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      if (!task.submission) throw new Error('No submission to validate');

      const result = await orchestrator.validateSubmission(taskId, task.submission);

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: result.approved ? 'VERIFIED' : 'REJECTED',
          validationScore: result.score,
          validationNotes: result.notes,
        },
      });

      broadcastTaskUpdate({
        id: taskId,
        status: result.approved ? 'VERIFIED' : 'REJECTED',
        validationScore: result.score,
      });

      if (result.approved) {
        await paymentQueue.add('release', { taskId }, { delay: 500 });
      } else {
        // Re-open for reassignment
        await prisma.task.update({
          where: { id: taskId },
          data: { status: 'OPEN', assignedWorker: null, submission: null, attempts: { increment: 1 } },
        });
        await assignmentQueue.add('assign', { taskId }, { delay: 3000 });
      }
    },
    { connection, concurrency: 5 }
  );

  // 4. Payment worker
  new Worker(
    QUEUE_NAMES.PAYMENT_RELEASE,
    async (job: Job) => {
      const { taskId } = job.data;

      const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
      if (!task.assignedWorker) throw new Error('No assigned worker');

      const worker = await prisma.worker.findFirst({
        where: { walletAddress: task.assignedWorker },
      });
      if (!worker) throw new Error('Worker not found in DB');

      let txHash: string | undefined;

      // Attempt on-chain verification if task is on-chain
      if (task.onchainTaskId) {
        try {
          await blockchain.verifyTaskOnChain(task.onchainTaskId, true);
          logger.info(`On-chain payment released for task ${task.onchainTaskId}`);
        } catch (err) {
          logger.warn('On-chain payment failed, recording off-chain', { err });
        }
      }

      const amount = parseFloat(task.reward.toString());

      // Record payment in DB
      const payment = await prisma.payment.create({
        data: {
          taskId,
          workerId: worker.id,
          amount: task.reward,
          txHash: txHash || `mock_tx_${Date.now()}`,
          status: 'CONFIRMED',
        },
      });

      await prisma.task.update({ where: { id: taskId }, data: { status: 'PAID' } });

      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          completedTasks: { increment: 1 },
          totalEarnings: { increment: amount },
          reputation: { increment: Math.min(5, 100 - worker.reputation) },
        },
      });

      broadcastTaskUpdate({ id: taskId, status: 'PAID' });
      broadcastPayment({
        taskId,
        worker: task.assignedWorker,
        amount,
        txHash: payment.txHash,
        timestamp: new Date().toISOString(),
      });

      broadcastAILog({
        type: 'PAYMENT_TRIGGER',
        message: `💰 Paid ${amount.toFixed(4)} cUSD to ${task.assignedWorker?.slice(0, 10)}... for "${task.title}"`,
        metadata: { taskId, amount, worker: task.assignedWorker },
      });
    },
    { connection, concurrency: 5 }
  );

  // 5. Simulation worker (AI/scripted workers completing tasks)
  new Worker(
    QUEUE_NAMES.WORKER_SIMULATION,
    async (job: Job) => {
      const { taskId, workerAddress, personaName } = job.data;

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.status !== 'ASSIGNED' || task.assignedWorker !== workerAddress) return;

      // Simulate worker "thinking" time
      await new Promise((res) => setTimeout(res, 1000 + Math.random() * 4000));

      const result = await orchestrator.generateWorkerSubmission(taskId, personaName);

      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'SUBMITTED', submission: result.submission },
      });

      broadcastTaskUpdate({ id: taskId, status: 'SUBMITTED', worker: workerAddress });

      // Queue validation
      await validationQueue.add('validate', { taskId }, { delay: 500 });
    },
    { connection, concurrency: 20 }
  );

  logger.info('All BullMQ queue workers started');
  return { decompositionQueue, assignmentQueue, validationQueue, paymentQueue, simulationQueue };
}

// ─── Queue stats helper ───────────────────────────────────────────────────────

export async function getQueueStats() {
  const queues = [decompositionQueue, assignmentQueue, validationQueue, paymentQueue, simulationQueue];
  const stats = await Promise.all(
    queues.map(async (q) => {
      const [waiting, active, completed, failed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getCompletedCount(),
        q.getFailedCount(),
      ]);
      return { name: q.name, waiting, active, completed, failed };
    })
  );
  return stats;
}
