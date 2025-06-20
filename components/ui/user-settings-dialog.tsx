"use client";

import * as React from "react";
import { Settings, Check, Loader2, User, Palette, Brain, Globe, Shield, Bell, Download, Upload, Trash2, Edit3, Camera, Sun, Moon, Monitor, Zap, Eye, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface UserSettingsDialogProps {
  availableModels?: string[];
}

export function UserSettingsDialog({ availableModels = [] }: UserSettingsDialogProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { preferences, updateDefaultModel, updatePreferences, isLoading } = useUserPreferences();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("profile");

  // Profile settings state
  const [displayName, setDisplayName] = React.useState(session?.user?.name || "");
  const [bio, setBio] = React.useState("");

  // Visual settings state
  const [selectedTheme, setSelectedTheme] = React.useState(theme || "system");
  const [enableAnimations, setEnableAnimations] = React.useState(true);
  const [enableSounds, setEnableSounds] = React.useState(false);
  const [compactMode, setCompactMode] = React.useState(false);

  // AI settings state
  const [enableStreaming, setEnableStreaming] = React.useState(true);
  const [maxTokens, setMaxTokens] = React.useState("2048");
  const [temperature, setTemperature] = React.useState("0.7");

  // Update local state when preferences load
  React.useEffect(() => {
    if (preferences?.defaultModel) {
      setSelectedModel(preferences.defaultModel);
    }
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [preferences?.defaultModel, session?.user?.name]);

  const handleSaveModel = async () => {
    if (!selectedModel || selectedModel === preferences?.defaultModel) return;

    setIsSaving(true);
    try {
      await updateDefaultModel(selectedModel);
    } catch (error) {
      console.error('Failed to save default model:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Here you would typically update the user profile via an API
      console.log('Saving profile:', { displayName, bio });
      // await updateUserProfile({ name: displayName, bio });
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVisualSettings = async () => {
    setIsSaving(true);
    try {
      setTheme(selectedTheme);
      await updatePreferences({
        theme: selectedTheme,
        // Add other visual preferences to the schema later
      });
    } catch (error) {
      console.error('Failed to save visual settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAISettings = async () => {
    setIsSaving(true);
    try {
      await updateDefaultModel(selectedModel);
      // Save other AI settings when schema is extended
      console.log('Saving AI settings:', { enableStreaming, maxTokens, temperature });
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get a list of common models to display
  const commonModels = [
    'openai/gpt-4o-mini',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'claude-3-sonnet',
    'gpt-4-turbo',
    ...availableModels.slice(0, 10) // Add first 10 from available models
  ];

  // Remove duplicates
  const uniqueModels = Array.from(new Set(commonModels));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50 transition-colors"
          title="User Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <DialogDescription>
            Customize your T3 Chat experience
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="text-lg">
                          {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Button variant="outline" size="sm" className="mb-2">
                          <Camera className="h-4 w-4 mr-2" />
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Upload a new profile picture
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display Name</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={session?.user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Profile'
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Visual Options Tab */}
                <TabsContent value="visual" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor }
                        ].map((themeOption) => (
                          <motion.div
                            key={themeOption.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedTheme === themeOption.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedTheme(themeOption.value)}
                          >
                            <themeOption.icon className="h-6 w-6 mb-2" />
                            <span className="text-sm font-medium">{themeOption.label}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Visual Preferences */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Visual Preferences</h4>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Enable Animations</Label>
                          <p className="text-xs text-muted-foreground">
                            Smooth transitions and motion effects
                          </p>
                        </div>
                        <Switch
                          checked={enableAnimations}
                          onCheckedChange={setEnableAnimations}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Sound Effects</Label>
                          <p className="text-xs text-muted-foreground">
                            Audio feedback for interactions
                          </p>
                        </div>
                        <Switch
                          checked={enableSounds}
                          onCheckedChange={setEnableSounds}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Compact Mode</Label>
                          <p className="text-xs text-muted-foreground">
                            Reduce spacing and padding
                          </p>
                        </div>
                        <Switch
                          checked={compactMode}
                          onCheckedChange={setCompactMode}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveVisualSettings} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Visual Settings'
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* AI Settings Tab */}
                <TabsContent value="ai" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    {/* Default Model Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Default AI Model</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading models...</span>
                          </div>
                        ) : (
                          uniqueModels.map((model) => (
                            <motion.div
                              key={model}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedModel === model
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedModel(model)}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedModel === model
                                  ? 'border-primary bg-primary'
                                  : 'border-border'
                              }`}>
                                {selectedModel === model && (
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{model}</p>
                                <p className="text-xs text-muted-foreground">
                                  {model.includes('gpt') ? 'OpenAI' :
                                   model.includes('gemini') ? 'Google' :
                                   model.includes('claude') ? 'Anthropic' :
                                   'Available Model'}
                                </p>
                              </div>
                              {preferences?.defaultModel === model && (
                                <div className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                  Current
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* AI Behavior Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">AI Behavior</h4>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Enable Streaming</Label>
                          <p className="text-xs text-muted-foreground">
                            Show responses as they're generated
                          </p>
                        </div>
                        <Switch
                          checked={enableStreaming}
                          onCheckedChange={setEnableStreaming}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-tokens" className="text-sm">Max Tokens</Label>
                        <Input
                          id="max-tokens"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(e.target.value)}
                          placeholder="2048"
                          type="number"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum length of AI responses
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                        <Input
                          id="temperature"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="0.7"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Controls randomness (0 = focused, 2 = creative)
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleSaveAISettings} disabled={isSaving} className="w-full">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save AI Settings'
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* Advanced Settings Tab */}
                <TabsContent value="advanced" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    {/* Data & Privacy */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Data & Privacy
                      </h4>

                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Export Chat Data
                        </Button>

                        <Button variant="outline" className="w-full justify-start">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Chat Data
                        </Button>

                        <Button variant="destructive" className="w-full justify-start">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All Chat History
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </h4>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Desktop Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when AI responds
                          </p>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm">Email Updates</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive product updates via email
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>

                    <Separator />

                    {/* Language & Region */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Language & Region
                      </h4>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          className="w-full p-2 border border-border rounded-lg bg-background"
                          defaultValue="en"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                          <option value="zh">中文</option>
                          <option value="ja">日本語</option>
                        </select>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      Save Advanced Settings
                    </Button>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
