"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, FormEvent, useRef, Fragment, UIEvent, memo, useMemo, useCallback, Suspense } from "react";
import { useCustomChat } from "@/hooks/use-custom-chat";

// Define message type compatible with our custom hook
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}
// Import Framer Motion for animations
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserIcon, BotIcon, AlertTriangleIcon, Loader2, MenuIcon, FileIcon, Sparkles, Code, Lightbulb, BookOpen, Sun, Moon, LogOut, Palette, Search, Copy, RotateCcw, MoreHorizontal, Edit3, CheckIcon, ThumbsUp, ThumbsDown, Volume2 } from 'lucide-react';
import ChatSidebar from '@/components/layout/chat-sidebar';
import { ChatCustomizationPanel } from '@/components/chat/chat-customization-panel';
import { GlobalSearch } from '@/components/search/global-search';
import { UserSettingsDialog } from '@/components/ui/user-settings-dialog';
import { HydrationBoundary } from '@/components/error/hydration-boundary';
import ImageGenerationMessage from '@/components/ImageGenerationMessage';

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ChatInput } from '@/components/chat/chat-input';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define a type for messages fetched from our DB, which includes a Prisma Role
interface ChatMessageFromDB {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: Date;
  userId: string;
  sessionId?: string; // Add sessionId to the interface
}

// Suggested prompts for the welcome screen - T3 Chat style
const suggestedPrompts = [
  {
    icon: Sparkles,
    title: "Create",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  {
    icon: BookOpen,
    title: "Explore",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  {
    icon: Code,
    title: "Code",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800"
  },
  {
    icon: Lightbulb,
    title: "Learn",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800"
  }
];

const exampleQuestions = [
  "How does AI work?",
  "Are black holes real?",
  "/image A beautiful sunset over a mountain landscape",
  "How many Rs are in the word 'strawberry'?",
  "/generate A cute robot reading a book",
  "What is the meaning of life?"
];

// Message Actions Component
interface MessageActionsProps {
  message: ChatMessage;
  onCopy: () => void;
  onRegenerate: () => void;
  onContinue: () => void;
  onEdit: () => void;
  onStartInlineEdit?: () => void;
  isLastAssistantMessage: boolean;
  isInlineEditing?: boolean;
}

const MessageActions = memo(({
  message,
  onCopy,
  onRegenerate,
  onContinue,
  onEdit,
  onStartInlineEdit,
  isLastAssistantMessage,
  isInlineEditing = false
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isInlineEditing) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="default"
          size="sm"
          className="h-8 px-3 bg-black text-white hover:bg-gray-800 rounded-md text-xs font-medium"
        >
          Edit message
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="absolute -bottom-8 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-border/50">
        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy message'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Assistant-specific actions */}
        {message.role === 'assistant' && (
          <>
            {/* Thumbs Up Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle thumbs up feedback
                    console.log('Thumbs up for message:', message.id);
                  }}
                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Good response</p>
              </TooltipContent>
            </Tooltip>

            {/* Thumbs Down Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle thumbs down feedback
                    console.log('Thumbs down for message:', message.id);
                  }}
                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Poor response</p>
              </TooltipContent>
            </Tooltip>

            {/* Read Aloud Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Handle text-to-speech
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(message.content);
                      speechSynthesis.speak(utterance);
                    }
                  }}
                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Read aloud</p>
              </TooltipContent>
            </Tooltip>

            {/* Regenerate Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regenerate response</p>
              </TooltipContent>
            </Tooltip>

            {/* Continue Button - only for last assistant message */}
            {isLastAssistantMessage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onContinue}
                    className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Continue response</p>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}

        {/* Edit Button - for user messages */}
        {message.role === 'user' && onStartInlineEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStartInlineEdit}
                className="h-7 w-7 p-0 hover:bg-muted/50 rounded-md"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit message</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});

// Inline Message Editor Component
interface InlineMessageEditorProps {
  message: ChatMessage;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

const InlineMessageEditor = memo(({ message, onSave, onCancel }: InlineMessageEditorProps) => {
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onSave(editContent.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 min-h-[60px]"
        placeholder="Edit your message..."
      />
      <div className="flex items-center justify-end gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 px-3 text-xs"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          className="h-8 px-3 bg-black text-white hover:bg-gray-800 text-xs font-medium"
        >
          Send
        </Button>
      </div>
    </div>
  );
});

// Enhanced ChatMessageContent component with Markdown support - Memoized for performance
const ChatMessageContent = memo(({ content }: { content: string }) => {
  const { resolvedTheme } = useTheme();

  // Check for image generation commands
  const imageGenRegex = /^\/(?:image|img|generate|draw)\s+(.+)/i;
  const imageGenMatch = content.match(imageGenRegex);

  if (imageGenMatch) {
    const prompt = imageGenMatch[1].trim();
    return <ImageGenerationMessage prompt={prompt} />;
  }

  const fileReferenceRegex = /\[File: (.+?) \((\d+\.?\d* KB)\) \(id:(.+?)\)\]\n*\n*(.*)/s;
  const fileMatch = content.match(fileReferenceRegex);

  let displayedContent = content;
  let fileInfo = null;

  if (fileMatch) {
    const [, filename, size, gridFSId, remainingContent] = fileMatch;
    fileInfo = { filename, size, gridFSId };
    displayedContent = remainingContent.trim(); // The rest of the message
  }

  const syntaxTheme = resolvedTheme === 'dark' ? okaidia : materialLight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="prose prose-sm dark:prose-invert max-w-none break-words"
    >
      {fileInfo && (
        <div className="mb-2 p-2 rounded-md bg-accent text-accent-foreground flex items-center space-x-2 border border-border">
          <FileIcon className="h-4 w-4 flex-shrink-0" />
          <a
            href={`/api/files/download/${fileInfo.gridFSId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline text-primary-foreground/80"
            title={`Download ${fileInfo.filename}`}
          >
            Attached File: {fileInfo.filename} ({fileInfo.size})
          </a>
        </div>
      )}
      <div className="prose prose-sm max-w-none dark:prose-invert prose-gray prose-p:mb-2 prose-ul:mb-2 prose-ol:mb-2 prose-h1:mb-2 prose-h2:mb-2 prose-h3:mb-2 prose-h4:mb-2 prose-h5:mb-2 prose-h6:mb-2 prose-blockquote:mb-2">
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
                  <SyntaxHighlighter
                    language={language}
                    style={syntaxTheme as any}
                    customStyle={{
                      borderRadius: '0px',
                      margin: '0',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      boxShadow: 'none',
                    }}
                    codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
                    showLineNumbers
                    wrapLines
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
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
          // Style other markdown elements
          h1: ({ children }) => <h1 className="text-xl font-bold mt-3 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold mt-2 mb-1">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-bold mt-1 mb-1">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-bold mt-1 mb-1">{children}</h6>,
          p: ({ children }) => <p className="mb-2 leading-relaxed text-sm">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 ml-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2 text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold border-r border-gray-300 dark:border-gray-600 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              {children}
            </td>
          ),
          hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
        }}
        >
          {displayedContent}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
});

// Helper function for date grouping
const getRelativeDateGroup = (messageDate: Date | undefined): string => {
  if (!messageDate) return ""; // Should not happen if messages have createdAt

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const msgDate = new Date(messageDate); // Ensure it's a Date object

  if (
    msgDate.getFullYear() === today.getFullYear() &&
    msgDate.getMonth() === today.getMonth() &&
    msgDate.getDate() === today.getDate()
  ) {
    return "Today";
  } else if (
    msgDate.getFullYear() === yesterday.getFullYear() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  } else {
    // Format: Month Day (e.g., "June 12")
    return msgDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  }
};


function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [dbError, setDbError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea's viewport
  const scrollAnchorRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null); // For scroll restoration
  const sessionIdRef = useRef<string | null>(null); // Ref to store session ID for AI response saving
  const { resolvedTheme, setTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sheet control
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false); // For customization panel
  const [isSearchOpen, setIsSearchOpen] = useState(false); // For global search
  const [isStreaming, setIsStreaming] = useState(false); // For streaming indicator
  const { toast } = useToast();

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Tracks if initial history for a session has been loaded

  // State for session management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null);

  // State for inline editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Initialize session ID from URL parameters or redirect to most recent session
  useEffect(() => {
    const sessionIdFromUrl = searchParams.get('sessionId');
    console.log('🔗 URL sessionId:', sessionIdFromUrl, 'Current sessionId:', currentSessionId);
    console.log('👤 Current user:', session?.user, 'User ID:', (session?.user as any)?.id);

    if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      // URL has sessionId, use it
      console.log('🔄 Setting sessionId from URL:', sessionIdFromUrl);
      setCurrentSessionId(sessionIdFromUrl);
    } else if (!sessionIdFromUrl && sessionStatus === "authenticated" && session) {
      // No sessionId in URL and user is authenticated, fetch most recent session
      console.log('🔍 No sessionId in URL, fetching most recent session');
      const fetchMostRecentSession = async () => {
        try {
          console.log('📡 Fetching sessions for user:', (session.user as any)?.id);
          const response = await fetch('/api/chat/sessions');
          if (response.ok) {
            const sessions = await response.json();
            console.log('📋 Available sessions:', sessions.length, sessions);
            if (sessions.length > 0) {
              // Redirect to most recent session
              const mostRecentSessionId = sessions[0].id;
              console.log('🔄 Redirecting to most recent session:', mostRecentSessionId);
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('sessionId', mostRecentSessionId);
              router.replace(newUrl.pathname + newUrl.search);
              setCurrentSessionId(mostRecentSessionId);
            } else {
              console.log('📝 No sessions found, staying on new chat');
            }
            // If no sessions exist, stay on the page without sessionId (new chat)
          } else {
            console.error('❌ Failed to fetch sessions:', response.status, response.statusText);
            const errorData = await response.text();
            console.error('Error details:', errorData);
          }
        } catch (error) {
          console.error('Failed to fetch recent sessions:', error);
          // If fetch fails, stay on the page without sessionId (new chat)
        }
      };

      fetchMostRecentSession();
    }
  }, [searchParams, currentSessionId, sessionStatus, session, router]);

  // State for LLM provider and model selection
  // const [selectedProvider, setSelectedProvider] = useState<string>(''); // Removed as only openai-compatible is supported
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-4o-mini');

  // User preferences hook
  const { preferences, updateDefaultModel } = useUserPreferences();

  // Load user's default model when preferences are available
  useEffect(() => {
    if (preferences?.defaultModel && preferences.defaultModel !== selectedModel) {
      setSelectedModel(preferences.defaultModel);
    }
  }, [preferences?.defaultModel]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for selected file
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false); // State to track file upload in progress

  // Optimized non-blocking fetch function - moved outside useEffect for better performance
  const fetchHistory = useCallback(async (sessionId: string, pageNum: number) => {
    console.log('🔍 fetchHistory called with:', { sessionId, pageNum, isLoadingMore, currentPage, totalPages, initialLoadComplete });

    if (!sessionId) {
      console.log('❌ No sessionId provided, clearing messages');
      setMessages([]);
      setInitialLoadComplete(true);
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }

    if (pageNum > 1 && isLoadingMore) return;
    if (pageNum > 1 && currentPage >= totalPages && totalPages !== 1 && initialLoadComplete) return;

    if (pageNum > 1) {
      setIsLoadingMore(true);
      const viewport = chatScrollAreaRef.current;
      if (viewport) {
        scrollAnchorRef.current = {
          scrollHeight: viewport.scrollHeight,
          scrollTop: viewport.scrollTop,
        };
      }
    }

    try {
      setDbError(null);
      console.log('📡 Fetching messages from API for session:', sessionId);

      // Use fetch with timeout for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}&page=${pageNum}&pageSize=20`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json();
        console.error('❌ API error:', errData);
        setDbError(`Failed to load chat history: ${errData.message}`);
        if (pageNum > 1) setIsLoadingMore(false);
        else setInitialLoadComplete(true);
        return;
      }

      const data = await response.json();
      const historyFromDb: ChatMessageFromDB[] = data.messages;
      console.log('✅ Received messages from API:', historyFromDb.length, 'messages');

      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);

      const chatMessages: ChatMessage[] = historyFromDb.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        createdAt: new Date(msg.createdAt),
      }));

      console.log('🔄 Setting messages in state:', chatMessages.length, 'messages');
      setMessages(prevMessages => {
        if (pageNum === 1) {
          return chatMessages;
        } else {
          const existingMessageIds = new Set(prevMessages.map((msg: ChatMessage) => msg.id));
          const newMessages = chatMessages.filter((msg: ChatMessage) => !existingMessageIds.has(msg.id));
          return [...newMessages, ...prevMessages];
        }
      });

    } catch (err) {
      console.error('❌ fetchHistory error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setDbError('Request timed out. Please try again.');
      } else {
        setDbError(`Error loading history: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      if (pageNum > 1) {
        setIsLoadingMore(false);
      }
      if (pageNum === 1) {
        console.log('✅ Setting initialLoadComplete to true');
        setInitialLoadComplete(true);
      }
    }
  }, [isLoadingMore, currentPage, totalPages, initialLoadComplete]);


  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    setMessages,
    isLoading, // This is our custom loading state
    error: chatError,
  } = useCustomChat({
    api: "/api/chat/completions", // This remains for AI completion
    body: {
      provider: 'openai-compatible', // Only OpenAI-compatible provider is supported
      model: selectedModel,
      stream: true, // Enable streaming for real-time responses
    },
    onStreamStart: () => {
      console.log('🌊 Streaming started');
      setIsStreaming(true);
    },
    onStreamEnd: () => {
      console.log('🏁 Streaming ended');
      setIsStreaming(false);
    },
    // We'll handle message saving, including sessionId, in handleSubmitWithSave and a modified onFinish
    onFinish: async (message: ChatMessage) => {
      // message here is the AI's response
      // Wait for session ID to be available (with timeout)
      let sessionIdToUse = sessionIdRef.current || currentSessionId;
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max wait (increased from 5)

      while (!sessionIdToUse && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        sessionIdToUse = sessionIdRef.current || currentSessionId;
        attempts++;
      }

      if (!sessionIdToUse) {
        console.error("No session ID available to save AI message after waiting.");
        console.error("sessionIdRef.current:", sessionIdRef.current);
        console.error("currentSessionId:", currentSessionId);
        setDbError("Critical: Cannot save AI message, session ID missing.");
        return;
      }

      // Validate message content and role
      if (!message.content || !message.content.trim()) {
        console.error("AI message has no content, skipping save.");
        setDbError("Warning: AI message was empty and not saved.");
        return;
      }

      try {
        setDbError(null);
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message.content.trim(),
            role: "ASSISTANT",
            sessionId: sessionIdToUse,
            provider: 'openai-compatible',
            model: selectedModel
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          setDbError(`Failed to save AI message: ${errData.message}`);
        } else {
          console.log("AI message saved successfully");
        }
        // Clear the session ID ref after successful save
        sessionIdRef.current = null;
        // Optionally, update the message in `messages` state with the ID from DB if needed
      } catch (err) {
        setDbError(`Error saving AI message: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    onError: (error: Error) => console.error("Chat completion error:", error)
  });


  // Completely non-blocking effect - UI renders immediately
  useEffect(() => {
    console.log('🔄 Main useEffect triggered:', { sessionStatus, hasSession: !!session, currentSessionId, initialLoadComplete });

    // Handle authentication and data loading
    if (sessionStatus === "loading") {
      console.log('⏳ Session still loading, waiting...');
      return; // Still loading, do nothing
    }

    if (!session) {
      console.log('❌ No session, redirecting to login');
      // Redirect in background after UI renders
      const timer = setTimeout(() => router.push("/login"), 100);
      return () => clearTimeout(timer);
    }

    // Fetch history if we have a session and haven't loaded yet
    if (currentSessionId && !initialLoadComplete) {
      console.log('📚 Loading session history for:', currentSessionId);
      fetchHistory(currentSessionId, 1);
    } else if (!currentSessionId) {
      console.log('🆕 No session ID, marking as new chat');
      // No session ID, this is a new chat - mark as complete
      setInitialLoadComplete(true);
    } else {
      console.log('✅ Session already loaded or no action needed');
    }
  }, [sessionStatus, session, currentSessionId, initialLoadComplete, fetchHistory]);


  useEffect(() => {
    const viewport = chatScrollAreaRef.current;
    if (viewport && scrollAnchorRef.current && isLoadingMore) {
      // This effect will run after messages are updated and isLoadingMore is true
      // We want to restore scroll position *after* DOM has updated with new messages
      // This is a bit of a race, ideally useLayoutEffect or a callback from setMessages
      // For now, a small timeout might help ensure DOM is updated.

      // This part will be tricky. Let's try to restore in the `finally` block of fetchHistory first,
      // or another useEffect that specifically watches messages count + isLoadingMore.
    }

    // Scroll to bottom for new messages OR to a specific message
    if (initialLoadComplete && messages.length > 0) {
      if (scrollToMessageId) {
        const targetMessageElement = document.getElementById(`message-${scrollToMessageId}`);
        if (targetMessageElement) {
          targetMessageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const timer = setTimeout(() => {
            setScrollToMessageId(null);
          }, 3000);
          return () => clearTimeout(timer);
        } else {
           setScrollToMessageId(null);
        }
      } else if (!isLoadingMore) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && (lastMessage.role === 'user' || lastMessage.role === 'assistant')) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
      }
    }
  }, [messages, initialLoadComplete, isLoadingMore, scrollToMessageId]);


  // Effect for scroll restoration
  useEffect(() => {
    if (!isLoadingMore && scrollAnchorRef.current && chatScrollAreaRef.current) {
      const viewport = chatScrollAreaRef.current;
      const { scrollHeight: oldScrollHeight, scrollTop: oldScrollTop } = scrollAnchorRef.current;
      const newScrollHeight = viewport.scrollHeight;
      if (newScrollHeight > oldScrollHeight) {
         viewport.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
      }
      scrollAnchorRef.current = null; // Reset anchor
    }
  }, [messages.length, isLoadingMore]);




  const handleSuggestedPrompt = (prompt: string) => {
    // Use the handleInputChange from useChat to properly set the input
    const syntheticEvent = {
      target: { value: prompt }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
  };

  // Message action handlers
  const handleCopyMessage = useCallback(() => {
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  }, [toast]);

  const handleRegenerateMessage = async (messageIndex: number) => {
    // Find the user message that prompted this assistant response
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex >= 0 && messages[userMessageIndex]?.role === 'user') {
      const userMessage = messages[userMessageIndex];

      // Remove all messages after the user message
      const newMessages = messages.slice(0, userMessageIndex + 1);
      setMessages(newMessages);

      // Regenerate response by submitting the user message again
      const syntheticEvent = {
        target: { value: userMessage.content }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);

      // Trigger the chat submission
      setTimeout(() => {
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  };

  const handleContinueMessage = async () => {
    // Add a continue prompt to get more content
    const continuePrompt = "Please continue your previous response.";
    const syntheticEvent = {
      target: { value: continuePrompt }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(syntheticEvent);

    // Auto-submit the continue request
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleEditMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message?.role === 'user') {
      // Set the input to the message content for editing
      const syntheticEvent = {
        target: { value: message.content }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);

      // Remove this message and all subsequent messages
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);

      toast({
        title: "Message loaded for editing",
        description: "You can now edit and resend the message",
      });
    }
  };

  const handleStartInlineEdit = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  const handleCancelInlineEdit = () => {
    setEditingMessageId(null);
  };

  const handleSaveInlineEdit = async (messageId: string, newContent: string) => {
    try {
      // Update the message in the local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      ));

      // TODO: Add API call to update message in database if needed

      setEditingMessageId(null);

      toast({
        title: "Message updated",
        description: "Your message has been updated successfully",
      });
    } catch (error) {
      console.error('Failed to update message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  // Memoize the rendered messages to avoid re-rendering on every update - MUST be before any returns
  const renderedMessages = useMemo(() => {
    let lastDateGroup: string | null = null;
    return messages.map((m: ChatMessage) => {
      const currentDateGroup = getRelativeDateGroup(m.createdAt);
      const showDateSeparator = currentDateGroup !== lastDateGroup;
      if (showDateSeparator) {
        lastDateGroup = currentDateGroup;
      }

      return (
        <Fragment key={`fragment-${m.id}`}>
          {showDateSeparator && (
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  {currentDateGroup}
                </span>
              </div>
            </div>
          )}
          <div
            id={`message-${m.id}`}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-6 ${scrollToMessageId === m.id ? 'bg-[#F1C4E6]/50 dark:bg-[#F1C4E6]/30 rounded-lg p-1 -m-1 ring-1 ring-[#F1C4E6]/50' : ''}`}
          >
            <div className={`group relative max-w-[80%] sm:max-w-[70%] ${
              m.role === 'user' ? 'ml-auto' : 'mr-auto'
            }`}>
              <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                m.role === 'user'
                  ? 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-br-md'
                  : 'bg-white dark:bg-gray-900 border border-border text-foreground rounded-bl-md'
              }`}>
                {editingMessageId === m.id ? (
                  <InlineMessageEditor
                    message={m}
                    onSave={(newContent) => handleSaveInlineEdit(m.id, newContent)}
                    onCancel={handleCancelInlineEdit}
                  />
                ) : (
                  <>
                    <ChatMessageContent content={m.content} />

                    {/* Show typing indicator if this is the last message and streaming */}
                    {isStreaming && m.id === messages[messages.length - 1]?.id && m.role === 'assistant' && (
                      <div className="flex items-center space-x-1 mt-2 text-muted-foreground">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs">AI is typing...</span>
                      </div>
                    )}

                    {/* Message Actions - positioned absolutely */}
                    <MessageActions
                      message={m}
                      onCopy={handleCopyMessage}
                      onRegenerate={() => {
                        const messageIndex = messages.findIndex(msg => msg.id === m.id);
                        handleRegenerateMessage(messageIndex);
                      }}
                      onContinue={handleContinueMessage}
                      onEdit={() => {
                        const messageIndex = messages.findIndex(msg => msg.id === m.id);
                        handleEditMessage(messageIndex);
                      }}
                      onStartInlineEdit={() => handleStartInlineEdit(m.id)}
                      isLastAssistantMessage={
                        m.role === 'assistant' &&
                        messages[messages.length - 1]?.id === m.id
                      }
                      isInlineEditing={editingMessageId === m.id}
                    />

                    {m.createdAt && (
                      <p className={`text-xs mt-2 ${
                        m.role === 'user'
                          ? 'text-gray-600 dark:text-gray-600 text-right'
                          : 'text-muted-foreground/70 text-left'
                      }`}>
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Fragment>
      );
    });
  }, [messages, scrollToMessageId, handleCopyMessage, handleContinueMessage]);

  // Handle search navigation
  const handleSearchNavigate = (type: string, id: string) => {
    if (type === 'conversation') {
      // Navigate to conversation
      window.location.href = `/chat?session=${id}`;
    } else if (type === 'message') {
      // Navigate to conversation containing the message
      // In a real app, you'd fetch the conversation ID for the message
      console.log('Navigate to message:', id);
    } else if (type === 'file') {
      // Open file or navigate to file manager
      window.open(`/api/files/${id}`, '_blank');
    } else if (type === 'template') {
      // Use template to start new conversation
      console.log('Use template:', id);
    }
  };

  // ULTRA-FAST submit handler - instant UI response
  const handleSubmitWithSave = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    // INSTANT UI UPDATE - Add user message immediately to UI
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: input,
      role: 'user',
      createdAt: new Date(),
    };

    // Add message to UI instantly
    setMessages(prev => [...prev, tempUserMessage]);

    // Clear input immediately for instant feedback
    const inputValue = input;
    handleInputChange({ target: { value: '' } } as any);

    // Save to database first to get session ID, then start AI response
    setTimeout(async () => {
      try {
        let userMessageContent = inputValue;

        // Handle file upload in background if needed
        if (selectedFile) {
          setIsUploadingFile(true);
          const formData = new FormData();
          formData.append('file', selectedFile);

          try {
            const uploadResponse = await fetch("/api/files/upload", {
              method: "POST",
              body: formData,
            });

            if (uploadResponse.ok) {
              const uploadedFileMetadata = await uploadResponse.json();
              if (uploadedFileMetadata?.filename && uploadedFileMetadata?.gridFSId) {
                userMessageContent = `[File: ${uploadedFileMetadata.originalName} (${(uploadedFileMetadata.size / 1024).toFixed(2)} KB) (id:${uploadedFileMetadata.gridFSId})]\n\n${userMessageContent}`;
              }
            }
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          } catch (err) {
            console.error('File upload error:', err);
          } finally {
            setIsUploadingFile(false);
          }
        }

        // Save user message to database (background)
        // Force 'new' session if currentSessionId is null (new chat)
        const sessionIdToUse = currentSessionId === null ? 'new' : currentSessionId;
        console.log('💾 Saving message with sessionId:', sessionIdToUse, '(currentSessionId:', currentSessionId, ')');
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: userMessageContent,
            role: "USER",
            sessionId: sessionIdToUse,
            provider: 'openai-compatible',
            model: selectedModel
          }),
        });

        if (response.ok) {
          const savedUserMessage: ChatMessageFromDB = await response.json();

          // Update session ID immediately and ensure it's available for AI response
          const newSessionId = savedUserMessage.sessionId || currentSessionId;
          if (newSessionId && newSessionId !== currentSessionId) {
            setCurrentSessionId(newSessionId);

            // Update URL to reflect the new session
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('sessionId', newSessionId);
            router.replace(newUrl.pathname + newUrl.search);
          }

          // Set session ID ref immediately for AI response saving
          sessionIdRef.current = newSessionId;
          console.log("Session ID set for AI response:", newSessionId);

          // Update the temp message with real ID
          setMessages(prev => prev.map(msg =>
            msg.id === tempUserMessage.id
              ? { ...msg, id: savedUserMessage.id }
              : msg
          ));

          // Now start AI response after session ID is confirmed
          handleChatSubmit(e);
        } else {
          console.error('Failed to save user message, not starting AI response');
          setDbError('Failed to save message. Please try again.');
        }
      } catch (err) {
        console.error('Background save error:', err);
        setDbError('Failed to save message. Please try again.');
      }
    }, 0);
  }, [input, selectedFile, currentSessionId, selectedModel, handleChatSubmit, handleInputChange]);

  // Always show UI immediately - no blocking
  const isSessionLoading = sessionStatus === "loading";
  const showContent = session || isSessionLoading;

  // Prevent hydration mismatch by ensuring consistent initial state
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSessionSelect = (sessionId: string) => {
    console.log('🔄 handleSessionSelect called with:', sessionId, 'current:', currentSessionId);
    if (sessionId === currentSessionId) {
      console.log('⚠️ Same session selected, ignoring');
      return;
    }

    console.log('🧹 Clearing messages and setting new session');
    setMessages([]); // Clear current messages immediately
    setCurrentSessionId(sessionId);
    setCurrentPage(1); // Reset pagination
    setTotalPages(1);
    setIsLoadingMore(false); // Reset loading more state
    setInitialLoadComplete(false); // This will trigger fetchHistory in useEffect for the new session
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    setEditingMessageId(null); // Clear any editing state

    // Update URL to reflect the selected session
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('sessionId', sessionId);
    router.replace(newUrl.pathname + newUrl.search);
    console.log('🔗 URL updated to:', newUrl.pathname + newUrl.search);

    // Force fetch history immediately to avoid race conditions
    console.log('🚀 Force fetching history immediately for session:', sessionId);
    fetchHistory(sessionId, 1);
  };

  const handleNewChat = () => {
    console.log('🆕 Starting new chat');
    setMessages([]); // Clear messages
    setCurrentSessionId(null); // Set to null to indicate a new chat context
    setCurrentPage(1);
    setTotalPages(1);
    setInitialLoadComplete(true); // No history to load for a new chat, so consider it complete
    setIsLoadingMore(false);
    setDbError(null); // Clear any previous DB errors
    setIsSidebarOpen(false); // Close sidebar on mobile
    setEditingMessageId(null); // Clear any editing state

    // Clear the session ID ref as well
    sessionIdRef.current = null;
    console.log('🧹 Cleared all chat state');

    // Clear sessionId from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('sessionId');
    console.log('🔗 Clearing sessionId from URL:', newUrl.pathname + newUrl.search);
    router.replace(newUrl.pathname + newUrl.search);
  };

  // Handle model change and save as user preference
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);

    // Save as user's default model preference
    try {
      await updateDefaultModel(modelId);
      console.log(`Default model updated to: ${modelId}`);
    } catch (error) {
      console.error('Failed to update default model:', error);
      // Don't show error to user, just log it - the model change still works locally
    }
  };



  // Memoize sidebar content to prevent re-renders
  const sidebarContent = useMemo(() => {
    if (isSessionLoading) {
      return <div className="w-80 bg-card animate-pulse h-full" />;
    }

    return (
      <ChatSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onSearchResultSelect={(messageId, sessionId) => {
          if (currentSessionId !== sessionId) {
            handleSessionSelect(sessionId);
          }
          setScrollToMessageId(messageId);
          setIsSidebarOpen(false); // Close mobile sidebar if open
        }}
      />
    );
  }, [currentSessionId, isSessionLoading, handleSessionSelect, handleNewChat]);

  // Don't block rendering - show UI immediately, but prevent hydration mismatch
  if (!showContent || !isClient) return null;

  return (
    <HydrationBoundary>
      <div className="flex flex-col h-screen overflow-hidden bg-background" suppressHydrationWarning={true}>
      {/* Welcome Header - Top of entire page */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-b border-border/30 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Mobile Sidebar Toggle + Welcome Text */}
          <div className="flex items-center space-x-3">
            <div className="md:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-background/50">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 sm:w-80 bg-background">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            </div>
            <div className="text-sm text-foreground/80">
              {isSessionLoading ? (
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <span>Welcome, {session?.user?.name || session?.user?.email}!</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Global Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hover:bg-background/50 transition-colors"
              title="Search everything"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Chat Customization */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCustomizationOpen(true)}
              className="hover:bg-background/50 transition-colors"
              title="Customize chat"
            >
              <Palette className="h-4 w-4" />
            </Button>

            {/* User Settings */}
            <UserSettingsDialog />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="hover:bg-background/50 transition-colors"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hover:bg-background/50 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 md:w-72">
           {sidebarContent}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden chat-container">

        {/* Enhanced Chat Messages Area with Smooth Scrolling */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea
            className="h-full custom-scrollbar"
            id="chat-scroll-area"
            viewportRef={chatScrollAreaRef}
            onScroll={(event: UIEvent<HTMLDivElement>) => {
            const target = event.currentTarget;
            const scrollTopThreshold = 50;
            if (
              target.scrollTop < scrollTopThreshold &&
              !isLoadingMore &&
              initialLoadComplete &&
              currentSessionId &&
              currentPage < totalPages
            ) {
              if (currentSessionId) {
                const loadMore = async () => {
                  if (!currentSessionId || isLoadingMore || currentPage >= totalPages) return;
                  
                  setIsLoadingMore(true);
                  const viewport = chatScrollAreaRef.current;
                  if (viewport) {
                    scrollAnchorRef.current = {
                      scrollHeight: viewport.scrollHeight,
                      scrollTop: viewport.scrollTop,
                    };
                  }
                  try {
                    const response = await fetch(`/api/chat/messages?sessionId=${currentSessionId}&page=${currentPage + 1}&pageSize=20`);
                    if (!response.ok) {
                      const errData = await response.json();
                      setDbError(`Failed to load more messages: ${errData.message || response.statusText}`);
                      return;
                    }
                    const data = await response.json();
                    const newHistory: ChatMessageFromDB[] = data.messages;
                    setTotalPages(data.totalPages);
                    setCurrentPage(data.currentPage);
                    const newMessages: ChatMessage[] = newHistory.map(msg => ({ id: msg.id, content: msg.content, role: msg.role.toLowerCase() as 'user' | 'assistant', createdAt: new Date(msg.createdAt)}));
                    setMessages(prev => [...newMessages, ...prev]);
                  } catch (error) {
                    setDbError(error instanceof Error ? error.message : "Failed to load more messages");
                  }
                  finally { setIsLoadingMore(false); }
                };
                loadMore();
              }
            }
          }}
        >
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/5 to-background/10" />
          </div>
          <div className="p-4 sm:p-6 space-y-6 relative z-10">
            <AnimatePresence>
              {isLoadingMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-center py-4"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!initialLoadComplete && !isLoadingMore && currentSessionId && (
                   <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                  >
                      <Loader2 className="mr-2 h-5 w-5 animate-spin mb-2" />
                      <span>Loading chat history...</span>
                  </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Welcome Screen - T3 Chat Style */}
            {initialLoadComplete && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center h-full px-4 py-8 min-h-[60vh]"
              >
                <div className="text-center max-w-3xl mx-auto w-full">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 text-foreground bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  >
                    How can I help you, {session?.user?.name?.split(' ')[0] || 'there'}?
                  </motion.h1>

                  {/* Enhanced Action Buttons with T3 Chat styling */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto"
                  >
                    {suggestedPrompts.map((prompt, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          className={`
                            flex flex-col items-center gap-3 h-auto py-6 px-4 rounded-2xl border-2
                            transition-all duration-300 group hover:shadow-lg hover:shadow-primary/20
                            ${prompt.bgColor} ${prompt.borderColor} ${prompt.color}
                            hover:border-primary/50 hover:bg-primary/5 backdrop-blur-sm
                          `}
                          onClick={() => {
                            // Add functionality for category-specific prompts
                            const categoryPrompts = {
                              'Create': 'Help me create something new and innovative',
                              'Explore': 'I want to explore and discover new ideas',
                              'Code': 'Help me with coding and programming',
                              'Learn': 'I want to learn something new today'
                            };
                            handleSuggestedPrompt(categoryPrompts[prompt.title as keyof typeof categoryPrompts]);
                          }}
                        >
                          <prompt.icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-semibold text-sm">{prompt.title}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Enhanced Example Questions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="space-y-3 max-w-2xl mx-auto"
                  >
                    <h3 className="text-lg font-semibold text-foreground/80 mb-4">
                      Or try one of these:
                    </h3>
                    {exampleQuestions.map((question, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer"
                      >
                        <Button
                          variant="ghost"
                          className="w-full text-left justify-start h-auto py-4 px-6 rounded-2xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border/50 backdrop-blur-sm group"
                          onClick={() => handleSuggestedPrompt(question)}
                        >
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200 text-base">
                            {question}
                          </span>
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}
            {/* Optimized message rendering without heavy animations */}
            {renderedMessages}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        </div>

        {/* Enhanced Error Display with Animation */}
        <AnimatePresence>
          {(chatError || dbError) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-3 sm:p-4 border-t border-border/40 bg-background/60 backdrop-blur-sm"
            >
              <Card className="bg-destructive/5 border-destructive/30 p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-sm font-medium text-destructive">Error</CardTitle>
                </div>
                <CardContent className="text-xs p-0 pt-2 pl-7 text-destructive/90">
                  {chatError && <p>AI Error: {chatError.message}</p>}
                  {dbError && <p>Database Error: {dbError}</p>}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Input - Always render for instant UI */}
        {isSessionLoading ? (
          <div className="p-4 border-t">
            <div className="h-12 bg-muted animate-pulse rounded-3xl" />
          </div>
        ) : (
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmitWithSave}
            isLoading={isLoading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            isUploadingFile={isUploadingFile}
            disabled={!initialLoadComplete && !!currentSessionId}
            isStreaming={isStreaming}
          />
        )}
        </div>
      </div>

      {/* Chat Customization Panel - Only render when needed */}
      {!isSessionLoading && (
        <ChatCustomizationPanel
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
        />
      )}

      {/* Global Search - Only render when needed */}
      {!isSessionLoading && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleSearchNavigate}
        />
      )}
    </div>
    </HydrationBoundary>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
