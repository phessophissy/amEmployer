import OpenAI from 'openai';
import { AIProvider, CompletionOptions, Message } from './base';
import logger from '../../../lib/logger';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  private client: OpenAI;
  private model: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.AI_MODEL || 'gpt-4o';
  }

  async complete(messages: Message[], options: CompletionOptions = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 2048, systemPrompt } = options;

    const openAIMessages: OpenAI.ChatCompletionMessageParam[] = [];
    if (systemPrompt) openAIMessages.push({ role: 'system', content: systemPrompt });
    messages.forEach((m) => openAIMessages.push({ role: m.role, content: m.content }));

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (err) {
      logger.error('OpenAI API error', { err });
      throw err;
    }
  }

  async structuredComplete<T>(messages: Message[], options: CompletionOptions = {}): Promise<T> {
    const systemPrompt = (options.systemPrompt || '') +
      '\n\nRESPOND ONLY WITH VALID JSON. No markdown, no code blocks, just raw JSON.';

    const text = await this.complete(messages, { ...options, systemPrompt, temperature: 0.1 });

    try {
      const cleaned = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      logger.error('Failed to parse OpenAI JSON response', { text });
      throw new Error('AI returned invalid JSON');
    }
  }
}
