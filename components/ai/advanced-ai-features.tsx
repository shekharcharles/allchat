"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, 
  Image, 
  Brain, 
  Zap, 
  FileText, 
  Mic, 
  Video, 
  Palette, 
  Calculator,
  Globe,
  Search,
  BookOpen,
  Lightbulb,
  Sparkles,
  Settings,
  Play,
  Download,
  Copy,
  Check,
  X,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdvancedAIFeaturesProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: string, config: FeatureConfig) => void;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'code' | 'image' | 'text' | 'analysis' | 'creative';
  capabilities: string[];
  models: string[];
  premium?: boolean;
}

interface FeatureConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  feature?: AIFeature;
}

const AI_FEATURES: AIFeature[] = [
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Generate, review, and optimize code in multiple programming languages',
    icon: Code,
    category: 'code',
    capabilities: ['Generate code', 'Code review', 'Bug fixing', 'Optimization', 'Documentation'],
    models: ['gpt-4', 'claude-3-sonnet', 'codellama'],
  },
  {
    id: 'image-analysis',
    name: 'Image Analysis',
    description: 'Analyze, describe, and extract information from images',
    icon: Image,
    category: 'image',
    capabilities: ['Image description', 'OCR', 'Object detection', 'Scene analysis'],
    models: ['gpt-4-vision', 'claude-3-sonnet'],
    premium: true,
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Analyze datasets, create visualizations, and generate insights',
    icon: Calculator,
    category: 'analysis',
    capabilities: ['Statistical analysis', 'Data visualization', 'Pattern recognition', 'Predictions'],
    models: ['gpt-4', 'claude-3-sonnet'],
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Generate creative content, stories, and marketing copy',
    icon: Palette,
    category: 'creative',
    capabilities: ['Story writing', 'Poetry', 'Marketing copy', 'Screenplays'],
    models: ['gpt-4', 'claude-3-sonnet'],
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Conduct research, summarize papers, and fact-check information',
    icon: BookOpen,
    category: 'text',
    capabilities: ['Web research', 'Paper summarization', 'Fact checking', 'Citation generation'],
    models: ['gpt-4', 'claude-3-sonnet'],
    premium: true,
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Break down complex problems and provide step-by-step solutions',
    icon: Lightbulb,
    category: 'analysis',
    capabilities: ['Problem decomposition', 'Solution planning', 'Decision trees', 'Risk analysis'],
    models: ['gpt-4', 'claude-3-sonnet'],
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Features', icon: Sparkles },
  { value: 'code', label: 'Code & Development', icon: Code },
  { value: 'image', label: 'Image & Vision', icon: Image },
  { value: 'text', label: 'Text & Language', icon: FileText },
  { value: 'analysis', label: 'Data & Analysis', icon: Calculator },
  { value: 'creative', label: 'Creative & Content', icon: Palette },
];

export function AdvancedAIFeatures({ isOpen, onClose, onFeatureSelect }: AdvancedAIFeaturesProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig>({
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
  });
  const [loading, setLoading] = useState(false);

  // Filter features by category
  const filteredFeatures = AI_FEATURES.filter(feature => 
    selectedCategory === 'all' || feature.category === selectedCategory
  );

  const handleFeatureClick = (feature: AIFeature) => {
    setSelectedFeature(feature);
    setFeatureConfig({
      model: feature.models[0],
      temperature: 0.7,
      maxTokens: 2048,
    });
  };

  const handleUseFeature = () => {
    if (!selectedFeature) return;

    setLoading(true);
    try {
      onFeatureSelect(selectedFeature.id, {
        ...featureConfig,
        feature: selectedFeature,
      });
      
      toast({
        title: "Feature Activated",
        description: `${selectedFeature.name} is now active in your conversation`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate feature",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    return categoryData?.icon || Sparkles;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      code: 'text-green-600 bg-green-50 border-green-200',
      image: 'text-purple-600 bg-purple-50 border-purple-200',
      text: 'text-blue-600 bg-blue-50 border-blue-200',
      analysis: 'text-orange-600 bg-orange-50 border-orange-200',
      creative: 'text-pink-600 bg-pink-50 border-pink-200',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Advanced AI Features</span>
          </DialogTitle>
          <DialogDescription>
            Unlock specialized AI capabilities for your conversations
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Feature List */}
          <div className="w-1/2 border-r border-border pr-4">
            {/* Category Filter */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="flex items-center space-x-1"
                    >
                      <IconComponent className="h-3 w-3" />
                      <span className="hidden sm:inline">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {filteredFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  const isSelected = selectedFeature?.id === feature.id;
                  
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getCategoryColor(feature.category)}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-sm">{feature.name}</h3>
                                {feature.premium && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Pro
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {feature.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {feature.capabilities.slice(0, 2).map(capability => (
                                  <Badge key={capability} variant="outline" className="text-xs">
                                    {capability}
                                  </Badge>
                                ))}
                                {feature.capabilities.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{feature.capabilities.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Feature Details */}
          <div className="w-1/2 pl-4">
            {selectedFeature ? (
              <div className="space-y-4">
                {/* Feature Header */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${getCategoryColor(selectedFeature.category)}`}>
                      <selectedFeature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedFeature.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedFeature.description}</p>
                    </div>
                  </div>

                  {selectedFeature.premium && (
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Premium Feature</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        This feature requires a Pro subscription for unlimited usage
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Capabilities */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Capabilities</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedFeature.capabilities.map(capability => (
                      <div key={capability} className="flex items-center space-x-2 text-sm">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Configuration */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Configuration</Label>
                  
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-xs">AI Model</Label>
                    <Select 
                      value={featureConfig.model} 
                      onValueChange={(value) => setFeatureConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFeature.models.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-xs">
                      Creativity Level: {featureConfig.temperature}
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={featureConfig.temperature}
                      onChange={(e) => setFeatureConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Focused</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens" className="text-xs">Max Response Length</Label>
                    <Select 
                      value={featureConfig.maxTokens.toString()} 
                      onValueChange={(value) => setFeatureConfig(prev => ({ ...prev, maxTokens: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024">Short (1K tokens)</SelectItem>
                        <SelectItem value="2048">Medium (2K tokens)</SelectItem>
                        <SelectItem value="4096">Long (4K tokens)</SelectItem>
                        <SelectItem value="8192">Very Long (8K tokens)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleUseFeature}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Use Feature
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFeature(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select an AI Feature</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a feature from the list to see details and configuration options
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
