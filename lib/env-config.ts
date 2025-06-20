/**
 * Environment configuration for LLM providers
 */

export interface EnvConfig {
  'openai-compatible': {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
  };
  defaultProvider: string;
}

export const getEnvConfig = (): EnvConfig => {
  return {
    'openai-compatible': {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_API_KEY,
      baseUrl: process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_BASE_URL || 'http://localhost:11434/v1',
      defaultModel: process.env.DEFAULT_OPENAI_COMPATIBLE_MODEL || 'llama3.2:latest',
    },
    defaultProvider: 'openai-compatible', // Now always default to openai-compatible
  };
};

export const getProviderApiKey = (provider: string): string | undefined => {
  const config = getEnvConfig();

  if (provider === 'openai-compatible') {
    return config['openai-compatible'].apiKey;
  }
  return undefined; // Should not happen with current logic
};

export const getProviderBaseUrl = (provider: string): string | undefined => {
  const config = getEnvConfig();

  if (provider === 'openai-compatible') {
    return config['openai-compatible'].baseUrl;
  }
  return undefined; // Should not happen with current logic
};

export const getProviderDefaultModel = (provider: string): string => {
  const config = getEnvConfig();

  if (provider === 'openai-compatible') {
    return config['openai-compatible'].defaultModel;
  }
  return 'default-model'; // Fallback for unexpected provider
};

export const isProviderAvailable = (provider: string): boolean => {
  if (provider === 'openai-compatible') {
    const baseUrl = getProviderBaseUrl(provider);
    const apiKey = getProviderApiKey(provider);
    return !!baseUrl && !!apiKey && !apiKey.startsWith('your_');
  }
  return false; // Only openai-compatible is supported now
};

export const getAvailableProviders = (): string[] => {
  const providers = ['openai-compatible'];
  return providers.filter(p => isProviderAvailable(p));
};

export const getDefaultAvailableProvider = (): string => {
  const config = getEnvConfig();
  const availableProviders = getAvailableProviders();
  
  // Return default provider if available, otherwise first available
  if (availableProviders.includes(config.defaultProvider)) {
    return config.defaultProvider;
  }
  
  return availableProviders.length > 0 ? availableProviders[0] : 'openai-compatible';
};

export const validateEnvironment = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const availableProviders = getAvailableProviders();
  
  if (availableProviders.length === 0) {
    errors.push('No LLM provider API keys are configured. Please add at least one API key.');
  }
  
  const config = getEnvConfig();
  if (!availableProviders.includes(config.defaultProvider)) {
    warnings.push(`Default provider '${config.defaultProvider}' is not available. Using '${getDefaultAvailableProvider()}' instead.`);
  }
  
  // Check for placeholder values for openai-compatible
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
