import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatAPI, modelsAPI, ChatAPIError } from '@/lib/api/client';

import { useCallback, useRef } from 'react';
import { ChatRequest, Message } from '@/lib/schemas/chat';

export const chatQueryKeys = {
  all: ['chat'] as const,
  messages: (sessionId?: string) =>
    [...chatQueryKeys.all, 'messages', sessionId] as const,
  models: () => [...chatQueryKeys.all, 'models'] as const,
  model: (modelId: string) => [...chatQueryKeys.all, 'model', modelId] as const,
};

export function useModels() {
  return useQuery({
    queryKey: chatQueryKeys.models(),
    queryFn: modelsAPI.getModels,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function useModel(modelId: string) {
  return useQuery({
    queryKey: chatQueryKeys.model(modelId),
    queryFn: () => modelsAPI.getModel(modelId),
    enabled: !!modelId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatAPI.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
}

export function useStreamingChat() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamMessage = useCallback(
    async (
      request: ChatRequest,
      onChunk: (chunk: string) => void,
      onComplete: () => void,
      onError: (error: Error) => void
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const stream = await chatAPI.streamMessage(request);
        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete();
            break;
          }

          if (value && value.chunk) {
            onChunk(value.chunk);
          }

          if (abortControllerRef.current?.signal.aborted) {
            reader.cancel();
            throw new Error('Stream aborted');
          }
        }
      } catch (error) {
        if (error instanceof ChatAPIError) {
          onError(error);
        } else {
          onError(
            new Error(
              error instanceof Error ? error.message : 'Unknown streaming error'
            )
          );
        }
      }
    },
    []
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    streamMessage,
    cancelStream,
    isStreaming: !!abortControllerRef.current,
  };
}

export function useChatSession(sessionId?: string) {
  const queryClient = useQueryClient();

  const createSession = useMutation({
    mutationFn: async (initialMessage: Message) => {
      const newSessionId = `session-${Date.now()}`;
      return { id: newSessionId, messages: [initialMessage] };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(chatQueryKeys.messages(data.id), data.messages);
    },
  });

  const addMessage = useCallback(
    (message: Message) => {
      if (!sessionId) return;

      queryClient.setQueryData(
        chatQueryKeys.messages(sessionId),
        (old: Message[] = []) => [...old, message]
      );
    },
    [queryClient, sessionId]
  );

  const updateLastMessage = useCallback(
    (content: string) => {
      if (!sessionId) return;

      queryClient.setQueryData(
        chatQueryKeys.messages(sessionId),
        (old: Message[] = []) => {
          const messages = [...old];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
          }
          return messages;
        }
      );
    },
    [queryClient, sessionId]
  );

  const clearSession = useCallback(() => {
    if (!sessionId) return;

    queryClient.removeQueries({ queryKey: chatQueryKeys.messages(sessionId) });
  }, [queryClient, sessionId]);

  const messages = useQuery({
    queryKey: chatQueryKeys.messages(sessionId),
    queryFn: () => {
      return [] as Message[];
    },
    enabled: !!sessionId,
    initialData: [],
  });

  return {
    messages: messages.data || [],
    addMessage,
    updateLastMessage,
    clearSession,
    createSession,
  };
}
