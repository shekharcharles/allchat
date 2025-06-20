"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MessageSquare, 
  File, 
  User, 
  Calendar, 
  Tag, 
  Filter, 
  Clock, 
  Star,
  Sparkles,
  Brain,
  Code,
  Image,
  X,
  ArrowRight,
  Loader2,
  TrendingUp,
  History,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: 'conversation' | 'message' | 'file' | 'template';
  title: string;
  content: string;
  snippet?: string;
  metadata: {
    date: string;
    author?: string;
    tags?: string[];
    category?: string;
    model?: string;
    fileType?: string;
    size?: number;
  };
  relevanceScore: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (type: string, id: string) => void;
}

const SEARCH_CATEGORIES = [
  { value: 'all', label: 'All', icon: Search },
  { value: 'conversations', label: 'Conversations', icon: MessageSquare },
  { value: 'messages', label: 'Messages', icon: MessageSquare },
  { value: 'files', label: 'Files', icon: File },
  { value: 'templates', label: 'Templates', icon: Bookmark },
];

const TRENDING_SEARCHES = [
  'How to code in Python',
  'AI model comparison',
  'Data analysis techniques',
  'Creative writing prompts',
  'Machine learning basics',
  'Web development tips'
];

const RECENT_SEARCHES = [
  'React components',
  'Database design',
  'API documentation',
  'UI/UX principles'
];

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  
  const debouncedQuery = useDebounce(query, 300);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, category: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          category: category === 'all' ? undefined : category,
          limit: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, selectedCategory);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, selectedCategory, performSearch]);

  // Save search to recent searches
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s !== searchQuery);
        const updated = [searchQuery, ...filtered].slice(0, 10);
        localStorage.setItem('recent-searches', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    onNavigate(result.type, result.id);
    onClose();
  };

  // Handle trending search selection
  const handleTrendingSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSelectedCategory('all');
  };

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'conversation': return MessageSquare;
      case 'message': return MessageSquare;
      case 'file': return File;
      case 'template': return Bookmark;
      default: return Search;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'conversation': return 'Conversation';
      case 'message': return 'Message';
      case 'file': return 'File';
      case 'template': return 'Template';
      default: return 'Result';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search Everything</span>
              </DialogTitle>
              <DialogDescription>
                Search across conversations, messages, files, and templates
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Category Filters */}
            <div className="flex items-center space-x-2 mt-3">
              {SEARCH_CATEGORIES.map((category) => {
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
                    <span>{category.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!query ? (
              /* Empty State - Show trending and recent searches */
              <div className="p-6 space-y-6">
                {/* Trending Searches */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Trending Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((search, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrendingSearch(search)}
                        className="text-xs"
                      >
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Recent Searches */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Recent Searches</h3>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrendingSearch(search)}
                        className="w-full justify-start text-left"
                      >
                        <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                        {search}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Star className="h-3 w-3 mr-2" />
                      Favorite Conversations
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <File className="h-3 w-3 mr-2" />
                      Recent Files
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Bookmark className="h-3 w-3 mr-2" />
                      My Templates
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Brain className="h-3 w-3 mr-2" />
                      AI Models
                    </Button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              /* Loading State */
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Searching...</span>
              </div>
            ) : results.length === 0 ? (
              /* No Results */
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check your spelling</p>
              </div>
            ) : (
              /* Search Results */
              <div className="p-4 space-y-4">
                {Object.entries(groupedResults).map(([type, typeResults]) => (
                  <div key={type}>
                    <div className="flex items-center space-x-2 mb-3">
                      {React.createElement(getResultIcon(type), { className: "h-4 w-4 text-muted-foreground" })}
                      <h3 className="font-medium">{getResultTypeLabel(type)}s</h3>
                      <Badge variant="secondary" className="text-xs">
                        {typeResults.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {typeResults.map((result) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleResultSelect(result)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">
                                {highlightText(result.title, query)}
                              </h4>
                              
                              {result.snippet && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {highlightText(result.snippet, query)}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                                </span>
                                
                                {result.metadata.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.metadata.category}
                                  </Badge>
                                )}
                                
                                {result.metadata.tags && result.metadata.tags.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Tag className="h-3 w-3" />
                                    <span>{result.metadata.tags.slice(0, 2).join(', ')}</span>
                                    {result.metadata.tags.length > 2 && (
                                      <span>+{result.metadata.tags.length - 2}</span>
                                    )}
                                  </div>
                                )}
                                
                                {result.metadata.size && (
                                  <span>{formatFileSize(result.metadata.size)}</span>
                                )}
                              </div>
                            </div>
                            
                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
