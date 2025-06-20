export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface LLMRequest {
  messages: ChatMessage[];
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  userId?: string;
  sessionId?: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  provider: string;
  model: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface LLMError {
  provider: string;
  model: string;
  error: string;
  code?: string;
  details?: any;
}

// Provider-specific message formats
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GoogleMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// Provider-specific request formats
export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
}

export interface GoogleRequest {
  contents: GoogleMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

// Response types
export interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AnthropicResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason: string;
}

export interface GoogleResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
