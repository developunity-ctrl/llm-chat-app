import { LLMProviderFactory } from '@/lib/providers/llm/llm-provider-factory';
import { DEFAULT_SYSTEM_PROMPT, HTTP_STATUS } from '@/shared/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, model, provider, temperature, maxTokens } =
      await request.json();

    const llmProvider = LLMProviderFactory.getProvider(provider);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chatStream = llmProvider.streamChat({
            messages: [DEFAULT_SYSTEM_PROMPT, ...messages],
            model,
            temperature,
            maxTokens,
          });

          for await (const chunk of chatStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }
        } catch (error) {
          console.error('Error during streaming chat:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
