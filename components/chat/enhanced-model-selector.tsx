"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Star, 
  StarOff, 
  Filter, 
  Grid3X3, 
  List, 
  Sparkles, 
  Zap, 
  Eye, 
  Brain, 
  Code, 
  Image, 
  Globe, 
  ChevronDown,
  Check,
  Crown,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useModels, ModelData } from '@/hooks/use-models';

interface EnhancedModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

// Remove static models - we'll use real API data

const FEATURE_ICONS = {
  fast: Zap,
  web: Globe,
  vision: Eye,
  reasoning: Brain,
  code: Code,
  image: Image,
  pdf: Brain,
  creative: Sparkles,
  local: Brain
};

const CATEGORY_COLORS = {
  text: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  vision: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  code: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
  reasoning: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800',
  'image-gen': 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800',
  streaming: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  fast: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800',
  web: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800',
  analysis: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800'
};

export function EnhancedModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
  className = ""
}: EnhancedModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch real models from API
  const { models, isLoading, error } = useModels();

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('model-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (modelId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(modelId)) {
      newFavorites.delete(modelId);
    } else {
      newFavorites.add(modelId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('model-favorites', JSON.stringify([...newFavorites]));
  };

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    if (!models || models.length === 0) return [];

    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (model.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFavorites = !showFavoritesOnly || favorites.has(model.id);
      const matchesAvailable = !showAvailableOnly || model.available;

      // Improved category matching logic
      const matchesCategory = selectedCategory === 'all' || (() => {
        const capabilities = model.capabilities || [];
        const features = model.features || [];
        const category = model.category || '';

        switch (selectedCategory) {
          case 'text':
            return category === 'text' ||
                   capabilities.includes('text') ||
                   features.includes('text') ||
                   capabilities.includes('reasoning') ||
                   features.includes('reasoning');
          case 'vision':
            return capabilities.includes('vision') ||
                   features.includes('vision') ||
                   capabilities.includes('multimodal') ||
                   features.includes('multimodal');
          case 'code':
            return capabilities.includes('code') ||
                   features.includes('code') ||
                   capabilities.includes('coding') ||
                   features.includes('coding');
          case 'reasoning':
            return capabilities.includes('reasoning') ||
                   features.includes('reasoning') ||
                   capabilities.includes('analysis') ||
                   features.includes('analysis');
          case 'image-gen':
            return category === 'image' ||
                   capabilities.includes('image-generation') ||
                   features.includes('image-generation');
          default:
            return capabilities.includes(selectedCategory) ||
                   features.includes(selectedCategory) ||
                   category === selectedCategory;
        }
      })();

      return matchesSearch && matchesFavorites && matchesAvailable && matchesCategory;
    });
  }, [models, searchQuery, showFavoritesOnly, showAvailableOnly, selectedCategory, favorites]);

  // Group models by favorites and others
  const favoriteModels = filteredModels.filter(model => favorites.has(model.id));
  const otherModels = filteredModels.filter(model => !favorites.has(model.id));

  const currentModel = models?.find(m => m.id === selectedModel);

  const handleModelSelect = (modelId: string) => {
    const model = models?.find(m => m.id === modelId);
    if (model && model.available) {
      onModelChange(modelId);
      setIsOpen(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-[280px] justify-between text-sm rounded-2xl h-12 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm"
              disabled={disabled}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading models...</span>
                </div>
              ) : error ? (
                <div className="flex items-center space-x-3">
                  <span className="text-red-500">Error loading models</span>
                </div>
              ) : currentModel ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{currentModel.name}</span>
                      {currentModel.badge && (
                        <Badge
                          variant="outline"
                          className={`text-xs px-2 py-0.5 ${
                            currentModel.badge.type === 'new' ? 'bg-green-50 text-green-700 border-green-200' :
                            currentModel.badge.type === 'pro' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            currentModel.badge.type === 'free' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {currentModel.badge.text}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{currentModel.provider}</span>
                  </div>
                </div>
              ) : (
                <span>Select a model...</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          {/* Header with search and filters */}
          <div className="p-4 border-b border-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Select AI Model</h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="h-8 w-8 p-0"
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorites-only"
                    checked={showFavoritesOnly}
                    onCheckedChange={setShowFavoritesOnly}
                  />
                  <Label htmlFor="favorites-only" className="text-sm">
                    Favorites only
                    {showFavoritesOnly && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {favoriteModels.length}
                      </Badge>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available-only"
                    checked={showAvailableOnly}
                    onCheckedChange={setShowAvailableOnly}
                  />
                  <Label htmlFor="available-only" className="text-sm">
                    Available only
                    {showAvailableOnly && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {models.filter(m => m.available).length}
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedCategory === 'all' ? 'Category' :
                     selectedCategory === 'text' ? 'Text' :
                     selectedCategory === 'vision' ? 'Vision' :
                     selectedCategory === 'code' ? 'Code' :
                     selectedCategory === 'reasoning' ? 'Reasoning' :
                     selectedCategory === 'image-gen' ? 'Image Gen' :
                     'Category'}
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {filteredModels.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('text')}
                    className={selectedCategory === 'text' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'text' ? 'opacity-100' : 'opacity-0'}`} />
                    Text Generation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('vision')}
                    className={selectedCategory === 'vision' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'vision' ? 'opacity-100' : 'opacity-0'}`} />
                    Vision & Multimodal
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('code')}
                    className={selectedCategory === 'code' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'code' ? 'opacity-100' : 'opacity-0'}`} />
                    Code Generation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('reasoning')}
                    className={selectedCategory === 'reasoning' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'reasoning' ? 'opacity-100' : 'opacity-0'}`} />
                    Reasoning & Analysis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory('image-gen')}
                    className={selectedCategory === 'image-gen' ? 'bg-primary/10' : ''}
                  >
                    <Check className={`h-4 w-4 mr-2 ${selectedCategory === 'image-gen' ? 'opacity-100' : 'opacity-0'}`} />
                    Image Generation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear filters button */}
              {(searchQuery || showFavoritesOnly || !showAvailableOnly || selectedCategory !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setShowFavoritesOnly(false);
                    setShowAvailableOnly(true);
                    setSelectedCategory('all');
                  }}
                  className="h-8 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {!isLoading && !error && (
            <div className="px-4 py-2 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
                {filteredModels.length > 0 && (
                  <span>
                    {filteredModels.filter(m => m.available).length} available
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Models List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Loading models...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>Error loading models: {error}</p>
              </div>
            ) : favoriteModels.length > 0 && (
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h5 className="font-medium text-sm">Favorites</h5>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
                  {favoriteModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      isFavorite={favorites.has(model.id)}
                      onSelect={handleModelSelect}
                      onToggleFavorite={toggleFavorite}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {otherModels.length > 0 && (
              <div className="p-4">
                {favoriteModels.length > 0 && <Separator className="mb-4" />}
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h5 className="font-medium text-sm">All Models</h5>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
                  {otherModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      isFavorite={favorites.has(model.id)}
                      onSelect={handleModelSelect}
                      onToggleFavorite={toggleFavorite}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !error && filteredModels.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No models found matching your criteria</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface ModelCardProps {
  model: ModelData;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (modelId: string) => void;
  onToggleFavorite: (modelId: string) => void;
  viewMode: 'grid' | 'list';
}

function ModelCard({ model, isSelected, isFavorite, onSelect, onToggleFavorite, viewMode }: ModelCardProps) {
  const isDisabled = !model.available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-lg' 
          : isDisabled
          ? 'border-border/30 bg-muted/30 opacity-60'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      } ${viewMode === 'grid' ? 'min-h-[120px]' : ''}`}
      onClick={() => !isDisabled && onSelect(model.id)}
    >
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(model.id);
        }}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/80 transition-colors"
      >
        {isFavorite ? (
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
        ) : (
          <StarOff className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between pr-6">
          <div>
            <div className="flex items-center space-x-2">
              <h6 className="font-semibold text-sm">{model.name}</h6>
              {model.badge && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 ${
                    model.badge.type === 'new' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300' :
                    model.badge.type === 'pro' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300' :
                    model.badge.type === 'free' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300' :
                    model.badge.type === 'thinking' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300' :
                    'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-300'
                  }`}
                >
                  {model.badge.text}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
          {isSelected && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground">{model.description || 'No description available'}</p>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {(model.features || []).slice(0, 3).map((feature) => {
            const Icon = FEATURE_ICONS[feature as keyof typeof FEATURE_ICONS];
            return (
              <Badge
                key={feature}
                variant="secondary"
                className="text-xs px-2 py-0.5 flex items-center space-x-1"
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{feature}</span>
              </Badge>
            );
          })}
          {(model.features || []).length > 3 && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 cursor-help"
              title={`Additional features: ${(model.features || []).slice(3).join(', ')}`}
            >
              +{(model.features || []).length - 3} more
            </Badge>
          )}
        </div>

        {/* Capabilities */}
        {model.capabilities && model.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {model.capabilities.slice(0, 2).map((capability) => (
              <Badge
                key={capability}
                variant="outline"
                className={`text-xs w-fit ${CATEGORY_COLORS[capability as keyof typeof CATEGORY_COLORS] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                {capability}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isDisabled && (
        <div className="absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            Unavailable
          </Badge>
        </div>
      )}
    </motion.div>
  );
}
