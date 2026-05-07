import { AIProvider, CompletionOptions, Message } from './base';
import logger from '../../../lib/logger';

// Mock responses for demo/testing without real API keys
const MOCK_TASKS: Array<{ title: string; description: string }> = [
  { title: 'Label product images — batch 1', description: 'Classify 5 product images into categories: electronics, clothing, food, furniture, other.' },
  { title: 'Sentiment analysis — set A', description: 'Analyze sentiment (positive/negative/neutral) for 5 customer reviews.' },
  { title: 'Data validation — records 1-50', description: 'Check 50 database records for missing fields and formatting errors.' },
  { title: 'Content moderation — batch 1', description: 'Review 5 user posts for policy violations and mark appropriately.' },
  { title: 'Translation QA — EN→ES batch 1', description: 'Verify accuracy of 5 English-to-Spanish translations.' },
];

export class MockAIProvider implements AIProvider {
  readonly id = 'mock';
  readonly name = 'Mock AI (Demo)';

  async complete(_messages: Message[], _options: CompletionOptions = {}): Promise<string> {
    await this._delay(300);
    logger.info('[MockAI] Using mock AI response');
    return 'Mock AI response generated successfully.';
  }

  async structuredComplete<T>(_messages: Message[], _options: CompletionOptions = {}): Promise<T> {
    await this._delay(500);
    logger.info('[MockAI] Generating mock structured response');

    // Return a realistic task decomposition
    const taskCount = 5 + Math.floor(Math.random() * 6); // 5–10 tasks
    const tasks = Array.from({ length: taskCount }, (_, i) => ({
      ...MOCK_TASKS[i % MOCK_TASKS.length],
      reward: (0.1 + Math.random() * 0.4).toFixed(2),
      estimatedMinutes: 5 + Math.floor(Math.random() * 25),
      requiredReputation: Math.floor(Math.random() * 30),
    }));

    return { tasks, summary: `Decomposed into ${taskCount} microtasks.` } as unknown as T;
  }

  private _delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

export class MockValidationProvider implements AIProvider {
  readonly id = 'mock-validation';
  readonly name = 'Mock Validation AI';

  async complete(_messages: Message[], _options?: CompletionOptions): Promise<string> {
    await this._delay(200);
    return 'APPROVED';
  }

  async structuredComplete<T>(_messages: Message[], _options?: CompletionOptions): Promise<T> {
    await this._delay(300);
    const approved = Math.random() > 0.2; // 80% approval rate in demo
    return {
      approved,
      score: approved ? 70 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 40),
      notes: approved ? 'Work meets quality standards.' : 'Submission incomplete or incorrect.',
    } as unknown as T;
  }

  private _delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}
