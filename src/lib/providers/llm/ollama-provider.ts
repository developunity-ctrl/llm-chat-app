import {
  BaseLLMProvider,
  ChatRequest,
  ChatResponse,
  Model,
  RawModelPayload,
} from './interface';

export class OllamamProvider implements BaseLLMProvider {
  name: string = 'Ollama';
  models: Model[] = [];
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  private async ensureModel(requested?: string): Promise<string> {
    if (requested) return requested;

    if (this.models.length === 0) {
      try {
        await this.listModels();
      } catch {}
    }
    const first = this.models[0]?.id;
    if (!first) {
      throw new Error(
        'No local models found. Pull one with `ollama pull llama3.2` (or set ChatRequest.model).'
      );
    }
    return first;
  }

  async listModels(): Promise<Model[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`tags failed: ${res.status} ${res.statusText} ${body}`);
      }
      const data = await res.json();

      this.models =
        data.models?.map((m: RawModelPayload) => ({
          id: m.name,
          name: m.name,
          provider: this.name,
        })) ?? [];

      return this.models;
    } catch (error) {
      console.error('Error listing models:', error);
      throw error;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = await this.ensureModel(request.model);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 512,
        },
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.error ?? JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '');
      }
      throw new Error(
        `Ollama chat error: ${res.status} ${res.statusText} ${detail}`
      );
    }

    const data = await res.json();

    return {
      content: data.message?.content ?? '',
      finishReason: data.done_reason ?? (data.done ? 'stop' : undefined),
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
    };
  }

  async *streamChat(
    request: ChatRequest
  ): AsyncGenerator<string, void, unknown> {
    const model = await this.ensureModel(request.model);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: true,
        options: {
          temperature: request.temperature ?? 0.4,
          num_predict: request.maxTokens ?? 512,
        },
      }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = body?.error ?? JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '');
      }
      throw new Error(
        `Ollama stream error: ${res.status} ${res.statusText} ${detail}`
      );
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.message?.content) {
              yield data.message.content;
            }
            if (data.done) {
              return;
            }
          } catch {
            buffer = trimmed + buffer;
          }
        }
      }

      console.log('Stream complete, remaining buffer:', buffer);
      const tail = buffer.trim();
      if (tail) {
        try {
          const data = JSON.parse(tail);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch {}
      }
    } finally {
      reader.releaseLock();
    }
  }
}
