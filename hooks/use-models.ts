import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ModelData {
  id: string;
  name: string;
  description?: string;
  provider: string;
  category: 'text' | 'image' | 'audio' | 'embedding' | 'multimodal';
  capabilities: string[];
  features: string[];
  available: boolean;
  favorite: boolean;
  badge?: { text: string; type: 'new' | 'pro' | 'free' | 'thinking' | 'default' | 'fast' };
  context_length?: number;
  owned_by?: string;
  created?: number;
}

interface UseModelsReturn {
  models: ModelData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFavorite: (modelId: string, isFavorite: boolean) => void;
  favoriteModels: ModelData[];
  availableModels: ModelData[];
  searchModels: (query: string) => ModelData[];
  filterByCapability: (capability: string) => ModelData[];
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<ModelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching models from server API...');

      // Use server API (which will call external API)
      const response = await fetch('/api/llm/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Server API response:', data);

      if (data.data && Array.isArray(data.data)) {
        setModels(data.data);

        if (data.fallback) {
          toast({
            title: "Using Fallback Models",
            description: "Could not fetch live models, using default configuration.",
            variant: "default",
          });
        } else {
          console.log(`✅ Loaded ${data.data.length} models from server API`);
        }
      } else {
        throw new Error('Invalid response format from models API');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching models:', errorMessage);
      setError(errorMessage);
      
      // Set comprehensive fallback models on error
      setModels([
        {
          id: 'gemini-2.5-flash-preview-05-20',
          name: 'Gemini 2.5 Flash Preview',
          description: 'Fast multimodal model with vision and reasoning capabilities',
          provider: 'google',
          category: 'text',
          capabilities: ['text', 'vision', 'reasoning', 'fast', 'web', 'streaming'],
          features: ['text', 'vision', 'reasoning', 'fast', 'web', 'streaming'],
          available: true,
          favorite: true,
          badge: { text: 'DEFAULT', type: 'default' },
          context_length: 1048576,
          owned_by: 'google',
          created: Date.now()
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Advanced multimodal model with vision capabilities (supports streaming)',
          provider: 'openai',
          category: 'text',
          capabilities: ['text', 'vision', 'reasoning', 'streaming'],
          features: ['text', 'vision', 'reasoning', 'streaming'],
          available: true,
          favorite: false,
          badge: { text: 'PRO', type: 'pro' },
          context_length: 128000,
          owned_by: 'openai',
          created: Date.now()
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Efficient and fast GPT-4 variant (supports streaming)',
          provider: 'openai',
          category: 'text',
          capabilities: ['text', 'reasoning', 'fast', 'streaming'],
          features: ['text', 'reasoning', 'fast', 'streaming'],
          available: true,
          favorite: false,
          badge: { text: 'FAST', type: 'new' },
          context_length: 128000,
          owned_by: 'openai',
          created: Date.now()
        },
        {
          id: 'claude-sonnet-4-20250514',
          name: 'Claude Sonnet 4',
          description: 'Advanced reasoning and analysis model (supports streaming)',
          provider: 'anthropic',
          category: 'text',
          capabilities: ['text', 'reasoning', 'analysis', 'streaming'],
          features: ['text', 'reasoning', 'analysis', 'streaming'],
          available: true,
          favorite: false,
          badge: { text: 'PRO', type: 'pro' },
          context_length: 200000,
          owned_by: 'anthropic',
          created: Date.now()
        },
        {
          id: 'o3',
          name: 'o3',
          description: 'Advanced reasoning model (no streaming support)',
          provider: 'openai',
          category: 'text',
          capabilities: ['text', 'reasoning'],
          features: ['text', 'reasoning'],
          available: true,
          favorite: false,
          badge: { text: 'THINKING', type: 'thinking' },
          context_length: 128000,
          owned_by: 'openai',
          created: Date.now()
        },
        // Add some example models for other categories
        {
          id: 'dall-e-3',
          name: 'DALL-E 3',
          description: 'Advanced image generation model',
          provider: 'openai',
          category: 'image',
          capabilities: ['image-generation', 'creative'],
          features: ['image-generation', 'creative'],
          available: false,
          favorite: false,
          badge: { text: 'IMAGE', type: 'new' },
          context_length: 4000,
          owned_by: 'openai',
          created: Date.now()
        },
        {
          id: 'whisper-1',
          name: 'Whisper',
          description: 'Speech-to-text transcription model',
          provider: 'openai',
          category: 'audio',
          capabilities: ['speech-to-text', 'audio-processing'],
          features: ['speech-to-text', 'audio-processing'],
          available: false,
          favorite: false,
          badge: { text: 'AUDIO', type: 'new' },
          context_length: 0,
          owned_by: 'openai',
          created: Date.now()
        }
      ]);

      toast({
        title: "Error Loading Models",
        description: "Using fallback model configuration. Check your API connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Update favorite status
  const updateFavorite = useCallback((modelId: string, isFavorite: boolean) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, favorite: isFavorite }
          : model
      )
    );

    // Optionally save to localStorage or API
    try {
      const favorites = JSON.parse(localStorage.getItem('model-favorites') || '[]');
      if (isFavorite) {
        if (!favorites.includes(modelId)) {
          favorites.push(modelId);
        }
      } else {
        const index = favorites.indexOf(modelId);
        if (index > -1) {
          favorites.splice(index, 1);
        }
      }
      localStorage.setItem('model-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.warn('Could not save favorite to localStorage:', error);
    }
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem('model-favorites') || '[]');
      if (savedFavorites.length > 0) {
        setModels(prevModels => 
          prevModels.map(model => ({
            ...model,
            favorite: savedFavorites.includes(model.id)
          }))
        );
      }
    } catch (error) {
      console.warn('Could not load favorites from localStorage:', error);
    }
  }, [models.length]); // Only run when models are first loaded

  // Search models
  const searchModels = useCallback((query: string): ModelData[] => {
    if (!query.trim()) return models;
    
    const lowercaseQuery = query.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(lowercaseQuery) ||
      model.description?.toLowerCase().includes(lowercaseQuery) ||
      model.provider.toLowerCase().includes(lowercaseQuery) ||
      model.capabilities.some(cap => cap.toLowerCase().includes(lowercaseQuery))
    );
  }, [models]);

  // Filter by capability
  const filterByCapability = useCallback((capability: string): ModelData[] => {
    return models.filter(model => 
      model.capabilities.includes(capability) || 
      model.features.includes(capability)
    );
  }, [models]);

  // Computed values
  const favoriteModels = models.filter(model => model.favorite);
  const availableModels = models.filter(model => model.available);

  return {
    models,
    isLoading,
    error,
    refetch: fetchModels,
    updateFavorite,
    favoriteModels,
    availableModels,
    searchModels,
    filterByCapability,
  };
}
