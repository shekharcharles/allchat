"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent, ChangeEvent, useRef, Fragment } from "react";
import { useChat, Message as VercelChatMessage } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'; // Use AsyncLight for smaller bundle
import { okaidia, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a light and dark theme
import { useTheme } from 'next-themes'; // To adapt syntax highlighting to theme
import { SendHorizonalIcon, LogOutIcon, UserIcon, BotIcon, AlertTriangleIcon } from 'lucide-react'; // Icons

// Define a type for messages fetched from our DB, which includes a Prisma Role
interface ChatMessageFromDB {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: Date;
  userId: string;
}

// Component to render message content, handling code blocks
const ChatMessageContent = ({ content }: { content: string }) => {
  const { resolvedTheme } = useTheme();
  const syntaxTheme = resolvedTheme === 'dark' ? okaidia : materialLight;

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, language, code] = match;
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <div key={`code-${match.index}`} className="my-2 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-800">
        <SyntaxHighlighter
          language={language || 'plaintext'}
          style={syntaxTheme}
          customStyle={{
            borderRadius: '0px', // Handled by parent div
            margin: '0',
            padding: '1rem',
            fontSize: '0.875rem', // text-sm
            boxShadow: 'none', // Remove default shadow if any
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }} // Use monospace font from globals
          showLineNumbers
          wrapLines
        >
          {String(code).trim()}
        </SyntaxHighlighter>
      </div>
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
  }

  if (parts.length === 0) {
     return <div className="prose prose-sm dark:prose-invert max-w-none break-words">{content}</div>;
  }

  return <div className="prose prose-sm dark:prose-invert max-w-none break-words">{parts.map((part, index) => <Fragment key={index}>{part}</Fragment>)}</div>;
};


export default function ChatPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [dbError, setDbError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();


  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    setMessages,
    isLoading,
    error: chatError,
  } = useChat({
    api: "/api/chat/completions",
    onFinish: async (message: VercelChatMessage) => {
      try {
        const response = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message.content, role: "ASSISTANT" }),
        });
        if (!response.ok) const errData = await response.json().then(d => setDbError(`Failed to save AI message: ${d.message}`));
      } catch (err) {
        setDbError(`Error saving AI message: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    onError: (error) => console.error("Chat completion error:", error)
  });

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    const fetchHistory = async () => {
      try {
        setDbError(null);
        const response = await fetch("/api/chat/messages");
        if (!response.ok) {
          const errData = await response.json();
          setDbError(`Failed to load chat history: ${errData.message}`);
          return;
        }
        const historyFromDb: ChatMessageFromDB[] = await response.json();
        const vercelAiMessages: VercelChatMessage[] = historyFromDb.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          createdAt: new Date(msg.createdAt),
        }));
        setMessages(vercelAiMessages);
      } catch (err) {
        setDbError(`Error loading history: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    if (session) fetchHistory();
  }, [session, sessionStatus, router, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitWithSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessageContent = input;
    const tempUserMessageId = `temp-user-${Date.now()}`;
    setMessages([...messages, { id: tempUserMessageId, role: 'user', content: userMessageContent, createdAt: new Date() }]);

    try {
      setDbError(null);
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessageContent, role: "USER" }),
      });
      if (!response.ok) {
        const errData = await response.json();
        setDbError(`Failed to save your message: ${errData.message}`);
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempUserMessageId));
        return;
      }
    } catch (err) {
      setDbError(`Error saving your message: ${err instanceof Error ? err.message : String(err)}`);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempUserMessageId));
      return;
    }
    handleChatSubmit(e); // This will use the current value of 'input'
  };

  if (sessionStatus === "loading") return <div className="flex items-center justify-center h-screen bg-background text-foreground"><p>Loading session...</p></div>;
  if (!session) return null;

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border p-3 sm:p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
           {/* Placeholder for logo or app name if needed */}
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">AI Chat</h1>
        </div>
        <div className="flex items-center space-x-3">
          <p className="text-xs sm:text-sm text-muted-foreground hidden md:block">
            Welcome, {session.user?.name || session.user?.email}!
          </p>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })} title="Logout">
            <LogOutIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-grow" id="chat-scroll-area">
        <div className="p-4 sm:p-6 space-y-6">
          {messages.map((m: VercelChatMessage) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-[80%] sm:max-w-[70%] ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {m.role === 'assistant' && (
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-full p-2 flex items-center justify-center w-8 h-8 text-sm mt-1">
                    <BotIcon size={18}/>
                  </AvatarFallback>
                )}
                {m.role === 'user' && (
                  <AvatarFallback className="bg-muted-foreground text-background rounded-full p-2 flex items-center justify-center w-8 h-8 text-sm mt-1">
                     <UserIcon size={18}/>
                  </AvatarFallback>
                )}
                <Card className={`rounded-xl shadow-md ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'}`}>
                  <CardContent className="p-3 text-sm leading-relaxed">
                    <ChatMessageContent content={m.content} />
                    {m.createdAt && (
                      <p className={`text-xs mt-2 ${m.role === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Error Display Area */}
      {(chatError || dbError) && (
        <div className="p-3 sm:p-4 border-t border-border bg-background">
          <Card className="bg-destructive/10 text-destructive-foreground border-destructive/30 p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-5 w-5 text-destructive" />
              <CardTitle className="text-sm font-medium">Error</CardTitle>
            </div>
            <CardContent className="text-xs p-0 pt-2 pl-7">
              {chatError && <p>AI Error: {chatError.message}</p>}
              {dbError && <p>Database Error: {dbError}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Input Form - Sticky Footer */}
      <footer className="bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:p-4 sticky bottom-0 z-50">
        <form onSubmit={handleSubmitWithSave} className="flex items-center space-x-2 sm:space-x-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-grow h-10 sm:h-11 rounded-full bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-1 text-sm sm:text-base px-4"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-full w-10 h-10 sm:w-11 sm:h-11 p-0 flex-shrink-0" title="Send message">
            {isLoading ? <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin"></div> : <SendHorizonalIcon className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
