import {
  LLMProvider,
  LLMProviderFactory,
} from '@/lib/providers/llm/llm-provider-factory';
import { HTTP_STATUS } from '@/shared/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') as LLMProvider;
    const llmProvider = LLMProviderFactory.getProvider(provider);

    const models = await llmProvider.listModels();

    return NextResponse.json({ models }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
