import { LLM_CHAT_ROLE } from '@/shared/constants';

export interface Message {
  role: (typeof LLM_CHAT_ROLE)[keyof typeof LLM_CHAT_ROLE];
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextLength?: number;
}

export interface RawModelPayload {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface BaseLLMProvider {
  name: string;
  models: Model[];

  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncGenerator<string, void, unknown>;
  listModels(): Promise<Model[]>;
  isConfigured(): boolean;
}
