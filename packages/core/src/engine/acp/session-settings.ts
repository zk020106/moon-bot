// ACP session settings applied on a live runtime: read the published options, and
// ask the agent to change one. The agent's answer is the value that stuck.
import type { EngineEvent } from '../events.ts'
import { callFailureOf } from '../failure.ts'
import type { TurnInput } from '../runtime.ts'
import { configOptionsOf, configSetResult, type ConfigOption, type ConfigSetResult } from './session-config.ts'
import type { AgentSession } from './runtime-types.ts'

export interface SettingsHost {
  sessions: Map<string, AgentSession>
  request(method: string, params: Readonly<Record<string, unknown>>): Promise<unknown>
  appendTranscript(sessionId: string, message: import('./runtime-types.ts').AcpStoredMessage): Promise<void>
  emit(sessionId: string, event: EngineEvent): void
  onConfig?(sessionId: string, options: readonly ConfigOption[]): void
}

export const configOf = (host: SettingsHost, sessionId: string): readonly ConfigOption[] =>
  host.sessions.get(sessionId)?.config ?? []

export async function setConfig(
  host: SettingsHost,
  sessionId: string,
  configId: string,
  value: string,
): Promise<ConfigSetResult> {
  const session = host.sessions.get(sessionId)
  if (session === undefined) return { configId, requested: value, rejected: true }
  const answered = await host.request('session/set_config_option', { sessionId: session.acpId, configId, value })
  const next = configOptionsOf(answered)
  if (next.length > 0) {
    session.config = next
    host.onConfig?.(sessionId, next)
  }
  return configSetResult(configId, value, next.length > 0 ? { configOptions: next } : answered)
}

/** A turn that never reached the agent still leaves the user's line and the reason. */
export async function refusedTurn(
  host: SettingsHost,
  input: TurnInput,
  turn: number,
  message: string,
): Promise<readonly EngineEvent[]> {
  const events: readonly EngineEvent[] = [
    { type: 'turn/start', turn },
    { type: 'turn/end', turn, reason: { kind: 'error', error: callFailureOf(message) } },
  ]
  await host.appendTranscript(input.sessionId, {
    role: 'user',
    content: input.message.content,
    turn,
    ...(input.message.source !== undefined ? { source: input.message.source } : {}),
    at: Date.now(),
  })
  await host.appendTranscript(input.sessionId, {
    role: 'system',
    content: message === '' ? [] : [{ type: 'text', text: message }],
    turn,
    source: { kind: 'turn-error' },
    at: Date.now(),
  })
  for (const event of events) host.emit(input.sessionId, event)
  return events
}
