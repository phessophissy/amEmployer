// Base interface all AI providers must implement

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  complete(messages: Message[], options?: CompletionOptions): Promise<string>;
  structuredComplete<T>(messages: Message[], options?: CompletionOptions): Promise<T>;
}
