// What this build can actually do with a provider. A catalog is not a promise that a
// turn can run: Codex app-server can list models, and only an ACP adapter can run one.
export type ProviderProtocol = 'builtin' | 'acp' | 'app-server' | 'none'

export interface ProviderCapability {
  readonly id: string
  readonly protocol: ProviderProtocol
  readonly listsModels: boolean
  readonly runsTurns: boolean
  readonly reason?: string | undefined
}

const TABLE: readonly ProviderCapability[] = [
  { id: 'builtin', protocol: 'builtin', listsModels: true, runsTurns: true },
  { id: 'claude-acp', protocol: 'acp', listsModels: true, runsTurns: true },
  { id: 'codex-acp', protocol: 'acp', listsModels: true, runsTurns: true },
  { id: 'opencode', protocol: 'acp', listsModels: true, runsTurns: true },
  { id: 'gemini', protocol: 'acp', listsModels: true, runsTurns: true },
  {
    id: 'codex',
    protocol: 'app-server',
    listsModels: true,
    runsTurns: false,
    reason: 'app-server turn is tested against a script, not wired to a Bot',
  },
  // `claude` and `grok` answer their own protocols. Neither CLI publishes a model list
  // command (`claude --help` has none), so nothing here may claim it can list them.
  {
    id: 'claude',
    protocol: 'none',
    listsModels: false,
    runsTurns: false,
    reason: 'no model list command; use claude-agent-acp',
  },
  { id: 'grok', protocol: 'none', listsModels: false, runsTurns: false, reason: 'no model list command; no adapter' },
  { id: 'cursor-agent', protocol: 'none', listsModels: false, runsTurns: false, reason: 'no adapter' },
]

export function capabilityOf(id: string): ProviderCapability {
  return (
    TABLE.find(entry => entry.id === id) ?? {
      id,
      protocol: 'none',
      listsModels: false,
      runsTurns: false,
      reason: 'unknown provider',
    }
  )
}

export const providerCapabilities = (): readonly ProviderCapability[] => TABLE
