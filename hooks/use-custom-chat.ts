import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

interface UseCustomChatOptions {
  api?: string;
  initialMessages?: ChatMessage[];
  body?: Record<string, any>;
  onFinish?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

interface UseCustomChatReturn {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInput: (input: string) => void;
  append: (message: Omit<ChatMessage, 'id'>) => void;
  reload: () => void;
  stop: () => void;
}

export function useCustomChat({
  api = '/api/chat/completions',
  initialMessages = [],
  body = {},
  onFinish,
  onError,
  onStreamStart,
  onStreamEnd,
}: UseCustomChatOptions = {}): UseCustomChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const append = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (messagesToSend: ChatMessage[]) => {
    setIsLoading(true);
    setError(null);
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true, // Enable streaming for real-time responses
          ...body,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Notify that streaming has started
        if (onStreamStart) {
          onStreamStart();
        }

        // Create assistant message placeholder
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        };

        // Add the placeholder message
        setMessages(prev => [...prev, assistantMessage]);

        let accumulatedContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    accumulatedContent += content;
                    console.log('🌊 Streaming chunk received:', content);
                    console.log('📝 Accumulated content length:', accumulatedContent.length);

                    // Update the assistant message with accumulated content
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                } catch (parseError) {
                  // Skip invalid JSON lines
                  continue;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          // Notify that streaming has ended
          if (onStreamEnd) {
            onStreamEnd();
          }
        }

        if (onFinish && accumulatedContent.trim()) {
          onFinish({ ...assistantMessage, content: accumulatedContent });
        }
      } else {
        // Fallback to non-streaming
        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
          const messageContent = data.choices[0].message.content || '';
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: messageContent,
            createdAt: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);

          if (onFinish && messageContent.trim()) {
            onFinish(assistantMessage);
          }
        } else {
          throw new Error('Invalid response format from API');
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't treat as error
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [api, body, onFinish, onError]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Send to API
    sendMessage(newMessages);
  }, [input, isLoading, messages, sendMessage]);

  const reload = useCallback(() => {
    if (messages.length === 0) return;
    
    // Find the last user message and resend from there
    const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const messagesToResend = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesToResend);
    sendMessage(messagesToResend);
  }, [messages, sendMessage]);

  return {
    messages,
    input,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    append,
    reload,
    stop,
  };
}
