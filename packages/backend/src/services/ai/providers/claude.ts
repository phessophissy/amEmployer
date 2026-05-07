import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, CompletionOptions, Message } from './base';
import logger from '../../../lib/logger';

export class ClaudeProvider implements AIProvider {
  readonly id = 'claude';
  readonly name = 'Claude (Anthropic)';

  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.AI_MODEL || 'claude-opus-4-5';
  }

  async complete(messages: Message[], options: CompletionOptions = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 2048, systemPrompt } = options;

    const anthropicMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const system = systemPrompt || messages.find((m) => m.role === 'system')?.content;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: anthropicMessages,
      });

      const block = response.content[0];
      if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
      return block.text;
    } catch (err) {
      logger.error('Claude API error', { err });
      throw err;
    }
  }

  async structuredComplete<T>(messages: Message[], options: CompletionOptions = {}): Promise<T> {
    const systemPrompt = (options.systemPrompt || '') +
      '\n\nRESPOND ONLY WITH VALID JSON. No markdown, no code blocks, just raw JSON.';

    const text = await this.complete(messages, { ...options, systemPrompt, temperature: 0.2 });

    try {
      // Strip any accidental markdown
      const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      logger.error('Failed to parse Claude JSON response', { text });
      throw new Error('AI returned invalid JSON');
    }
  }
}
