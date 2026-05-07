import axios from 'axios';
import { ethers } from 'ethers';
import { GeneratedWallet } from './walletGenerator';
import { MetricsCollector } from './metrics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: string;
  deadline?: string;
}

export interface WorkerSimulatorOptions {
  wallet: GeneratedWallet;
  metrics: MetricsCollector;
  maxTasks?: number;
  delayMs?: number;
  retryCount?: number;
}

export class WorkerSimulator {
  private wallet: GeneratedWallet;
  private metrics: MetricsCollector;
  private maxTasks: number;
  private delayMs: number;
  private retryCount: number;
  private active = true;

  constructor(options: WorkerSimulatorOptions) {
    this.wallet = options.wallet;
    this.metrics = options.metrics;
    this.maxTasks = options.maxTasks ?? 5;
    this.delayMs = options.delayMs ?? 500;
    this.retryCount = options.retryCount ?? 3;
  }

  async register(): Promise<boolean> {
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        await axios.post(`${API_BASE}/api/workers/register`, {
          walletAddress: this.wallet.address,
          workerType: 'SCRIPTED',
          personaName: this._randomPersona(),
        });
        return true;
      } catch (err: any) {
        if (err.response?.status === 200 || err.response?.data?.data) return true; // Already registered
        await this._sleep(1000 * (attempt + 1));
      }
    }
    this.metrics.recordError(`Failed to register wallet ${this.wallet.address}`);
    return false;
  }

  async run(): Promise<void> {
    let completedCount = 0;

    while (this.active && completedCount < this.maxTasks) {
      try {
        const task = await this._fetchOpenTask();
        if (!task) {
          await this._sleep(this.delayMs * 3);
          continue;
        }

        const taskStart = Date.now();
        this.metrics.record({ tasksAssigned: 1 });

        const submitted = await this._submitTask(task);
        if (submitted) {
          this.metrics.record({ tasksCompleted: 1 });
          this.metrics.recordCompletionTime(Date.now() - taskStart);
          completedCount++;
        } else {
          this.metrics.record({ tasksFailed: 1 });
        }

        await this._sleep(this.delayMs + Math.random() * this.delayMs);
      } catch (err: any) {
        this.metrics.recordError(err.message);
        await this._sleep(2000);
      }
    }
  }

  stop() {
    this.active = false;
  }

  private async _fetchOpenTask(): Promise<Task | null> {
    try {
      const res = await axios.get(`${API_BASE}/api/tasks/open`, { timeout: 5000 });
      const tasks: Task[] = res.data.data || [];
      if (tasks.length === 0) return null;

      // Pick a random task from the available pool
      return tasks[Math.floor(Math.random() * Math.min(tasks.length, 10))];
    } catch {
      return null;
    }
  }

  private async _submitTask(task: Task): Promise<boolean> {
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const submission = this._generateSubmission(task);

        await axios.post(
          `${API_BASE}/api/tasks/${task.id}/submit`,
          { submission, workerAddress: this.wallet.address },
          { timeout: 10000 }
        );

        return true;
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 404) return false;
        if (attempt < this.retryCount - 1) {
          this.metrics.record({ tasksRetried: 1 });
          await this._sleep(1000 * (attempt + 1));
        }
      }
    }
    return false;
  }

  private _generateSubmission(task: Task): string {
    // Simulate realistic worker output based on task title
    const title = task.title.toLowerCase();

    if (title.includes('label') || title.includes('image')) {
      return JSON.stringify({
        category: ['electronics', 'clothing', 'food', 'furniture', 'other'][Math.floor(Math.random() * 5)],
        quality: Math.floor(Math.random() * 5) + 1,
        confidence: Math.floor(Math.random() * 30) + 70,
      });
    }

    if (title.includes('sentiment') || title.includes('review')) {
      return JSON.stringify({
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        score: (Math.random() * 2 - 1).toFixed(2),
        summary: 'Customer expressed satisfaction with the product.',
      });
    }

    if (title.includes('translat')) {
      return `Translated content: ${task.description.slice(0, 100)} [ES] — Traducción completada con precisión.`;
    }

    if (title.includes('modera')) {
      return JSON.stringify({
        verdict: 'approved',
        flags: [],
        notes: 'Content complies with community guidelines.',
      });
    }

    return `Task "${task.title}" completed. Work performed as per specifications. All requirements met.`;
  }

  private _randomPersona(): string {
    const personas = [
      'DataLabeler', 'Translator', 'Moderator', 'Researcher',
      'Annotator', 'Reviewer', 'Analyst', 'Validator',
    ];
    return personas[this.wallet.index % personas.length];
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}
