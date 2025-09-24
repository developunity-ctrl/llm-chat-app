'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

import { useStreamingChat } from '@/hooks/use-chat';
import { Message } from '@/lib/schemas/chat';

type ChatContextType = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, model?: string) => Promise<void>;
  clearMessages: () => void;
  cancelMessage: () => void;

  defaultModel: string;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  defaultModel?: string;
  defaultProvider?: string;
}

export function ChatProvider({
  children,
  defaultModel = 'llama3.2',
  defaultProvider = 'ollama',
}: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { streamMessage, cancelStream } = useStreamingChat();

  const sendMessage = useCallback(
    async (content: string, model?: string) => {
      const userMessage: Message = {
        role: 'user',
        content,
        id: `user-${Date.now()}`,
        timestamp: new Date(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);
      setError(null);

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Thinking...',
        id: assistantMessageId,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        let assistantContent = '';

        await streamMessage(
          {
            messages: newMessages,
            model: !model || model?.length === 0 ? defaultModel : model,
            provider: defaultProvider,
            temperature: 0.7,
            maxTokens: 1024,
            stream: true,
          },

          (chunk: string) => {
            assistantContent += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          },

          () => {
            setIsLoading(false);
          },

          (error: Error) => {
            setError(error.message);
            setIsLoading(false);
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== assistantMessageId)
            );
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsLoading(false);

        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
      }
    },
    [messages, defaultModel, defaultProvider, streamMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    cancelStream();
  }, [cancelStream]);

  const cancelMessage = useCallback(() => {
    cancelStream();
    setIsLoading(false);

    setMessages((prev) =>
      prev.filter(
        (msg) => msg.role !== 'assistant' || msg.content.trim() !== ''
      )
    );
  }, [cancelStream]);

  const value: ChatContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    cancelMessage,
    defaultModel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
