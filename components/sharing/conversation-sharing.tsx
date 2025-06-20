"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, 
  Link, 
  Copy, 
  Eye, 
  EyeOff, 
  Users, 
  Globe, 
  Lock, 
  Mail, 
  MessageSquare,
  Calendar,
  Download,
  QrCode,
  Settings,
  Check,
  X,
  Plus,
  Trash2,
  Crown,
  UserPlus,
  Shield,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface ConversationSharingProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationTitle: string;
  isShared: boolean;
  shareId?: string;
  onShareUpdate: (isShared: boolean, shareId?: string) => void;
}

interface Collaborator {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastActive: string;
}

interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  requireAuth: boolean;
  expiresAt?: string;
  password?: string;
}

const PERMISSION_LEVELS = [
  { value: 'viewer', label: 'Viewer', description: 'Can view the conversation' },
  { value: 'editor', label: 'Editor', description: 'Can view and add messages' },
  { value: 'owner', label: 'Owner', description: 'Full control over the conversation' },
];

export function ConversationSharing({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  isShared,
  shareId,
  onShareUpdate
}: ConversationSharingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<'editor' | 'viewer'>('viewer');
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    allowComments: true,
    allowDownload: true,
    requireAuth: false,
  });
  const [copied, setCopied] = useState(false);

  // Generate share URL
  useEffect(() => {
    if (shareId) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/share/${shareId}`);
    }
  }, [shareId]);

  // Load collaborators and settings
  useEffect(() => {
    if (isOpen && conversationId) {
      loadCollaborators();
      loadShareSettings();
    }
  }, [isOpen, conversationId]);

  const loadCollaborators = async () => {
    try {
      const response = await fetch(`/api/chat/collaborators/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const loadShareSettings = async () => {
    try {
      const response = await fetch(`/api/chat/share-settings/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setShareSettings(data.settings || shareSettings);
      }
    } catch (error) {
      console.error('Error loading share settings:', error);
    }
  };

  const handleToggleSharing = async () => {
    setLoading(true);
    try {
      if (isShared) {
        // Unshare conversation
        const response = await fetch(`/api/chat/share/${conversationId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onShareUpdate(false);
          toast({
            title: "Success",
            description: "Conversation is no longer shared",
          });
        } else {
          throw new Error('Failed to unshare conversation');
        }
      } else {
        // Share conversation
        const response = await fetch(`/api/chat/share/${conversationId}`, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          onShareUpdate(true, data.shareId);
          toast({
            title: "Success",
            description: "Conversation shared successfully",
          });
        } else {
          throw new Error('Failed to share conversation');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sharing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chat/collaborators/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newCollaboratorEmail,
          role: newCollaboratorRole,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCollaborators(prev => [...prev, data.collaborator]);
        setNewCollaboratorEmail("");
        toast({
          title: "Success",
          description: `Invited ${newCollaboratorEmail} as ${newCollaboratorRole}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add collaborator');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add collaborator",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/collaborators/${conversationId}/${collaboratorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
        toast({
          title: "Success",
          description: "Collaborator removed",
        });
      } else {
        throw new Error('Failed to remove collaborator');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove collaborator",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShareSettings = async (newSettings: Partial<ShareSettings>) => {
    const updatedSettings = { ...shareSettings, ...newSettings };
    setShareSettings(updatedSettings);

    try {
      const response = await fetch(`/api/chat/share-settings/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to update share settings');
      }

      toast({
        title: "Success",
        description: "Share settings updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown;
      case 'editor': return Users;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'editor': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'viewer': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Conversation</span>
          </DialogTitle>
          <DialogDescription>
            Share "{conversationTitle}" with others or make it public
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sharing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sharing">Sharing</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="space-y-4">
            <div className="space-y-4">
              {/* Share Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {isShared ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {isShared ? 'Conversation is shared' : 'Share this conversation'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isShared 
                        ? 'Anyone with the link can view this conversation'
                        : 'Make this conversation accessible to others'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isShared}
                  onCheckedChange={handleToggleSharing}
                  disabled={loading}
                />
              </div>

              {/* Share Link */}
              {isShared && shareUrl && (
                <div className="space-y-3">
                  <Label>Share Link</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center space-x-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <QrCode className="h-4 w-4" />
                      <span>QR Code</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Share Stats */}
              {isShared && (
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{collaborators.length}</div>
                      <div className="text-xs text-muted-foreground">Collaborators</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Collaborators Tab */}
          <TabsContent value="collaborators" className="space-y-4">
            <div className="space-y-4">
              {/* Add Collaborator */}
              <div className="space-y-3">
                <Label>Invite Collaborators</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={newCollaboratorRole} onValueChange={(value: 'editor' | 'viewer') => setNewCollaboratorRole(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddCollaborator}
                    disabled={!newCollaboratorEmail.trim() || loading}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Invite</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Collaborators List */}
              <div className="space-y-3">
                <Label>Current Collaborators</Label>
                {collaborators.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No collaborators yet</p>
                    <p className="text-sm">Invite people to collaborate on this conversation</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => {
                      const RoleIcon = getRoleIcon(collaborator.role);
                      return (
                        <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={collaborator.avatar} />
                              <AvatarFallback>
                                {collaborator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{collaborator.name}</div>
                              <div className="text-xs text-muted-foreground">{collaborator.email}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`text-xs ${getRoleColor(collaborator.role)}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {collaborator.role}
                            </Badge>
                            
                            {collaborator.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCollaborator(collaborator.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-6">
              {/* Public Access */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Public Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone to discover this conversation
                  </p>
                </div>
                <Switch
                  checked={shareSettings.isPublic}
                  onCheckedChange={(checked) => handleUpdateShareSettings({ isPublic: checked })}
                />
              </div>

              {/* Allow Comments */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Comments</Label>
                  <p className="text-xs text-muted-foreground">
                    Let viewers add comments to the conversation
                  </p>
                </div>
                <Switch
                  checked={shareSettings.allowComments}
                  onCheckedChange={(checked) => handleUpdateShareSettings({ allowComments: checked })}
                />
              </div>

              {/* Allow Download */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Download</Label>
                  <p className="text-xs text-muted-foreground">
                    Let viewers download the conversation
                  </p>
                </div>
                <Switch
                  checked={shareSettings.allowDownload}
                  onCheckedChange={(checked) => handleUpdateShareSettings({ allowDownload: checked })}
                />
              </div>

              {/* Require Authentication */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Require Authentication</Label>
                  <p className="text-xs text-muted-foreground">
                    Only signed-in users can view this conversation
                  </p>
                </div>
                <Switch
                  checked={shareSettings.requireAuth}
                  onCheckedChange={(checked) => handleUpdateShareSettings({ requireAuth: checked })}
                />
              </div>

              <Separator />

              {/* Advanced Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Advanced Settings</Label>
                
                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expires" className="text-xs">Expiration Date (Optional)</Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={shareSettings.expiresAt || ''}
                    onChange={(e) => handleUpdateShareSettings({ expiresAt: e.target.value || undefined })}
                  />
                </div>

                {/* Password Protection */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={shareSettings.password || ''}
                    onChange={(e) => handleUpdateShareSettings({ password: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
