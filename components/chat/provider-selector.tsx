"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  BotIcon, 
  ChevronDownIcon, 
  SparklesIcon, 
  ZapIcon, 
  BrainIcon,
  ServerIcon,
  CheckIcon
} from 'lucide-react';
import { LLMProvider, LLMModel, getAllProviders } from '@/lib/llm-providers';
import { getDefaultAvailableProvider, getProviderDefaultModel } from '@/lib/env-config';

interface ProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const getProviderIcon = (providerId: string) => {
  switch (providerId) {
    case 'openai':
      return <SparklesIcon className="h-4 w-4" />;
    case 'anthropic':
      return <BrainIcon className="h-4 w-4" />;
    case 'google':
      return <ZapIcon className="h-4 w-4" />;
    case 'openai-compatible':
      return <ServerIcon className="h-4 w-4" />;
    default:
      return <BotIcon className="h-4 w-4" />;
  }
};

const getModelBadgeColor = (model: LLMModel) => {
  if (model.id.includes('gpt-4') || model.id.includes('claude-3-5') || model.id.includes('gemini-1.5-pro')) {
    return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
  }
  if (model.id.includes('mini') || model.id.includes('haiku') || model.id.includes('flash')) {
    return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
  }
  return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
};

export default function ProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false
}: ProviderSelectorProps) {
  const [availableProviders, setAvailableProviders] = useState<LLMProvider[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setAvailableProviders(getAllProviders());
  }, []);

  const currentProvider = availableProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel);

  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    const provider = availableProviders.find(p => p.id === providerId);
    if (provider) {
      // Auto-select the default model for the new provider
      onModelChange(provider.defaultModel);
    }
    setIsOpen(false);
  };

  if (availableProviders.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <BotIcon className="h-4 w-4" />
        <span className="text-sm">Loading providers...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Provider Selection */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 px-3 bg-background/50 hover:bg-background/80 border-border/40"
          >
            <div className="flex items-center space-x-2">
              {getProviderIcon(selectedProvider)}
              <span className="text-sm font-medium">
                {currentProvider?.name || selectedProvider}
              </span>
              <ChevronDownIcon className="h-3 w-3 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b border-border/40">
            <h4 className="font-medium text-sm">Select AI Provider</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Choose your preferred language model provider
            </p>
          </div>
          <div className="p-2 space-y-1">
            {availableProviders.map((provider) => (
              <motion.div
                key={provider.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`w-full justify-start h-auto p-3 ${
                    selectedProvider === provider.id 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      {getProviderIcon(provider.id)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{provider.name}</span>
                        {selectedProvider === provider.id && (
                          <CheckIcon className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {provider.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {provider.models.length} models
                        </Badge>
                        {provider.apiKeyRequired && (
                          <Badge variant="outline" className="text-xs">
                            API Key Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Model Selection */}
      {currentProvider && (
        <Select
          value={selectedModel}
          onValueChange={onModelChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-auto min-w-[140px] h-8 bg-background/50 hover:bg-background/80 border-border/40">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{currentModel?.name || selectedModel}</span>
                {currentModel && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getModelBadgeColor(currentModel)}`}
                  >
                    {currentModel.maxTokens >= 100000 ? 'Long' : 'Standard'}
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {currentProvider.models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getModelBadgeColor(model)}`}
                    >
                      {model.maxTokens.toLocaleString()} tokens
                    </Badge>
                    {model.supportsImages && (
                      <Badge variant="secondary" className="text-xs">
                        Vision
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
