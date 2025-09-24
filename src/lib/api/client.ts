import {
  APIErrorSchema,
  ChatRequest,
  ChatRequestSchema,
  ChatResponse,
  ChatResponseSchema,
  Model,
  ModelSchema,
  MultiModel,
  MultiModelSchema,
  StreamChunk,
  StreamChunkSchema,
} from '../schemas/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ChatAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: {
      safeParse: (data: unknown) => {
        success: boolean;
        data?: T;
        error?: unknown;
      };
    }
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
          const parsedError = APIErrorSchema.safeParse(errorData);
          if (parsedError.success) {
            throw new ChatAPIError(
              parsedError.data.message || parsedError.data.error,
              response.status,
              parsedError.data.code
            );
          }
        } catch {}

        throw new ChatAPIError(
          `Request failed: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();

      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          console.warn('API response validation failed:', result.error);
        }
        return result.success && result.data ? result.data : (data as T);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ChatAPIError) {
        throw error;
      }

      throw new ChatAPIError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const validatedRequest = ChatRequestSchema.parse(request);

    return this.request<ChatResponse>(
      '/api/chat',
      {
        method: 'POST',
        body: JSON.stringify(validatedRequest),
      },
      ChatResponseSchema
    );
  }

  async streamMessage(
    request: ChatRequest
  ): Promise<ReadableStream<StreamChunk>> {
    const validatedRequest = ChatRequestSchema.parse({
      ...request,
      stream: true,
    });

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedRequest),
    });

    if (!response.ok) {
      throw new ChatAPIError(
        `Stream request failed: ${response.statusText}`,
        response.status
      );
    }

    if (!response.body) {
      throw new ChatAPIError('No response body available for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            try {
              const decoded = decoder.decode(value, { stream: true });
              const jsonData = decoded.startsWith('data: ')
                ? decoded.slice(6).trim()
                : decoded.trim();

              if (jsonData) {
                const chunk = JSON.parse(jsonData);
                const validatedChunk = StreamChunkSchema.parse(chunk);
                controller.enqueue(validatedChunk);

                if (validatedChunk.done) {
                  break;
                }
              }
            } catch (error) {
              console.warn('Failed to parse stream chunk:', error);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });
  }

  async getModels(): Promise<MultiModel> {
    return this.request<MultiModel>(
      '/api/models',
      { method: 'GET' },
      MultiModelSchema
    );
  }

  async getModel(modelId: string): Promise<Model> {
    return this.request<Model>(
      `/api/models/${modelId}`,
      { method: 'GET' },
      ModelSchema
    );
  }
}

export const apiClient = new APIClient();

export const chatAPI = {
  sendMessage: (request: ChatRequest) => apiClient.sendMessage(request),
  streamMessage: (request: ChatRequest) => apiClient.streamMessage(request),
};

export const modelsAPI = {
  getModels: () => apiClient.getModels(),
  getModel: (modelId: string) => apiClient.getModel(modelId),
};
