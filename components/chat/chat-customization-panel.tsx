"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Type, 
  MessageSquare, 
  Zap, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  RotateCcw,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useTheme } from "next-themes";

interface ChatCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_SIZES = [
  { value: 'small', label: 'Small', size: 'text-sm' },
  { value: 'medium', label: 'Medium', size: 'text-base' },
  { value: 'large', label: 'Large', size: 'text-lg' }
];

const CHAT_BUBBLE_STYLES = [
  { 
    value: 'modern', 
    label: 'Modern', 
    description: 'Rounded corners with glassmorphism',
    preview: 'rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20'
  },
  { 
    value: 'classic', 
    label: 'Classic', 
    description: 'Traditional chat bubbles',
    preview: 'rounded-lg bg-muted border border-border'
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Clean and simple design',
    preview: 'rounded-md bg-background border-l-4 border-l-primary'
  }
];

export function ChatCustomizationPanel({ isOpen, onClose }: ChatCustomizationPanelProps) {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Local state for customization options
  const [localPreferences, setLocalPreferences] = useState({
    enableAnimations: true,
    enableSounds: false,
    compactMode: false,
    fontSize: 'medium',
    chatBubbleStyle: 'modern',
    enableStreaming: true,
    maxTokens: 2048,
    temperature: 0.7,
  });

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        enableAnimations: preferences.enableAnimations ?? true,
        enableSounds: preferences.enableSounds ?? false,
        compactMode: preferences.compactMode ?? false,
        fontSize: preferences.fontSize || 'medium',
        chatBubbleStyle: preferences.chatBubbleStyle || 'modern',
        enableStreaming: preferences.enableStreaming ?? true,
        maxTokens: preferences.maxTokens || 2048,
        temperature: preferences.temperature || 0.7,
      });
    }
  }, [preferences]);

  // Check for changes
  useEffect(() => {
    if (preferences) {
      const hasChanged = 
        localPreferences.enableAnimations !== (preferences.enableAnimations ?? true) ||
        localPreferences.enableSounds !== (preferences.enableSounds ?? false) ||
        localPreferences.compactMode !== (preferences.compactMode ?? false) ||
        localPreferences.fontSize !== (preferences.fontSize || 'medium') ||
        localPreferences.chatBubbleStyle !== (preferences.chatBubbleStyle || 'modern') ||
        localPreferences.enableStreaming !== (preferences.enableStreaming ?? true) ||
        localPreferences.maxTokens !== (preferences.maxTokens || 2048) ||
        localPreferences.temperature !== (preferences.temperature || 0.7);
      
      setHasChanges(hasChanged);
    }
  }, [localPreferences, preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences({
        enableAnimations: preferences.enableAnimations ?? true,
        enableSounds: preferences.enableSounds ?? false,
        compactMode: preferences.compactMode ?? false,
        fontSize: preferences.fontSize || 'medium',
        chatBubbleStyle: preferences.chatBubbleStyle || 'modern',
        enableStreaming: preferences.enableStreaming ?? true,
        maxTokens: preferences.maxTokens || 2048,
        temperature: preferences.temperature || 0.7,
      });
    }
  };

  const updateLocalPreference = (key: string, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Chat Customization</h2>
                  <p className="text-sm text-muted-foreground">Personalize your chat experience</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Visual Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Visual Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Animations */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable Animations</Label>
                      <p className="text-xs text-muted-foreground">
                        Smooth transitions and motion effects
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.enableAnimations}
                      onCheckedChange={(checked) => updateLocalPreference('enableAnimations', checked)}
                    />
                  </div>

                  {/* Sounds */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Sound Effects</Label>
                      <p className="text-xs text-muted-foreground">
                        Audio feedback for interactions
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.enableSounds}
                      onCheckedChange={(checked) => updateLocalPreference('enableSounds', checked)}
                    />
                  </div>

                  {/* Compact Mode */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Reduce spacing and padding
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.compactMode}
                      onCheckedChange={(checked) => updateLocalPreference('compactMode', checked)}
                    />
                  </div>

                  <Separator />

                  {/* Font Size */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Font Size</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {FONT_SIZES.map((size) => (
                        <motion.button
                          key={size.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            localPreferences.fontSize === size.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => updateLocalPreference('fontSize', size.value)}
                        >
                          <div className={`${size.size} font-medium`}>Aa</div>
                          <div className="text-xs text-muted-foreground mt-1">{size.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Bubble Style */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Chat Bubble Style</Label>
                    <div className="space-y-2">
                      {CHAT_BUBBLE_STYLES.map((style) => (
                        <motion.button
                          key={style.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            localPreferences.chatBubbleStyle === style.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => updateLocalPreference('chatBubbleStyle', style.value)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{style.label}</div>
                              <div className="text-xs text-muted-foreground">{style.description}</div>
                            </div>
                            <div className={`w-8 h-6 ${style.preview}`} />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>AI Behavior</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Streaming */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable Streaming</Label>
                      <p className="text-xs text-muted-foreground">
                        Show responses as they're generated
                      </p>
                    </div>
                    <Switch
                      checked={localPreferences.enableStreaming}
                      onCheckedChange={(checked) => updateLocalPreference('enableStreaming', checked)}
                    />
                  </div>

                  <Separator />

                  {/* Max Tokens */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <Badge variant="outline" className="text-xs">
                        {localPreferences.maxTokens.toLocaleString()}
                      </Badge>
                    </div>
                    <Slider
                      value={[localPreferences.maxTokens]}
                      onValueChange={([value]) => updateLocalPreference('maxTokens', value)}
                      max={8000}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum length of AI responses
                    </p>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Temperature</Label>
                      <Badge variant="outline" className="text-xs">
                        {localPreferences.temperature.toFixed(1)}
                      </Badge>
                    </div>
                    <Slider
                      value={[localPreferences.temperature]}
                      onValueChange={([value]) => updateLocalPreference('temperature', value)}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness (0 = focused, 2 = creative)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
