import { z } from 'zod';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  id: z.string().optional(),
  timestamp: z.date().optional(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string(),
  provider: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
});

export const ChatResponseSchema = z.object({
  content: z.string(),
  finishReason: z.enum(['stop', 'length', 'error']),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export const StreamChunkSchema = z.object({
  chunk: z.string(),
  done: z.boolean().optional(),
});

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  description: z.string().optional(),
  contextLength: z.number().optional(),
});

export const MultiModelSchema = z.object({
  models: z.array(ModelSchema),
});

export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  model: z.string(),
  provider: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type StreamChunk = z.infer<typeof StreamChunkSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type MultiModel = z.infer<typeof MultiModelSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
