"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  GitBranch,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  Upload,
  Tag,
  Folder,
  FileText,
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Link,
  Check,
  X,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConversationData {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  isTemplate: boolean;
  isShared: boolean;
  shareId?: string;
  parentId?: string;
  branchPoint?: string;
  isArchived: boolean;
  isFavorite: boolean;
  category: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationManagerProps {
  currentSessionId: string | null;
  conversations: ConversationData[];
  onConversationSelect: (id: string) => void;
  onConversationUpdate: (id: string, updates: Partial<ConversationData>) => void;
  onConversationDelete: (id: string) => void;
  onConversationBranch: (id: string, messageId: string) => void;
  onConversationShare: (id: string) => void;
  onTemplateCreate: (id: string) => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700' },
  { value: 'work', label: 'Work', color: 'bg-blue-100 text-blue-700' },
  { value: 'creative', label: 'Creative', color: 'bg-purple-100 text-purple-700' },
  { value: 'learning', label: 'Learning', color: 'bg-green-100 text-green-700' },
  { value: 'coding', label: 'Coding', color: 'bg-orange-100 text-orange-700' },
  { value: 'research', label: 'Research', color: 'bg-pink-100 text-pink-700' },
];

export function ConversationManager({
  currentSessionId,
  conversations,
  onConversationSelect,
  onConversationUpdate,
  onConversationDelete,
  onConversationBranch,
  onConversationShare,
  onTemplateCreate
}: ConversationManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'messages'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  // Filter and sort conversations
  const filteredConversations = React.useMemo(() => {
    return conversations
      .filter(conv => {
        const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             conv.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             conv.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || conv.category === selectedCategory;
        const matchesArchived = showArchived ? conv.isArchived : !conv.isArchived;
        const matchesTemplate = showTemplates ? conv.isTemplate : !conv.isTemplate;

        return matchesSearch && matchesCategory && matchesArchived && matchesTemplate;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'messages':
            comparison = a.messageCount - b.messageCount;
            break;
          case 'date':
          default:
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [conversations, searchQuery, selectedCategory, showArchived, showTemplates, sortBy, sortOrder]);

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    onConversationUpdate(id, { isFavorite: !isFavorite });
  };

  const handleToggleArchive = (id: string, isArchived: boolean) => {
    onConversationUpdate(id, { isArchived: !isArchived });
  };

  const handleAddTag = (id: string, currentTags: string[]) => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      onConversationUpdate(id, { tags: [...currentTags, newTag.trim()] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (id: string, tagToRemove: string, currentTags: string[]) => {
    onConversationUpdate(id, { tags: currentTags.filter(tag => tag !== tagToRemove) });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="text-sm">Archived</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-templates"
                checked={showTemplates}
                onCheckedChange={setShowTemplates}
              />
              <Label htmlFor="show-templates" className="text-sm">Templates</Label>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date {sortBy === 'date' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>
                Title {sortBy === 'title' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('messages')}>
                Messages {sortBy === 'messages' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                currentSessionId === conversation.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                    {conversation.isTemplate && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Template
                      </Badge>
                    )}
                    {conversation.isShared && (
                      <Badge variant="outline" className="text-xs">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    {conversation.parentId && (
                      <Badge variant="outline" className="text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        Branch
                      </Badge>
                    )}
                  </div>

                  {conversation.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {conversation.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${CATEGORIES.find(c => c.value === conversation.category)?.color || 'bg-gray-100 text-gray-700'}`}
                    >
                      {CATEGORIES.find(c => c.value === conversation.category)?.label || conversation.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {conversation.messageCount} messages
                    </span>
                  </div>

                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {conversation.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {conversation.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{conversation.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(conversation.id, conversation.isFavorite);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {conversation.isFavorite ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingConversation(conversation.id)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onConversationShare(conversation.id)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTemplateCreate(conversation.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Save as Template
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleArchive(conversation.id, conversation.isArchived)}>
                        {conversation.isArchived ? (
                          <>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Unarchive
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onConversationDelete(conversation.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredConversations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        )}
      </div>

      {/* Edit Conversation Dialog */}
      <Dialog open={!!editingConversation} onOpenChange={() => setEditingConversation(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Conversation</DialogTitle>
            <DialogDescription>
              Update conversation details and organization
            </DialogDescription>
          </DialogHeader>
          {editingConversation && (
            <ConversationEditForm
              conversation={conversations.find(c => c.id === editingConversation)!}
              onSave={(updates) => {
                onConversationUpdate(editingConversation, updates);
                setEditingConversation(null);
              }}
              onCancel={() => setEditingConversation(null)}
              newTag={newTag}
              setNewTag={setNewTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ConversationEditFormProps {
  conversation: ConversationData;
  onSave: (updates: Partial<ConversationData>) => void;
  onCancel: () => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  onAddTag: (id: string, currentTags: string[]) => void;
  onRemoveTag: (id: string, tagToRemove: string, currentTags: string[]) => void;
}

function ConversationEditForm({
  conversation,
  onSave,
  onCancel,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag
}: ConversationEditFormProps) {
  const [title, setTitle] = useState(conversation.title);
  const [description, setDescription] = useState(conversation.description || "");
  const [category, setCategory] = useState(conversation.category);
  const [tags, setTags] = useState(conversation.tags);

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      category,
      tags
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Conversation title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newTags = tags.filter(t => t !== tag);
                  setTags(newTags);
                }}
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newTag.trim() && !tags.includes(newTag.trim())) {
                  setTags([...tags, newTag.trim()]);
                  setNewTag("");
                }
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (newTag.trim() && !tags.includes(newTag.trim())) {
                setTags([...tags, newTag.trim()]);
                setNewTag("");
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
