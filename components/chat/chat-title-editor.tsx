"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Loader2,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChatTitle } from "@/hooks/use-chat-title";

interface ChatTitleEditorProps {
  sessionId: string;
  currentTitle: string;
  onTitleUpdate: (newTitle: string) => void;
  className?: string;
}

export function ChatTitleEditor({ 
  sessionId, 
  currentTitle, 
  onTitleUpdate,
  className = ""
}: ChatTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentTitle);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateTitle, getSuggestions, generateTitle, isUpdating, isGenerating } = useChatTitle();

  // Update edit value when current title changes
  useEffect(() => {
    setEditValue(currentTitle);
  }, [currentTitle]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(currentTitle);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(currentTitle);
    setShowSuggestions(false);
  };

  const handleSaveEdit = async () => {
    if (editValue.trim() && editValue !== currentTitle) {
      const success = await updateTitle(sessionId, editValue.trim());
      if (success) {
        onTitleUpdate(editValue.trim());
        setIsEditing(false);
        setShowSuggestions(false);
      }
    } else {
      handleCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleGenerateTitle = async () => {
    const newTitle = await generateTitle(sessionId);
    if (newTitle) {
      setEditValue(newTitle);
      onTitleUpdate(newTitle);
    }
  };

  const handleShowSuggestions = async () => {
    if (suggestions.length === 0) {
      const newSuggestions = await getSuggestions(sessionId);
      setSuggestions(newSuggestions);
    }
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setEditValue(suggestion);
    setShowSuggestions(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm h-8"
            placeholder="Enter chat title..."
            disabled={isUpdating}
          />
          
          {/* Suggestions Popover */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-50 mt-1"
              >
                <div className="bg-popover border border-border rounded-md shadow-lg p-2 space-y-1">
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    Suggestions:
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full text-left px-2 py-1 text-sm rounded hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-1">
          {/* AI Generate Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateTitle}
            disabled={isGenerating || isUpdating}
            className="h-8 w-8 p-0"
            title="Generate with AI"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
          </Button>

          {/* Suggestions Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowSuggestions}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
            title="Show suggestions"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>

          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveEdit}
            disabled={isUpdating || !editValue.trim()}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            title="Save"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </Button>

          {/* Cancel Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isUpdating}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-center space-x-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">
          {currentTitle}
        </span>
        {currentTitle === 'New Chat' && (
          <Badge variant="outline" className="text-xs mt-1">
            <Sparkles className="h-2 w-2 mr-1" />
            Auto-title available
          </Badge>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartEdit}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit title"
      >
        <Edit3 className="h-3 w-3" />
      </Button>
    </div>
  );
}
