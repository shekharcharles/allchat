"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Star, 
  Zap, 
  Eye, 
  FileText, 
  Brain, 
  Palette, 
  Settings, 
  Globe, 
  Filter,
  ChevronDown,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Model data structure
interface ModelCapability {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface AIModel {
  id: string;
  name: string;
  subtitle: string;
  status?: "NEW" | "THINKING" | "FAST" | "PRO";
  capabilities: string[];
  isFavorite: boolean;
  isPro: boolean;
  isAvailable: boolean;
  provider: "gemini" | "openai" | "anthropic" | "other";
}

// Available capabilities
const CAPABILITIES: Record<string, ModelCapability> = {
  web: { id: "web", name: "Web Search", icon: <Globe className="h-3 w-3" />, color: "bg-blue-100 text-blue-700" },
  pdfs: { id: "pdfs", name: "PDFs", icon: <FileText className="h-3 w-3" />, color: "bg-red-100 text-red-700" },
  reasoning: { id: "reasoning", name: "Reasoning", icon: <Brain className="h-3 w-3" />, color: "bg-purple-100 text-purple-700" },
  image: { id: "image", name: "Image Generation", icon: <Palette className="h-3 w-3" />, color: "bg-pink-100 text-pink-700" },
  vision: { id: "vision", name: "Vision", icon: <Eye className="h-3 w-3" />, color: "bg-green-100 text-green-700" },
  fast: { id: "fast", name: "Fast", icon: <Zap className="h-3 w-3" />, color: "bg-yellow-100 text-yellow-700" },
  streaming: { id: "streaming", name: "Streaming", icon: <Zap className="h-3 w-3" />, color: "bg-emerald-100 text-emerald-700" },
  effort: { id: "effort", name: "Effort Control", icon: <Settings className="h-3 w-3" />, color: "bg-gray-100 text-gray-700" }
};

// Sample model data
const SAMPLE_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini",
    subtitle: "2.5 Flash",
    status: "FAST",
    capabilities: ["web", "vision", "fast"],
    isFavorite: true,
    isPro: false,
    isAvailable: true,
    provider: "gemini"
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini",
    subtitle: "2.5 Flash Lite",
    status: "NEW",
    capabilities: ["web", "vision", "fast"],
    isFavorite: true,
    isPro: false,
    isAvailable: true,
    provider: "gemini"
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4",
    subtitle: "Turbo",
    capabilities: ["web", "vision", "reasoning", "pdfs"],
    isFavorite: false,
    isPro: true,
    isAvailable: false,
    provider: "openai"
  },
  {
    id: "claude-3-sonnet",
    name: "Claude",
    subtitle: "3 Sonnet",
    status: "THINKING",
    capabilities: ["reasoning", "pdfs", "vision"],
    isFavorite: false,
    isPro: true,
    isAvailable: false,
    provider: "anthropic"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o",
    subtitle: "Mini",
    capabilities: ["fast", "web"],
    isFavorite: false,
    isPro: false,
    isAvailable: true,
    provider: "openai"
  },
  {
    id: "claude-3-haiku",
    name: "Claude",
    subtitle: "3 Haiku",
    capabilities: ["fast", "reasoning"],
    isFavorite: false,
    isPro: true,
    isAvailable: false,
    provider: "anthropic"
  }
];

interface AdvancedModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function AdvancedModelSelector({ selectedModel, onModelChange, disabled }: AdvancedModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [models] = useState<AIModel[]>(SAMPLE_MODELS);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter models based on search and active filters
  const filteredModels = React.useMemo(() => {
    let filtered = models.filter(model => {
      // Search filter
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           model.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Capability filters
      const matchesFilters = activeFilters.length === 0 || 
                            activeFilters.some(filter => model.capabilities.includes(filter));
      
      return matchesSearch && matchesFilters;
    });

    // Sort by favorites first, then by availability
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });
  }, [models, searchQuery, activeFilters]);

  const favoriteModels = filteredModels.filter(model => model.isFavorite);
  const otherModels = filteredModels.filter(model => !model.isFavorite);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "gemini":
        return <Sparkles className="h-4 w-4" />;
      case "openai":
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">G</span>
        </div>;
      case "anthropic":
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">C</span>
        </div>;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      NEW: { bg: "bg-green-100", text: "text-green-700", label: "NEW" },
      THINKING: { bg: "bg-purple-100", text: "text-purple-700", label: "THINKING" },
      FAST: { bg: "bg-yellow-100", text: "text-yellow-700", label: "FAST" },
      PRO: { bg: "bg-blue-100", text: "text-blue-700", label: "PRO" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-[240px] justify-between text-sm rounded-2xl h-11 border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm"
            disabled={disabled}
          >
            {selectedModel ? (
              <div className="flex items-center space-x-2">
                {getProviderIcon(models.find(m => m.id === selectedModel)?.provider || "other")}
                <span className="truncate font-medium">
                  {models.find(m => m.id === selectedModel)?.name} {models.find(m => m.id === selectedModel)?.subtitle}
                </span>
                {models.find(m => m.id === selectedModel)?.isFavorite && (
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Select a model...</span>
              </div>
            )}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Advanced model selector coming soon...</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
