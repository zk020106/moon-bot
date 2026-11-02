// Session settings an ACP agent publishes, and the environment overlay that hands it
// a custom endpoint without touching the user's own config files.
//
// An agent lists models as one select option, conventionally id "model" or category
// "model" (ACP reserves neither). `session/set_config_option` is advisory: the answer
// is the list the agent actually adopted, so a refused pick is read from that list
// rather than assumed.

export interface ConfigChoice {
  readonly value: string
  readonly name: string
  readonly description?: string | undefined
}

export interface ConfigOption {
  readonly id: string
  readonly name: string
  readonly description?: string | undefined
  readonly category?: string | undefined
  readonly type: 'select' | 'boolean' | 'unknown'
  readonly currentValue?: string | undefined
  readonly options: readonly ConfigChoice[]
}

export interface ConfigSetResult {
  readonly configId: string
  readonly requested: string
  readonly actual?: string | undefined
  /** True when the agent's own answer settled somewhere other than the request. */
  readonly rejected: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const textOf = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined)

/** The model picker: id "model", or any option the agent categorises as a model. */
export const isModelOption = (option: ConfigOption): boolean => option.id === 'model' || option.category === 'model'

export function configOptionsOf(value: unknown): readonly ConfigOption[] {
  const list = Array.isArray(value) ? value : isRecord(value) ? value.configOptions : undefined
  if (!Array.isArray(list)) return []
  return list.flatMap((entry): readonly ConfigOption[] => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || entry.id === '') return []
    const kind = isRecord(entry.type) ? entry.type : isRecord(entry.kind) ? entry.kind : undefined
    const rawOptions = Array.isArray(kind?.options) ? kind.options : Array.isArray(entry.options) ? entry.options : []
    const options = rawOptions.flatMap((choice): readonly ConfigChoice[] => {
      if (!isRecord(choice)) return []
      const valueText = textOf(choice.value) ?? textOf(choice.id)
      if (valueText === undefined) return []
      return [
        {
          value: valueText,
          name: textOf(choice.name) ?? valueText,
          ...(textOf(choice.description) !== undefined ? { description: textOf(choice.description) } : {}),
        },
      ]
    })
    const type =
      kind?.type === 'boolean' || entry.type === 'boolean' ? 'boolean' : options.length > 0 ? 'select' : 'unknown'
    const current = textOf(kind?.currentValue) ?? textOf(entry.currentValue) ?? textOf(entry.current_value)
    return [
      {
        id: entry.id,
        name: textOf(entry.name) ?? entry.id,
        ...(textOf(entry.description) !== undefined ? { description: textOf(entry.description) } : {}),
        ...(textOf(entry.category) !== undefined ? { category: textOf(entry.category) } : {}),
        type,
        ...(current !== undefined ? { currentValue: current } : {}),
        options,
      },
    ]
  })
}

/** What the agent kept after a set. Absent means it did not answer, so nothing is claimed. */
export function configSetResult(configId: string, requested: string, answered: unknown): ConfigSetResult {
  const option = configOptionsOf(answered).find(entry => entry.id === configId)
  if (option === undefined) return { configId, requested, rejected: false }
  return {
    configId,
    requested,
    ...(option.currentValue !== undefined ? { actual: option.currentValue } : {}),
    rejected: option.currentValue !== undefined && option.currentValue !== requested,
  }
}

export interface CustomEndpoint {
  readonly id: string
  readonly name: string
  readonly baseUrl: string
  readonly apiKey?: string | undefined
  readonly models: readonly {
    readonly id: string
    readonly name: string
    readonly contextWindow?: number
    readonly maxTokens?: number
  }[]
}

const literal = (value: string): string =>
  value
    .split('$')
    .join('$' + '$')
    .replace(/^!/u, '$!')

/**
 * Environment that overlays a custom endpoint onto a spawned agent. The user's own
 * config directory is never written: OpenCode takes the overlay as JSON content, and
 * every other agent is pointed at a directory Moon Bot owns.
 */
export function endpointEnv(home: string, endpoints: readonly CustomEndpoint[]): Readonly<Record<string, string>> {
  const usable = endpoints.filter(endpoint => endpoint.baseUrl !== '' && endpoint.models.length > 0)
  if (usable.length === 0) return {}
  const content = JSON.stringify({
    provider: Object.fromEntries(
      usable.map(endpoint => [
        endpoint.id,
        {
          name: endpoint.name,
          options: {
            baseURL: endpoint.baseUrl,
            ...(endpoint.apiKey !== undefined ? { apiKey: literal(endpoint.apiKey) } : {}),
          },
          models: Object.fromEntries(endpoint.models.map(model => [model.id, { name: model.name }])),
        },
      ]),
    ),
  })
  return {
    OPENCODE_CONFIG_CONTENT: content,
    CODEX_HOME: `${home}/agents/codex`,
    CLAUDE_CONFIG_DIR: `${home}/agents/claude`,
    CLINE_DATA_DIR: `${home}/agents/cline`,
    PI_CODING_AGENT_DIR: `${home}/agents/pi`,
  }
}
