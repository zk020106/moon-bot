// Codex app-server notifications, mapped onto the engine events the host already
// understands. Only the items a turn needs are kept: assistant text and the turn end.
export interface AppServerEvent {
  readonly type: 'assistant/stream' | 'turn/end' | 'tool/call' | 'tool/result'
  readonly text?: string | undefined
  readonly turn?: number | undefined
  readonly callId?: string | undefined
  readonly name?: string | undefined
  readonly arguments?: string | undefined
  readonly isError?: boolean | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** One server notification, or nothing when it is not part of the answer. */
export function eventOfAppServer(message: unknown, turn: number): AppServerEvent | undefined {
  if (!isRecord(message) || typeof message.method !== 'string') return undefined
  const params = isRecord(message.params) ? message.params : {}
  if (message.method === 'item/agentMessage/delta') {
    const text = typeof params.delta === 'string' ? params.delta : ''
    return text === '' ? undefined : { type: 'assistant/stream', text }
  }
  if (message.method === 'turn/completed') return { type: 'turn/end', turn }
  if (message.method === 'item/started' || message.method === 'item/completed') {
    const item = isRecord(params.item) ? params.item : undefined
    if (item?.type !== 'commandExecution' || typeof item.id !== 'string') return undefined
    if (message.method === 'item/started') {
      return {
        type: 'tool/call',
        callId: item.id,
        name: 'command',
        arguments: typeof item.command === 'string' ? item.command : '',
      }
    }
    return { type: 'tool/result', callId: item.id, ...(item.status === 'failed' ? { isError: true } : {}) }
  }
  return undefined
}
