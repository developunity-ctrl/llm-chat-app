import { BaseLLMProvider } from './interface';
import { OllamamProvider } from './ollama-provider';

export type LLMProvider =
  | 'ollama'
  | 'openai' // not Supported yet
  | 'antropic'; // not Supported yet

type AvailableProvider = {
  type: LLMProvider;
  name: string;
  isConfigured: boolean;
};

export class LLMProviderFactory {
  private static providers: Map<LLMProvider, BaseLLMProvider> = new Map();

  static availableProviders: AvailableProvider[] = [
    {
      type: 'ollama',
      name: 'Ollama',
      isConfigured: new OllamamProvider().isConfigured(),
    },
  ];

  static getProvider(type?: LLMProvider): BaseLLMProvider {
    const providerType =
      type || (process.env.LLM_PROVIDER as LLMProvider) || 'ollama';

    if (!this.providers.has(providerType)) {
      switch (providerType) {
        case 'ollama': {
          this.providers.set(providerType, new OllamamProvider());
          break;
        }
        default: {
          throw new Error(`Unsupported LLM provider: ${providerType}`);
        }
      }
    }

    const provider = this.providers.get(providerType);

    if (!provider || !provider.isConfigured()) {
      throw new Error(`LLM provider is not configured: ${providerType}`);
    }

    return provider;
  }
}
