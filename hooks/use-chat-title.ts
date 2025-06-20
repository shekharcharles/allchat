import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

interface UseChatTitleReturn {
  generateTitle: (sessionId: string, messages?: ChatMessage[]) => Promise<string | null>;
  updateTitle: (sessionId: string, title: string) => Promise<boolean>;
  getSuggestions: (sessionId: string, messages?: ChatMessage[]) => Promise<string[]>;
  isGenerating: boolean;
  isUpdating: boolean;
}

export function useChatTitle(): UseChatTitleReturn {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const generateTitle = useCallback(async (
    sessionId: string, 
    messages?: ChatMessage[]
  ): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages,
          autoUpdate: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.generatedTitle;
      } else {
        throw new Error('Failed to generate title');
      }
    } catch (error) {
      console.error('Error generating title:', error);
      toast({
        title: "Error",
        description: "Failed to generate chat title",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const updateTitle = useCallback(async (
    sessionId: string, 
    title: string
  ): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          title,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Chat title updated successfully",
        });
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update title');
      }
    } catch (error) {
      console.error('Error updating title:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update chat title",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  const getSuggestions = useCallback(async (
    sessionId: string, 
    messages?: ChatMessage[]
  ): Promise<string[]> => {
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          messages,
          autoUpdate: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        throw new Error('Failed to get title suggestions');
      }
    } catch (error) {
      console.error('Error getting title suggestions:', error);
      return [];
    }
  }, []);

  return {
    generateTitle,
    updateTitle,
    getSuggestions,
    isGenerating,
    isUpdating,
  };
}
