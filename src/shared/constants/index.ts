import { Message } from '@/lib/schemas/chat';

export const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const DEFAULT_SYSTEM_PROMPT: Message = {
  role: 'system',
  content: `
    Never answer with empty responses, if you don't know the answer provide standard response like "I'm not sure. Please provide more details or ask another question.
    User is able to switch between different models and providers, so keep answers generic and not provider-specific."`,
};

export const LLM_CHAT_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;
