import { LLMRequest, LLMResponse, LLMStreamChunk, LLMError, ChatMessage } from '@/types/llm';
import { getProvider, getModel } from './llm-providers';
import { getProviderApiKey, getProviderBaseUrl } from './env-config';

export abstract class BaseLLMProvider {
  protected apiKey: string;
  protected providerId: string;

  constructor(providerId: string, apiKey: string) {
    this.providerId = providerId;
    this.apiKey = apiKey;
  }

  abstract generateResponse(request: LLMRequest): Promise<LLMResponse>;
  abstract generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
  
  protected handleError(error: any): LLMError {
    return {
      provider: this.providerId,
      model: '',
      error: error.message || 'Unknown error',
      code: error.code,
      details: error,
    };
  }
}

export class OpenAIProvider extends BaseLLMProvider {
  private baseUrl = 'https://api.openai.com/v1';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        provider: request.provider,
        model: request.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield {
                content: '',
                done: true,
                provider: request.provider,
                model: request.model,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                yield {
                  content,
                  done: false,
                  provider: request.provider,
                  model: request.model,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export class AnthropicProvider extends BaseLLMProvider {
  private baseUrl = 'https://api.anthropic.com/v1';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
          max_tokens: request.maxTokens || 4000,
          temperature: request.temperature || 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content[0].text,
        provider: request.provider,
        model: request.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: data.stop_reason,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.filter(msg => msg.role !== 'system').map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
          max_tokens: request.maxTokens || 4000,
          temperature: request.temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                if (content) {
                  yield {
                    content,
                    done: false,
                    provider: request.provider,
                    model: request.model,
                  };
                }
              } else if (parsed.type === 'message_stop') {
                yield {
                  content: '',
                  done: true,
                  provider: request.provider,
                  model: request.model,
                };
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export class OpenAICompatibleProvider extends BaseLLMProvider {
  private baseUrl: string;

  constructor(providerId: string, apiKey: string, baseUrl: string) {
    super(providerId, apiKey);
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if API key is provided and not a placeholder
      if (this.apiKey && this.apiKey !== 'your_openai_compatible_api_key_here') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI-Compatible API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        provider: request.provider,
        model: request.model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async* generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if API key is provided and not a placeholder
      if (this.apiKey && this.apiKey !== 'your_openai_compatible_api_key_here') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model,
          messages: request.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI-Compatible API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield {
                content: '',
                done: true,
                provider: request.provider,
                model: request.model,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                yield {
                  content,
                  done: false,
                  provider: request.provider,
                  model: request.model,
                };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export class LLMService {
  private providers: Map<string, BaseLLMProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    const openaiKey = getProviderApiKey('openai');
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider('openai', openaiKey));
    }

    // Initialize Anthropic
    const anthropicKey = getProviderApiKey('anthropic');
    if (anthropicKey) {
      this.providers.set('anthropic', new AnthropicProvider('anthropic', anthropicKey));
    }

    // Initialize OpenAI-Compatible
    const compatibleKey = getProviderApiKey('openai-compatible') || 'no-key-required';
    const compatibleBaseUrl = getProviderBaseUrl('openai-compatible');
    if (compatibleBaseUrl) {
      this.providers.set('openai-compatible', new OpenAICompatibleProvider('openai-compatible', compatibleKey, compatibleBaseUrl));
    }

    // Google provider will be added in next iteration
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not available`);
    }

    // Validate provider and model
    const providerConfig = getProvider(request.provider);
    const modelConfig = getModel(request.provider, request.model);
    
    if (!providerConfig || !modelConfig) {
      throw new Error(`Invalid provider or model: ${request.provider}/${request.model}`);
    }

    return provider.generateResponse(request);
  }

  async* generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const provider = this.providers.get(request.provider);
    if (!provider) {
      throw new Error(`Provider ${request.provider} not available`);
    }

    // Validate provider and model
    const providerConfig = getProvider(request.provider);
    const modelConfig = getModel(request.provider, request.model);
    
    if (!providerConfig || !modelConfig) {
      throw new Error(`Invalid provider or model: ${request.provider}/${request.model}`);
    }

    yield* provider.generateStreamResponse(request);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
