"use client";

import React, { useEffect, useState, FormEvent, KeyboardEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircleIcon, MessageSquareIcon, Loader2, AlertTriangleIcon, SearchIcon, XIcon, Trash2Icon, EditIcon, CheckIcon, ImageIcon } from 'lucide-react'; // Removed MoreHorizontalIcon and dropdown imports
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

// For search results
interface SearchResultMessage {
  id: string;
  content: string;
  createdAt: string;
  sessionId: string;
  session: { // Assuming session object is nested as defined in search API
    id: string;
    title: string;
  };
}

interface ChatSidebarProps {
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
  onSearchResultSelect: (messageId: string, sessionId: string) => void;
}

const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-300 dark:bg-yellow-500 text-black rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// Skeleton Loader for Sidebar Items
const SkeletonSidebarItem = () => (
  <div className="flex flex-col items-start p-2.5 space-y-1.5 w-full">
    <div className="h-4 bg-muted/60 rounded w-3/4 animate-pulse"></div>
    <div className="h-3 bg-muted/50 rounded w-1/2 animate-pulse"></div>
  </div>
);

export default function ChatSidebar({ onSessionSelect, onNewChat, currentSessionId, onSearchResultSelect }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // States for rename functionality
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  // State for delete confirmation
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Fetch initial sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true);
      setSessionsError(null);
      try {
        const response = await fetch('/api/chat/sessions');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch sessions: ${response.status}`);
        }
        const data: ChatSession[] = await response.json();
        setSessions(data);
      } catch (err) {
        setSessionsError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [currentSessionId]); // Add currentSessionId to dependencies to refresh when a new chat is selected/created

  const refreshSessions = async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch sessions: ${response.status}`);
      }
      const data: ChatSession[] = await response.json();
      setSessions(data);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setDeletingSessionId(sessionId);
  };

  const handleDeleteConfirm = async (sessionId: string) => {
    setSessionsError(null);
    try {
      const response = await fetch(`/api/chat/delete/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete session: ${response.status}`);
      }

      // If the deleted session was the currently active one, just refresh the session list
      // Don't automatically start a new chat - let the user decide
      if (sessionId === currentSessionId) {
        onNewChat(); // Clear the current session
      }

      // Always refresh the session list after deletion
      await refreshSessions();
      console.log('Chat session deleted successfully:', sessionId);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingSessionId(null);
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editingSessionTitle.trim()) {
      setSessionsError("Chat title cannot be empty.");
      return;
    }
    if (editingSessionTitle.trim() === sessions.find(s => s.id === sessionId)?.title) {
      setEditingSessionId(null); // No change, just exit edit mode
      return;
    }

    setSessionsError(null);
    try {
      const response = await fetch(`/api/chat/rename/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingSessionTitle.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to rename session: ${response.status}`);
      }

      await refreshSessions(); // Refresh list to show new title
      setEditingSessionId(null); // Exit edit mode
      console.log('Chat session renamed successfully:', sessionId, editingSessionTitle);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEditClick = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingSessionTitle(session.title);
  };

  const handleRenameCancel = () => {
    setEditingSessionId(null);
    setEditingSessionTitle('');
    setDeletingSessionId(null); // Clear delete confirmation state
    setSessionsError(null); // Clear any rename errors
  };

  const handleSearchSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/chat/search?query=${encodeURIComponent(searchQuery)}&pageSize=20`); // Limiting to 20 results for now
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to search: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data.messages || []);
      if ((data.messages || []).length === 0) {
        // setSearchError("No results found."); // Or handle as empty results
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setHasSearched(false);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); // Today: 3:45 PM
    } else if (date >= yesterday) {
      return 'Yesterday'; // Yesterday
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }); // Older: Jun 10
    }
  };

  const truncateText = (text: string, maxLength = 100) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const renderContent = () => {
    if (hasSearched) {
      // Display search results
      if (isSearching) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Searching...</span>
          </motion.div>
        );
      }
      if (searchError) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 m-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <div className="flex items-center"> <AlertTriangleIcon className="mr-2 h-4 w-4 flex-shrink-0" /> <p className="font-semibold">Search Error:</p> </div>
            <p className="mt-1 pl-6">{searchError}</p>
          </motion.div>
        );
      }
      if (searchResults.length === 0) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 px-3">
            <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-foreground">No results for "{truncateText(searchQuery, 30)}"</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
          </motion.div>
        );
      }
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <AnimatePresence>
            {searchResults.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0, x: -20 }} // Slide out on clear/new search
                layout // Animate layout changes
              >
                <Button
                  variant="ghost"
                  className="w-full h-auto py-2.5 px-3 text-left flex flex-col items-start group"
                  onClick={() => onSearchResultSelect(msg.id, msg.session.id)}
                >
                  <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 w-full flex justify-between items-center mb-0.5">
                    <span className="truncate max-w-[70%]">In: {truncateText(msg.session.title, 20)}</span>
                    <span>{formatDisplayDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground group-hover:text-foreground leading-snug line-clamp-2">
                    <HighlightMatch text={truncateText(msg.content, 120)} query={searchQuery} />
                  </p>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      );
    } else {
      // Display session list
      if (isLoadingSessions) {
        return (
          <div className="space-y-1 pt-2">
            {[...Array(5)].map((_, i) => <SkeletonSidebarItem key={i} />)}
          </div>
        );
      }
      if (sessionsError) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 m-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <div className="flex items-center"> <AlertTriangleIcon className="mr-2 h-4 w-4 flex-shrink-0" /> <p className="font-semibold">Error:</p> </div>
            <p className="mt-1 pl-6">{sessionsError === "Failed to fetch sessions: 401" ? "Unauthorized. Please log in again." : "Could not load chats."}</p>
          </motion.div>
        );
      }
      if (sessions.length === 0) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 px-3">
            <MessageSquareIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No chat sessions yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/80">Start a new chat to see it here.</p>
          </motion.div>
        );
      }
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: index * 0.03 } }}
                exit={{ opacity: 0, x: -20 }}
                layout
                className="relative" // Add relative for absolute positioning of dropdown trigger
              >
                {editingSessionId === session.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleRenameSession(session.id); }}
                    className="flex items-center space-x-1 p-2 bg-muted/20 rounded-md shadow-inner"
                  >
                    <Input
                      autoFocus
                      value={editingSessionTitle}
                      onChange={(e) => setEditingSessionTitle(e.target.value)}
                      onBlur={() => handleRenameSession(session.id)} // Save on blur
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur(); // Trigger onBlur to save
                        } else if (e.key === 'Escape') {
                          handleRenameCancel();
                        }
                      }}
                      className="flex-grow h-8 text-sm bg-background border-border"
                    />
                    <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600">
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" onClick={handleRenameCancel} className="h-8 w-8 text-red-500 hover:text-red-600">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </form>
                ) : deletingSessionId === session.id ? (
                  <div className="flex items-center space-x-1 p-2 bg-destructive/10 rounded-md border border-destructive/30">
                    <div className="flex flex-col items-start text-left flex-grow overflow-hidden">
                      <span className="font-medium text-foreground truncate w-full text-sm">
                        Delete "{truncateText(session.title, 20)}"?
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        This action cannot be undone
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteConfirm(session.id)}
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Confirm delete"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleDeleteCancel}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      title="Cancel delete"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start items-center text-sm h-auto py-2.5 px-3 pr-20 sidebar-item ${currentSessionId === session.id ? 'active' : ''}`}
                      onClick={() => onSessionSelect(session.id)}
                      title={session.title}
                    >
                      <div className="flex flex-col items-start text-left flex-grow overflow-hidden">
                        <span className="font-medium text-foreground group-hover:text-foreground truncate w-full">
                          {truncateText(session.title, 25)}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 mt-0.5">
                          {formatDisplayDate(session.updatedAt)}
                        </span>
                      </div>
                    </Button>

                    {/* Action buttons */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(session);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        title="Rename chat"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session.id);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                        title="Delete chat"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      );
    }
  };


  return (
    <div className="h-full w-full sm:w-64 md:w-72 flex flex-col sidebar">
      {/* Header with T3 Chat branding */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--wordmark-color, #ca0277)' }}>T3 Chat</h1>
        </div>
        <div className="space-y-2">
          <Button
            className="w-full justify-center text-sm btn-primary rounded-lg h-10"
            onClick={() => { clearSearch(); onNewChat(); }}
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            New Chat
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center text-sm rounded-lg h-10"
            onClick={() => window.location.href = '/images'}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Image Generator
          </Button>
        </div>
      </div>

      {/* Search section */}
      <div className="p-4 border-b border-border space-y-3">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search your dreams..."
              className="w-full text-sm h-10 pl-10 pr-8 chat-input rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSearchSubmit();
                if (e.key === 'Escape') clearSearch();
              }}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={clearSearch}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Chat history section */}
      <div className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">All Chats</h2>
      </div>

      <ScrollArea className="flex-grow">
        <div className="px-4 pb-4">
         {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
}
