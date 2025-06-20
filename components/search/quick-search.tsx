"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  MessageSquare, 
  Calendar, 
  User, 
  ArrowRight,
  Loader2,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";

interface QuickSearchResult {
  id: string;
  type: 'conversation' | 'message';
  title: string;
  content: string;
  snippet?: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  author: string;
}

interface QuickSearchProps {
  onResultSelect: (messageId: string, sessionId: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuickSearch({ 
  onResultSelect, 
  placeholder = "Search conversations...",
  className = ""
}: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Perform search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/chat/search', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Transform the data to match our interface
          const transformedResults: QuickSearchResult[] = data.messages?.map((msg: any) => ({
            id: msg.id,
            type: 'message' as const,
            title: `Message in "${msg.session?.title || 'Untitled'}"`,
            content: msg.content,
            snippet: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            sessionId: msg.sessionId,
            sessionTitle: msg.session?.title || 'Untitled',
            date: msg.createdAt,
            author: msg.role === 'user' ? 'You' : 'AI',
          })) || [];
          
          setResults(transformedResults.slice(0, 8)); // Limit to 8 results
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Quick search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedQuery) {
      performSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const result = results[selectedIndex];
          onResultSelect(result.id, result.sessionId);
          handleClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Handle result selection
  const handleResultClick = (result: QuickSearchResult) => {
    onResultSelect(result.id, result.sessionId);
    handleClose();
  };

  // Close search
  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Open search
  const handleOpen = () => {
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && (query || loading) && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="shadow-lg border border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : results.length === 0 && query ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-3 cursor-pointer transition-colors border-b border-border last:border-b-0 ${
                          index === selectedIndex 
                            ? 'bg-primary/10' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {result.sessionTitle}
                              </h4>
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 ml-2" />
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {highlightText(result.snippet || result.content, query)}
                            </p>
                            
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{result.author}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(result.date).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="p-2 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground text-center">
                      Use ↑↓ to navigate, Enter to select, Esc to close
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
