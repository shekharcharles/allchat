"use client";

import * as React from "react";
import { Loader2, Star, Search, Sparkles, Zap, Brain, Eye, MessageCircle, Filter, Grid3X3, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModels } from "@/hooks/use-models";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

// Use the ModelData interface from our hook
import type { ModelData } from "@/hooks/use-models";

// Feature icon mapping - exactly like HTML version
const featureIcons = {
  fast: { emoji: '⚡', color: 'bg-green-500' },
  web: { emoji: '🌐', color: 'bg-blue-500' },
  vision: { emoji: '👁️', color: 'bg-purple-500' },
  reasoning: { emoji: '🧠', color: 'bg-indigo-500' },
  pdf: { emoji: '📄', color: 'bg-red-500' },
  image: { emoji: '🎨', color: 'bg-yellow-500' }
};

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  // State management
  const [isPopoverOpen, setIsPopoverOpen] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = React.useState<boolean>(false);

  // Use our real-time models hook
  const {
    models: allModels,
    isLoading,
    error,
    refetch,
    searchModels,
    filterByCapability,
    updateFavorite
  } = useModels();

  // Filter models based on search and active filters
  const filteredModels = React.useMemo(() => {
    let filtered = allModels;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchModels(searchQuery);
    }

    // Apply filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(model => {
        // Check category filters
        const categoryFilters = activeFilters.filter(f => f.startsWith('category:'));
        const capabilityFilters = activeFilters.filter(f => !f.startsWith('category:'));

        // If category filter is active, model must match the category
        if (categoryFilters.length > 0) {
          const matchesCategory = categoryFilters.some(filter => {
            const category = filter.replace('category:', '');
            return model.category === category;
          });
          if (!matchesCategory) return false;
        }

        // If capability filters are active, model must have all capabilities
        if (capabilityFilters.length > 0) {
          const matchesCapabilities = capabilityFilters.every(filter =>
            model.capabilities.includes(filter) || model.features.includes(filter)
          );
          if (!matchesCapabilities) return false;
        }

        return true;
      });
    }

    return filtered;
  }, [allModels, searchQuery, activeFilters, searchModels]);

  // Group models by category
  const modelsByCategory = React.useMemo(() => {
    const grouped = filteredModels.reduce((acc, model) => {
      const category = model.category || 'text';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(model);
      return acc;
    }, {} as Record<string, ModelData[]>);

    // Sort models within each category (favorites first, then by name)
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [filteredModels]);

  // Category metadata
  const categoryInfo = {
    text: {
      name: 'Text Models',
      icon: '💬',
      description: 'Language models for text generation and conversation',
      color: 'bg-blue-50 border-blue-200'
    },
    image: {
      name: 'Image Models',
      icon: '🎨',
      description: 'Models for image generation and visual content',
      color: 'bg-purple-50 border-purple-200'
    },
    audio: {
      name: 'Audio Models',
      icon: '🎵',
      description: 'Models for speech, audio processing and synthesis',
      color: 'bg-green-50 border-green-200'
    },
    embedding: {
      name: 'Embedding Models',
      icon: '🔗',
      description: 'Models for text embeddings and similarity',
      color: 'bg-orange-50 border-orange-200'
    },
    multimodal: {
      name: 'Multimodal Models',
      icon: '🌟',
      description: 'Models that work with multiple types of content',
      color: 'bg-indigo-50 border-indigo-200'
    }
  };



  // Create model row component - list view like screenshot
  const createModelRow = (model: ModelData) => {
    const isSelected = model.id === selectedModel;
    const isDisabled = !model.available;

    return (
      <motion.div
        key={model.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ backgroundColor: isDisabled ? undefined : 'rgba(139, 92, 246, 0.05)' }}
        className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-200 border-b border-border/30 last:border-b-0 ${
          isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/30'}`}
        onClick={() => {
          if (!isDisabled) {
            onModelChange(model.id);
            setIsPopoverOpen(false);
          }
        }}
      >
        {/* Left side - Model info */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Model icon */}
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold ${
            model.id.includes('gemini') ? 'text-purple-600' :
            model.id.includes('gpt') ? 'text-orange-600' :
            model.id.includes('claude') ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {model.id.includes('gemini') ? '♦' :
             model.id.includes('gpt') ? '⚙' :
             model.id.includes('claude') ? '🎭' :
             model.name.charAt(0)}
          </div>

          {/* Model name and badges */}
          <div className="flex items-center space-x-2 flex-1">
            <span className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>
              {model.name}
            </span>

            {/* Status badges */}
            {model.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                model.badge.type === 'new' ? 'bg-green-100 text-green-700' :
                model.badge.type === 'thinking' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {model.badge.text}
              </span>
            )}

            {/* Pro badge for unavailable models */}
            {!model.available && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                PRO
              </span>
            )}

            {/* Special indicators */}
            {model.features.includes('fast') && (
              <span className="text-yellow-500 text-xs">⚡</span>
            )}
          </div>
        </div>

        {/* Right side - Feature icons */}
        <div className="flex items-center space-x-1">
          {/* Show first 4 feature icons */}
          {model.features.slice(0, 4).map((feature, index) => {
            let icon, bgColor, textColor;

            switch (feature) {
              case 'vision':
                icon = <Eye className="h-3 w-3" />;
                bgColor = 'bg-teal-100';
                textColor = 'text-teal-600';
                break;
              case 'web':
                icon = <Search className="h-3 w-3" />;
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-600';
                break;
              case 'pdf':
                icon = <MessageCircle className="h-3 w-3" />;
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-600';
                break;
              case 'reasoning':
                icon = <Brain className="h-3 w-3" />;
                bgColor = 'bg-indigo-100';
                textColor = 'text-indigo-600';
                break;
              case 'image':
              case 'image-generation':
                icon = <Sparkles className="h-3 w-3" />;
                bgColor = 'bg-orange-100';
                textColor = 'text-orange-600';
                break;
              case 'fast':
                icon = <Zap className="h-3 w-3" />;
                bgColor = 'bg-yellow-100';
                textColor = 'text-yellow-600';
                break;
              default:
                icon = <span className="text-xs font-bold">{feature.charAt(0).toUpperCase()}</span>;
                bgColor = 'bg-gray-100';
                textColor = 'text-gray-600';
            }

            return (
              <div
                key={feature}
                className={`w-6 h-6 ${bgColor} rounded-full flex items-center justify-center ${textColor}`}
                title={feature}
              >
                {icon}
              </div>
            );
          })}

          {/* Show +N indicator if there are more features */}
          {model.features.length > 4 && (
            <div
              className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 cursor-help"
              title={`Additional features: ${model.features.slice(4).join(', ')}`}
            >
              <span className="text-xs font-medium">+{model.features.length - 4}</span>
            </div>
          )}

          {/* Unavailable indicator */}
          {!model.available && (
            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">🔒</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Show loading state only if we have no models at all
  if (isLoading && allModels.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading models...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isPopoverOpen}
              className="w-[220px] justify-between text-sm model-selector rounded-xl h-10 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm"
              disabled={disabled || allModels.length === 0}
            >
              {selectedModel ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <span className="truncate font-medium">{selectedModel}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                    <Brain className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">Select a model...</span>
                </div>
              )}
              <motion.div
                animate={{ rotate: isPopoverOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0 model-selector shadow-2xl border border-border/20 rounded-2xl" align="start" side="top">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden max-h-[500px] flex flex-col"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-border/30">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Trigger a re-fetch of models
                    refetch();
                  }}
                  disabled={isLoading}
                  className="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-200 disabled:opacity-50"
                  title="Refresh models"
                >
                  <Loader2 className={`h-4 w-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Upgrade Banner */}
            <div className="mx-4 mb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Unlock all models + higher limits</p>
                    <div className="flex items-baseline space-x-1 mt-1">
                      <span className="text-2xl font-bold text-pink-600">$8</span>
                      <span className="text-sm text-gray-600">/month</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Upgrade now
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Models List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading models from API...</p>
                  <p className="text-xs mt-1">Fetching available models</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-sm text-red-600">Failed to load models</p>
                  <p className="text-xs mt-1 text-red-500">{error}</p>
                  <p className="text-xs mt-2">Using static models only</p>
                </div>
              ) : Object.keys(modelsByCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(modelsByCategory).map(([category, models]) => {
                    const info = categoryInfo[category as keyof typeof categoryInfo] || {
                      name: category.charAt(0).toUpperCase() + category.slice(1) + ' Models',
                      icon: '🤖',
                      description: `${category} models`,
                      color: 'bg-gray-50 border-gray-200'
                    };

                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        {/* Category Header */}
                        <div className={`mx-4 p-3 rounded-xl border ${info.color}`}>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{info.icon}</span>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-800">{info.name}</h3>
                              <p className="text-xs text-gray-600">{info.description}</p>
                            </div>
                            <span className="text-xs bg-white/70 px-2 py-1 rounded-full font-medium text-gray-700">
                              {models.length}
                            </span>
                          </div>
                        </div>

                        {/* Models in Category */}
                        <div className="space-y-0">
                          {models.map(model => createModelRow(model))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No models found matching "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              )}

              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-4 border-t border-border/30 bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    Debug: {allModels.length} real-time models loaded
                  </p>
                  {error && (
                    <p className="text-xs text-red-500 mt-1">Error: {error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between p-4 border-t border-border/30 bg-card/50">
              {/* Show all button */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="font-medium">Real-time Models</span>
              </div>

              {/* Filter Button */}
              <div className="relative filter-menu-container">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="w-8 h-8 bg-muted/50 hover:bg-muted rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </motion.button>

                {/* Filter Menu */}
                <AnimatePresence>
                  {isFilterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[200px]"
                    >
                      <div className="space-y-4">
                        {/* Category Filters */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Filter by category</h4>
                          <div className="space-y-2">
                            {Object.entries(categoryInfo).map(([categoryKey, info]) => {
                              const hasModels = modelsByCategory[categoryKey]?.length > 0;
                              if (!hasModels) return null;

                              return (
                                <motion.div
                                  key={categoryKey}
                                  whileHover={{ scale: 1.02 }}
                                  className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                  onClick={() => {
                                    setActiveFilters(prev => {
                                      const categoryFilter = `category:${categoryKey}`;
                                      return prev.includes(categoryFilter)
                                        ? prev.filter(f => f !== categoryFilter)
                                        : [...prev.filter(f => !f.startsWith('category:')), categoryFilter];
                                    });
                                  }}
                                >
                                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                                    activeFilters.includes(`category:${categoryKey}`)
                                      ? 'bg-primary border-primary'
                                      : 'border-border'
                                  }`}>
                                    {activeFilters.includes(`category:${categoryKey}`) && (
                                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="text-sm">{info.icon} {info.name}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Capability Filters */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Filter by capabilities</h4>
                          <div className="space-y-2">
                            {[
                              { id: 'fast', label: '⚡ Fast' },
                              { id: 'vision', label: '👁️ Vision' },
                              { id: 'web', label: '🌐 Search' },
                              { id: 'reasoning', label: '🧠 Reasoning' },
                              { id: 'image-generation', label: '🎨 Image Gen' },
                              { id: 'audio-processing', label: '🎵 Audio' }
                            ].map((filter) => (
                              <motion.div
                                key={filter.id}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  setActiveFilters(prev =>
                                    prev.includes(filter.id)
                                      ? prev.filter(f => f !== filter.id)
                                      : [...prev.filter(f => !f.startsWith('category:')), filter.id]
                                  );
                                }}
                              >
                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                                  activeFilters.includes(filter.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-border'
                                }`}>
                                  {activeFilters.includes(filter.id) && (
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{filter.label}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}