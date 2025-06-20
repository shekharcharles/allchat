export interface LLMModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsImages?: boolean;
  costPer1kTokens?: {
    input: number;
    output: number;
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  apiKeyRequired: boolean;
  models: LLMModel[];
  defaultModel: string;
  apiEndpoint?: string;
  headers?: Record<string, string>;
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models from OpenAI',
    website: 'https://openai.com',
    apiKeyRequired: true,
    defaultModel: 'gpt-4o',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most advanced multimodal model',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.005, output: 0.015 }
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Faster, cheaper version of GPT-4o',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.00015, output: 0.0006 }
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'High-performance GPT-4 model',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.01, output: 0.03 }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model',
        maxTokens: 16385,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0.0005, output: 0.0015 }
      }
    ]
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models from Anthropic',
    website: 'https://anthropic.com',
    apiKeyRequired: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model with enhanced capabilities',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.003, output: 0.015 }
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest model for quick tasks',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.0008, output: 0.004 }
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most powerful model for complex tasks',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.015, output: 0.075 }
      }
    ]
  },
  google: {
    id: 'google',
    name: 'Google',
    description: 'Gemini models from Google',
    website: 'https://ai.google.dev',
    apiKeyRequired: true,
    defaultModel: 'gemini-1.5-pro',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning and multimodal capabilities',
        maxTokens: 2000000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.00125, output: 0.005 }
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient for high-frequency tasks',
        maxTokens: 1000000,
        supportsStreaming: true,
        supportsImages: true,
        costPer1kTokens: { input: 0.000075, output: 0.0003 }
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Balanced performance for various tasks',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0.0005, output: 0.0015 }
      }
    ]
  },
  'openai-compatible': {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    description: 'Local models via OpenAI-compatible APIs (Ollama, LM Studio, etc.)',
    website: 'https://ollama.ai',
    apiKeyRequired: false,
    defaultModel: 'llama3.2:latest',
    models: [
      {
        id: 'llama3.2:latest',
        name: 'Llama 3.2',
        description: 'Meta\'s latest Llama model',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0, output: 0 }
      },
      {
        id: 'llama3.1:latest',
        name: 'Llama 3.1',
        description: 'Meta\'s Llama 3.1 model',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0, output: 0 }
      },
      {
        id: 'mistral:latest',
        name: 'Mistral',
        description: 'Mistral AI model',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0, output: 0 }
      },
      {
        id: 'codellama:latest',
        name: 'Code Llama',
        description: 'Code-specialized Llama model',
        maxTokens: 100000,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0, output: 0 }
      },
      {
        id: 'custom',
        name: 'Custom Model',
        description: 'Custom model configured in your local setup',
        maxTokens: 32768,
        supportsStreaming: true,
        supportsImages: false,
        costPer1kTokens: { input: 0, output: 0 }
      }
    ]
  }
};

export const getProvider = (providerId: string): LLMProvider | undefined => {
  return LLM_PROVIDERS[providerId];
};

export const getModel = (providerId: string, modelId: string): LLMModel | undefined => {
  const provider = getProvider(providerId);
  return provider?.models.find(model => model.id === modelId);
};

export const getAllProviders = (): LLMProvider[] => {
  return Object.values(LLM_PROVIDERS);
};

export const getAvailableProviders = (): LLMProvider[] => {
  // Filter providers based on available API keys
  return getAllProviders().filter(provider => {
    if (!provider.apiKeyRequired) return true;
    
    // Check if API key is available in environment
    const envKey = `${provider.id.toUpperCase()}_API_KEY`;
    return !!process.env[envKey];
  });
};

export const getDefaultProvider = (): LLMProvider => {
  const available = getAvailableProviders();
  return available.length > 0 ? available[0] : LLM_PROVIDERS.openai;
};

export const validateProviderAndModel = (providerId: string, modelId: string): boolean => {
  const provider = getProvider(providerId);
  if (!provider) return false;
  
  const model = getModel(providerId, modelId);
  return !!model;
};
