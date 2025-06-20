"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  User, 
  Bot, 
  Calendar, 
  Share2, 
  Download, 
  Eye, 
  Lock,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SharedMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  model?: string;
}

interface SharedConversation {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
  messages: SharedMessage[];
  settings: {
    allowComments: boolean;
    allowDownload: boolean;
    requireAuth: boolean;
  };
}

interface SharePageProps {
  params: {
    shareId: string;
  };
}

export default function SharePage({ params }: SharePageProps) {
  const { shareId } = params;
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<SharedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchSharedConversation = async () => {
      try {
        const response = await fetch(`/api/share/${shareId}`);
        
        if (response.status === 404) {
          setError('Conversation not found or no longer shared');
          return;
        }
        
        if (response.status === 403) {
          setError('This conversation requires authentication to view');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to load conversation');
        }

        const data = await response.json();
        setConversation(data.conversation);
        setViewCount(data.viewCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedConversation();
  }, [shareId]);

  const handleDownload = async () => {
    if (!conversation?.settings.allowDownload) {
      toast({
        title: "Download not allowed",
        description: "The author has disabled downloads for this conversation",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/share/${shareId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${conversation.title}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: "Conversation downloaded successfully",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download conversation",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Conversation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <a href="/">Go to T3 Chat</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Share2 className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-primary">T3 Chat</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="outline" className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>Shared Conversation</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {conversation.settings.allowDownload && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <Button asChild>
                <a href="/" className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Open T3 Chat</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Conversation Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{conversation.title}</h1>
                {conversation.description && (
                  <p className="text-muted-foreground text-lg">{conversation.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={conversation.author.avatar} />
                  <AvatarFallback>
                    {conversation.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>by {conversation.author.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(conversation.createdAt)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{conversation.messageCount} messages</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{viewCount} views</span>
              </div>
            </div>

            {conversation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {conversation.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Messages */}
        <div className="space-y-6">
          {conversation.messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${
                message.role === 'user' 
                  ? 'ml-8 bg-primary/5 border-primary/20' 
                  : 'mr-8 bg-muted/50'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {message.role === 'user' ? 'User' : 'AI Assistant'}
                        </span>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {message.model && (
                            <Badge variant="outline" className="text-xs">
                              {message.model}
                            </Badge>
                          )}
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const isInline = !className || !language;

                          if (!isInline && language) {
                            return (
                              <div className="my-2 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-800">
                                <pre className="p-4 text-sm overflow-x-auto">
                                  <code className="text-gray-100 font-mono">
                                    {String(children).replace(/\n$/, '')}
                                  </code>
                                </pre>
                              </div>
                            );
                          }

                          return (
                            <code
                              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground mb-4">
            This conversation was shared from T3 Chat
          </p>
          <Button asChild>
            <a href="/">
              Start your own conversation on T3 Chat
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
