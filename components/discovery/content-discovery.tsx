"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Star, 
  MessageSquare, 
  Users, 
  Clock, 
  Tag, 
  Sparkles,
  Brain,
  Code,
  Lightbulb,
  BookOpen,
  Zap,
  Globe,
  ArrowRight,
  RefreshCw,
  Filter,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  popularity: number;
  growth: number;
  tags: string[];
  conversationCount: number;
}

interface PopularConversation {
  id: string;
  title: string;
  description: string;
  category: string;
  messageCount: number;
  createdAt: string;
  tags: string[];
  isShared: boolean;
  author: string;
}

interface Recommendation {
  id: string;
  type: 'conversation' | 'template' | 'topic';
  title: string;
  description: string;
  reason: string;
  category: string;
  tags: string[];
  relevanceScore: number;
}

interface ContentDiscoveryProps {
  onNavigate: (type: string, id: string) => void;
  onStartConversation: (template?: string) => void;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Globe },
  { value: 'creative', label: 'Creative', icon: Sparkles },
  { value: 'coding', label: 'Coding', icon: Code },
  { value: 'learning', label: 'Learning', icon: BookOpen },
  { value: 'work', label: 'Work', icon: Lightbulb },
  { value: 'research', label: 'Research', icon: Brain },
];

const TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: '1',
    title: 'AI-Powered Code Review',
    description: 'Using AI to improve code quality and catch bugs early',
    category: 'coding',
    popularity: 95,
    growth: 23,
    tags: ['AI', 'Code Review', 'Development'],
    conversationCount: 156,
  },
  {
    id: '2',
    title: 'Creative Writing with AI',
    description: 'Collaborative storytelling and creative writing techniques',
    category: 'creative',
    popularity: 87,
    growth: 18,
    tags: ['Writing', 'Creativity', 'Storytelling'],
    conversationCount: 203,
  },
  {
    id: '3',
    title: 'Data Science Fundamentals',
    description: 'Essential concepts and tools for data analysis',
    category: 'learning',
    popularity: 82,
    growth: 15,
    tags: ['Data Science', 'Analytics', 'Python'],
    conversationCount: 134,
  },
  {
    id: '4',
    title: 'Product Strategy & Planning',
    description: 'Building successful products from concept to launch',
    category: 'work',
    popularity: 78,
    growth: 12,
    tags: ['Product', 'Strategy', 'Planning'],
    conversationCount: 89,
  },
];

const POPULAR_CONVERSATIONS: PopularConversation[] = [
  {
    id: '1',
    title: 'Building a React Component Library',
    description: 'Step-by-step guide to creating reusable React components',
    category: 'coding',
    messageCount: 45,
    createdAt: '2024-01-15',
    tags: ['React', 'Components', 'Library'],
    isShared: true,
    author: 'Alex Chen',
  },
  {
    id: '2',
    title: 'Marketing Strategy for SaaS Startups',
    description: 'Comprehensive marketing approach for early-stage SaaS companies',
    category: 'work',
    messageCount: 38,
    createdAt: '2024-01-14',
    tags: ['Marketing', 'SaaS', 'Strategy'],
    isShared: true,
    author: 'Sarah Johnson',
  },
  {
    id: '3',
    title: 'Machine Learning Model Optimization',
    description: 'Techniques for improving ML model performance and efficiency',
    category: 'research',
    messageCount: 52,
    createdAt: '2024-01-13',
    tags: ['ML', 'Optimization', 'Performance'],
    isShared: false,
    author: 'Dr. Michael Park',
  },
];

export function ContentDiscovery({ onNavigate, onStartConversation }: ContentDiscoveryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('week');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter content by category
  const filteredTopics = TRENDING_TOPICS.filter(topic => 
    selectedCategory === 'all' || topic.category === selectedCategory
  );

  const filteredConversations = POPULAR_CONVERSATIONS.filter(conv => 
    selectedCategory === 'all' || conv.category === selectedCategory
  );

  // Load personalized recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from an API
        const mockRecommendations: Recommendation[] = [
          {
            id: '1',
            type: 'template',
            title: 'API Documentation Template',
            description: 'Comprehensive template for documenting REST APIs',
            reason: 'Based on your recent coding conversations',
            category: 'coding',
            tags: ['API', 'Documentation', 'REST'],
            relevanceScore: 0.92,
          },
          {
            id: '2',
            type: 'topic',
            title: 'Advanced React Patterns',
            description: 'Explore advanced patterns and techniques in React development',
            reason: 'Popular among developers like you',
            category: 'coding',
            tags: ['React', 'Patterns', 'Advanced'],
            relevanceScore: 0.88,
          },
          {
            id: '3',
            type: 'conversation',
            title: 'Building Scalable Microservices',
            description: 'Architecture patterns for microservices at scale',
            reason: 'Trending in your field',
            category: 'work',
            tags: ['Microservices', 'Architecture', 'Scale'],
            relevanceScore: 0.85,
          },
        ];
        
        setRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [selectedCategory]);

  const getCategoryIcon = (category: string) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    return categoryData?.icon || Globe;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      creative: 'text-purple-600 bg-purple-50 border-purple-200',
      coding: 'text-green-600 bg-green-50 border-green-200',
      learning: 'text-blue-600 bg-blue-50 border-blue-200',
      work: 'text-orange-600 bg-orange-50 border-orange-200',
      research: 'text-pink-600 bg-pink-50 border-pink-200',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Discover</h2>
          <p className="text-muted-foreground">Explore trending topics and popular conversations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(category => {
                const IconComponent = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recommended">For You</TabsTrigger>
        </TabsList>

        {/* Trending Topics */}
        <TabsContent value="trending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((topic, index) => {
              const IconComponent = getCategoryIcon(topic.category);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${getCategoryColor(topic.category)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{topic.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{topic.growth}%
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {topic.conversationCount} conversations
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{topic.popularity}</div>
                          <div className="text-xs text-muted-foreground">popularity</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{topic.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {topic.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => onStartConversation(topic.title)}
                      >
                        Start Conversation
                        <ArrowRight className="h-3 w-3 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Popular Conversations */}
        <TabsContent value="popular" className="space-y-4">
          <div className="space-y-3">
            {filteredConversations.map((conversation, index) => {
              const IconComponent = getCategoryIcon(conversation.category);
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getCategoryColor(conversation.category)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{conversation.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{conversation.description}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                                <span className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{conversation.messageCount} messages</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(conversation.createdAt).toLocaleDateString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{conversation.author}</span>
                                </span>
                                {conversation.isShared && (
                                  <Badge variant="outline" className="text-xs">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Shared
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {conversation.tags.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onNavigate('conversation', conversation.id)}
                            >
                              View
                              <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Personalized Recommendations */}
        <TabsContent value="recommended" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading recommendations...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const IconComponent = getCategoryIcon(rec.category);
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getCategoryColor(rec.category)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold">{rec.title}</h3>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {rec.type}
                                  </Badge>
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(rec.relevanceScore * 100)}% match
                                    </span>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                                <p className="text-xs text-blue-600 mb-2">{rec.reason}</p>
                                
                                <div className="flex flex-wrap gap-1">
                                  {rec.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (rec.type === 'template') {
                                    onStartConversation(rec.title);
                                  } else {
                                    onNavigate(rec.type, rec.id);
                                  }
                                }}
                              >
                                {rec.type === 'template' ? 'Use Template' : 'Explore'}
                                <ArrowRight className="h-3 w-3 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
