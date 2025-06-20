"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Zap, 
  Target,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UsageStats {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  avgSessionDuration: number;
  popularModels: Array<{ name: string; usage: number; percentage: number }>;
  dailyActivity: Array<{ date: string; conversations: number; messages: number }>;
}

interface PerformanceMetrics {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

interface UserEngagement {
  newUsers: number;
  returningUsers: number;
  avgMessagesPerSession: number;
  bounceRate: number;
  retentionRate: number;
  topFeatures: Array<{ feature: string; usage: number }>;
}

export function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // In a real app, these would be separate API calls
      const [usageResponse, performanceResponse, engagementResponse] = await Promise.all([
        fetch(`/api/analytics/usage?timeRange=${timeRange}`),
        fetch(`/api/analytics/performance?timeRange=${timeRange}`),
        fetch(`/api/analytics/engagement?timeRange=${timeRange}`)
      ]);

      // For now, use mock data
      setUsageStats({
        totalConversations: 1247,
        totalMessages: 8934,
        activeUsers: 342,
        avgSessionDuration: 18.5,
        popularModels: [
          { name: 'GPT-4', usage: 4521, percentage: 45.2 },
          { name: 'Claude-3-Sonnet', usage: 3102, percentage: 31.0 },
          { name: 'GPT-3.5-Turbo', usage: 1876, percentage: 18.8 },
          { name: 'Gemini Pro', usage: 512, percentage: 5.1 },
        ],
        dailyActivity: generateMockDailyActivity(),
      });

      setPerformanceMetrics({
        responseTime: 245,
        uptime: 99.8,
        errorRate: 0.2,
        throughput: 156,
        memoryUsage: 68,
        cpuUsage: 34,
        diskUsage: 42,
      });

      setUserEngagement({
        newUsers: 89,
        returningUsers: 253,
        avgMessagesPerSession: 7.2,
        bounceRate: 12.4,
        retentionRate: 78.6,
        topFeatures: [
          { feature: 'Chat Interface', usage: 95 },
          { feature: 'File Upload', usage: 67 },
          { feature: 'Code Generation', usage: 54 },
          { feature: 'Search', usage: 43 },
          { feature: 'Sharing', usage: 32 },
        ],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockDailyActivity = () => {
    const days = parseInt(timeRange.replace('d', ''));
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        conversations: Math.floor(Math.random() * 50) + 20,
        messages: Math.floor(Math.random() * 200) + 100,
      });
    }
    return data;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return CheckCircle;
    if (value >= thresholds.warning) return AlertTriangle;
    return AlertTriangle;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
                <p className="text-sm text-muted-foreground">Monitor usage, performance, and engagement</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="engagement">User Engagement</TabsTrigger>
            </TabsList>

            {/* Usage Analytics */}
            <TabsContent value="usage" className="space-y-6">
              {usageStats && (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                            <p className="text-2xl font-bold">{formatNumber(usageStats.totalConversations)}</p>
                          </div>
                          <MessageSquare className="h-8 w-8 text-primary" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +12.5% from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                            <p className="text-2xl font-bold">{formatNumber(usageStats.totalMessages)}</p>
                          </div>
                          <MessageSquare className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +8.3% from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                            <p className="text-2xl font-bold">{formatNumber(usageStats.activeUsers)}</p>
                          </div>
                          <Users className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +15.7% from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                            <p className="text-2xl font-bold">{usageStats.avgSessionDuration}m</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +3.2% from last period
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Popular Models */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>Popular AI Models</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {usageStats.popularModels.map((model, index) => (
                          <div key={model.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{model.name}</p>
                                <p className="text-sm text-muted-foreground">{formatNumber(model.usage)} uses</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-24">
                                <Progress value={model.percentage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{model.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Performance Metrics */}
            <TabsContent value="performance" className="space-y-6">
              {performanceMetrics && (
                <>
                  {/* System Health */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                            <p className="text-2xl font-bold">{performanceMetrics.responseTime}ms</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="mt-2">
                          <Badge variant={performanceMetrics.responseTime < 300 ? "default" : "destructive"} className="text-xs">
                            {performanceMetrics.responseTime < 300 ? "Good" : "Slow"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                            <p className="text-2xl font-bold">{performanceMetrics.uptime}%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="mt-2">
                          <Badge variant="default" className="text-xs">Excellent</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                            <p className="text-2xl font-bold">{performanceMetrics.errorRate}%</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">Low</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Throughput</p>
                            <p className="text-2xl font-bold">{performanceMetrics.throughput}/s</p>
                          </div>
                          <Wifi className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="mt-2">
                          <Badge variant="default" className="text-xs">Optimal</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resource Usage */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Cpu className="h-5 w-5" />
                        <span>Resource Usage</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">CPU Usage</span>
                            <span className="text-sm">{performanceMetrics.cpuUsage}%</span>
                          </div>
                          <Progress value={performanceMetrics.cpuUsage} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Memory Usage</span>
                            <span className="text-sm">{performanceMetrics.memoryUsage}%</span>
                          </div>
                          <Progress value={performanceMetrics.memoryUsage} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Disk Usage</span>
                            <span className="text-sm">{performanceMetrics.diskUsage}%</span>
                          </div>
                          <Progress value={performanceMetrics.diskUsage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* User Engagement */}
            <TabsContent value="engagement" className="space-y-6">
              {userEngagement && (
                <>
                  {/* Engagement Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">New Users</p>
                            <p className="text-2xl font-bold">{userEngagement.newUsers}</p>
                          </div>
                          <Users className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +22.1% from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Returning Users</p>
                            <p className="text-2xl font-bold">{userEngagement.returningUsers}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +5.7% from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                            <p className="text-2xl font-bold">{userEngagement.retentionRate}%</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-500" />
                        </div>
                        <div className="mt-2">
                          <Badge variant="default" className="text-xs">Excellent</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Messages</p>
                            <p className="text-2xl font-bold">{userEngagement.avgMessagesPerSession}</p>
                          </div>
                          <MessageSquare className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +9.4% from last period
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Feature Usage</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userEngagement.topFeatures.map((feature, index) => (
                          <div key={feature.feature} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold">{index + 1}</span>
                              </div>
                              <span className="font-medium">{feature.feature}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-24">
                                <Progress value={feature.usage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium w-12 text-right">{feature.usage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
