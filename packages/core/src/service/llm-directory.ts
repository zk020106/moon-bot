// Well-known LLM endpoints the standalone service can name: factual connection data only.
export interface KnownProvider {
  readonly id: string
  readonly name: string
  readonly api: 'openai-completions' | 'anthropic-messages'
  readonly baseUrl: string
  readonly models: readonly {
    readonly id: string
    readonly name?: string
    readonly reasoning?: boolean
    readonly contextWindow?: number
    readonly maxTokens?: number
    readonly inputModalities?: readonly string[]
  }[]
}

export const DIRECTORY: readonly KnownProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    api: 'openai-completions',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 128000, maxTokens: 8192, inputModalities: ['text'] },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', contextWindow: 128000, maxTokens: 8192, reasoning: true, inputModalities: ['text'] },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    api: 'openai-completions',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxTokens: 16384, inputModalities: ['text', 'image'] },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', contextWindow: 128000, maxTokens: 16384, inputModalities: ['text', 'image'] },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    api: 'anthropic-messages',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', contextWindow: 200000, maxTokens: 64000, reasoning: true, inputModalities: ['text', 'image'] },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxTokens: 8192, inputModalities: ['text', 'image'] },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000, maxTokens: 16384, reasoning: true, inputModalities: ['text', 'image'] },
      { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', contextWindow: 200000, maxTokens: 16384, reasoning: true, inputModalities: ['text', 'image'] },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    api: 'openai-completions',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'kimi-k2', name: 'Kimi K2', contextWindow: 128000, maxTokens: 8192, inputModalities: ['text'] },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128k', contextWindow: 128000, maxTokens: 4096, inputModalities: ['text'] },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    api: 'openai-completions',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [],
  },
  {
    id: 'groq',
    name: 'Groq',
    api: 'openai-completions',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [],
  },
  {
    id: 'sensenova',
    name: 'SenseNova',
    api: 'openai-completions',
    baseUrl: 'https://token.sensenova.cn/v1',
    models: [
      {
        id: 'sensenova-6.8-flash-lite',
        name: 'SenseNova 6.8 Flash Lite',
        contextWindow: 262144,
        maxTokens: 65536,
        reasoning: true,
        inputModalities: ['text', 'image'],
      },
      {
        id: 'deepseek-v4-flash',
        name: 'DeepSeek V4 Flash',
        contextWindow: 1000000,
        maxTokens: 65536,
        reasoning: true,
        inputModalities: ['text'],
      },
    ],
  },
]
