import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import { broadcastAILog } from '../../websocket';
import {
  buildDecompositionPrompt,
  buildValidationPrompt,
  buildWorkerSubmissionPrompt,
  TaskDecompositionResult,
  ValidationResult,
  WorkerSubmissionResult,
} from './prompts';
import { AIProvider } from './providers/base';
import { ClaudeProvider } from './providers/claude';
import { OpenAIProvider } from './providers/openai';
import { MockAIProvider, MockValidationProvider } from './providers/mock';

// ─── Provider factory ─────────────────────────────────────────────────────────

function createProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';
  switch (provider) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      logger.warn('Using mock AI provider — set AI_PROVIDER=claude or openai for production');
      return new MockAIProvider();
  }
}

function createValidationProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';
  switch (provider) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      return new MockValidationProvider();
  }
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export class AIOrchestrator {
  private provider: AIProvider;
  private validationProvider: AIProvider;

  constructor() {
    this.provider = createProvider();
    this.validationProvider = createValidationProvider();
  }

  /**
   * Decompose a high-level job into microtasks using AI.
   */
  async decomposeJob(jobId: string, workerCount: number = 10): Promise<TaskDecompositionResult> {
    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

    await this._logAI('JOB_DECOMPOSITION', `Starting decomposition of job: "${job.title}"`, jobId);

    const messages = buildDecompositionPrompt(
      job.title,
      job.description,
      job.totalBudget.toString(),
      workerCount
    );

    let result: TaskDecompositionResult;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        result = await this.provider.structuredComplete<TaskDecompositionResult>(messages, {
          temperature: 0.4,
          maxTokens: 3000,
        });

        if (!result.tasks || result.tasks.length === 0) {
          throw new Error('AI returned 0 tasks');
        }

        await this._logAI(
          'JOB_DECOMPOSITION',
          `✅ Decomposed "${job.title}" into ${result.tasks.length} tasks. ${result.summary}`,
          jobId,
          { taskCount: result.tasks.length }
        );

        return result;
      } catch (err) {
        attempts++;
        logger.warn(`AI decomposition attempt ${attempts} failed:`, err);
        if (attempts >= maxAttempts) throw err;
        await this._delay(1000 * attempts);
      }
    }

    throw new Error('AI decomposition failed after max retries');
  }

  /**
   * Select the best available worker for a task based on reputation.
   */
  async selectWorkerForTask(
    taskId: string,
    availableWorkerAddresses: string[]
  ): Promise<string | null> {
    if (availableWorkerAddresses.length === 0) return null;

    const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
    const workers = await prisma.worker.findMany({
      where: {
        walletAddress: { in: availableWorkerAddresses },
        isActive: true,
        reputation: { gte: task.attempts > 0 ? 0 : 0 }, // Allow any worker
      },
      orderBy: { reputation: 'desc' },
      take: 1,
    });

    const selected = workers[0];
    if (!selected) return null;

    await this._logAI(
      'TASK_ASSIGNMENT',
      `Assigned task "${task.title}" to worker ${selected.walletAddress.slice(0, 8)}... (rep: ${selected.reputation})`,
      task.jobId,
      { taskId, workerAddress: selected.walletAddress, reputation: selected.reputation }
    );

    return selected.walletAddress;
  }

  /**
   * Validate a worker's submission using AI.
   */
  async validateSubmission(taskId: string, submission: string): Promise<ValidationResult> {
    const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

    await this._logAI(
      'VALIDATION',
      `Validating submission for task "${task.title}"...`,
      task.jobId
    );

    const messages = buildValidationPrompt(task.title, task.description, submission);

    let result: ValidationResult;
    let attempts = 0;

    while (attempts < 3) {
      try {
        result = await this.validationProvider.structuredComplete<ValidationResult>(messages, {
          temperature: 0.1,
          maxTokens: 500,
        });

        const status = result.approved ? '✅ APPROVED' : '❌ REJECTED';
        await this._logAI(
          'VALIDATION',
          `${status} task "${task.title}" — score: ${result.score}/100. ${result.notes}`,
          task.jobId,
          { taskId, score: result.score, approved: result.approved }
        );

        return result;
      } catch (err) {
        attempts++;
        if (attempts >= 3) throw err;
        await this._delay(500 * attempts);
      }
    }

    throw new Error('Validation failed after max retries');
  }

  /**
   * Generate a worker submission for AI worker agents.
   */
  async generateWorkerSubmission(
    taskId: string,
    personaName?: string
  ): Promise<WorkerSubmissionResult> {
    const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

    const messages = buildWorkerSubmissionPrompt(task.title, task.description, personaName);

    try {
      return await this.provider.structuredComplete<WorkerSubmissionResult>(messages, {
        temperature: 0.6,
        maxTokens: 1000,
      });
    } catch {
      // Fallback for demo
      return {
        submission: `Task completed: ${task.title}. Work performed according to specifications.`,
        confidence: 75,
      };
    }
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  private async _logAI(
    type: string,
    message: string,
    jobId?: string,
    metadata?: Record<string, unknown>
  ) {
    logger.info(`[AI:${type}] ${message}`);
    broadcastAILog({ type, message, metadata });

    try {
      await prisma.aILog.create({
        data: {
          jobId: jobId || null,
          type: type as any,
          message,
          metadata: (metadata as any) || undefined,
        },
      });
    } catch (err) {
      logger.warn('Failed to persist AI log', { err });
    }
  }

  private _delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

// Singleton instance
export const orchestrator = new AIOrchestrator();
