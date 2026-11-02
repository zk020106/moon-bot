// One Codex app-server turn, spoken as newline JSON-RPC. This is the native protocol,
// not ACP. A scripted process proves the sequence; a live CLI is not claimed here.
import { spawn } from 'node:child_process'
import { approvalAnswer, approvalOf } from './app-server-approval.ts'
import { eventOfAppServer, type AppServerEvent } from './app-server-events.ts'

export interface AppServerTurn {
  readonly command: string
  readonly args: readonly string[]
  readonly cwd?: string | undefined
  readonly model?: string | undefined
  readonly effort?: string | undefined
  readonly text: string
  readonly env?: Readonly<Record<string, string>> | undefined
  /** Asked before a command runs. Absent means the command is declined. */
  readonly allow?: ((command: string) => boolean) | undefined
}

interface Rpc {
  id?: unknown
  method?: unknown
  result?: unknown
  error?: { message?: string }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Runs initialize, thread/start, then turn/start. Returns the thread id and turn result. */
export async function runAppServerTurn(
  spec: AppServerTurn,
  timeoutMs = 8_000,
): Promise<{ threadId: string; result: unknown; events: readonly AppServerEvent[] }> {
  const child = spawn(spec.command, spec.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    ...(spec.env !== undefined ? { env: { ...process.env, ...spec.env } } : {}),
  })
  child.stderr?.on('data', () => {})
  let buffer = ''
  let nextId = 1
  const waiters = new Map<number, (value: unknown) => void>()
  const events: AppServerEvent[] = []
  let turn = 1
  let done: (() => void) | undefined
  const finished = new Promise<void>(resolve => {
    done = resolve
  })
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk
    for (let end = buffer.indexOf('\n'); end >= 0; end = buffer.indexOf('\n')) {
      const line = buffer.slice(0, end).trim()
      buffer = buffer.slice(end + 1)
      if (line === '') continue
      try {
        const message = JSON.parse(line) as Rpc
        const approval = approvalOf(message)
        if (approval !== undefined) {
          const allow = spec.allow?.(approval.command ?? '') === true
          child.stdin.write(`${JSON.stringify(approvalAnswer(approval.id, allow))}\n`)
        }
        // Only the server's own `turn/completed` ends the turn. A `turn/start` answer is
        // an acknowledgement and carries no completion.
        if (message.method === 'turn/completed') done?.()
        const mapped = eventOfAppServer(message, turn)
        if (mapped !== undefined) events.push(mapped)
        const id = message.id
        const waiter = typeof id === 'number' ? waiters.get(id) : undefined
        if (waiter === undefined || typeof id !== 'number') continue
        waiters.delete(id)
        waiter(
          message.error !== undefined
            ? new Error(message.error.message ?? 'app-server request failed')
            : message.result,
        )
      } catch {
        /* skip a torn line */
      }
    }
  })
  const call = (method: string, params: Readonly<Record<string, unknown>>): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const id = nextId++
      const timer = setTimeout(() => {
        waiters.delete(id)
        reject(new Error(`${method} timed out`))
      }, timeoutMs)
      waiters.set(id, value => {
        clearTimeout(timer)
        if (value instanceof Error) reject(value)
        else resolve(value)
      })
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
    })
  try {
    await call('initialize', { clientInfo: { name: 'moon-bot', version: '0.1.0' }, capabilities: {} })
    const started = await call('thread/start', {
      ...(spec.cwd !== undefined ? { cwd: spec.cwd } : {}),
      ...(spec.model !== undefined ? { model: spec.model } : {}),
      ephemeral: true,
    })
    const threadId =
      isRecord(started) && isRecord(started.thread) && typeof started.thread.id === 'string' ? started.thread.id : ''
    if (threadId === '') throw new Error('app-server started no thread')
    turn = 1
    const result = await call('turn/start', {
      threadId,
      input: [{ type: 'text', text: spec.text }],
      ...(spec.effort !== undefined ? { effort: spec.effort } : {}),
    })
    await Promise.race([
      finished,
      new Promise<void>((_resolve, reject) => setTimeout(() => reject(new Error('turn events timed out')), timeoutMs)),
    ])
    return { threadId, result, events }
  } finally {
    child.kill()
  }
}
