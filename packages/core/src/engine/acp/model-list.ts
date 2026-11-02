// A provider model list, read the way a CLI such as Codex app-server publishes it:
// `model/list` over newline JSON-RPC, paged by `nextCursor`. One bad id is dropped.
// The call does not start a session and does not claim the CLI can run a turn.
import { spawn } from 'node:child_process'

export interface ListedModel {
  readonly id: string
  readonly name: string
  readonly efforts: readonly string[]
  readonly hidden: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Ids that would break a picker or a stored ref. Whitespace, `=`, and `,` are refused. */
export const isModelId = (value: string): boolean => /^[^\s=,]+$/u.test(value) && value.length <= 160

export function modelsOf(value: unknown): { readonly models: readonly ListedModel[]; readonly nextCursor?: string } {
  if (!isRecord(value) || !Array.isArray(value.data)) return { models: [] }
  const models = value.data.flatMap((entry): readonly ListedModel[] => {
    if (!isRecord(entry) || typeof entry.model !== 'string') return []
    const id = entry.model.trim()
    if (!isModelId(id)) return []
    const efforts = Array.isArray(entry.supportedReasoningEfforts)
      ? entry.supportedReasoningEfforts.flatMap(item =>
          isRecord(item) && typeof item.reasoningEffort === 'string' ? [item.reasoningEffort] : [],
        )
      : []
    return [
      {
        id,
        name:
          typeof entry.displayName === 'string' && entry.displayName.trim() !== ''
            ? entry.displayName.trim().slice(0, 160)
            : id,
        efforts,
        hidden: entry.hidden === true,
      },
    ]
  })
  const nextCursor = typeof value.nextCursor === 'string' && value.nextCursor !== '' ? value.nextCursor : undefined
  return { models, ...(nextCursor !== undefined ? { nextCursor } : {}) }
}

export interface ModelListCommand {
  readonly command: string
  readonly args: readonly string[]
  readonly env?: Readonly<Record<string, string>> | undefined
}

/** Reads every page. A repeated cursor or a dead process stops the list instead of looping. */
export async function listModels(spec: ModelListCommand, timeoutMs = 5_000): Promise<readonly ListedModel[]> {
  const child = spawn(spec.command, spec.args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    ...(spec.env !== undefined ? { env: { ...process.env, ...spec.env } } : {}),
  })
  child.stderr?.on('data', () => {})
  let buffer = ''
  const waiters = new Map<number, (value: unknown) => void>()
  let nextId = 1
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk
    for (let end = buffer.indexOf('\n'); end >= 0; end = buffer.indexOf('\n')) {
      const line = buffer.slice(0, end).trim()
      buffer = buffer.slice(end + 1)
      if (line === '') continue
      try {
        const message = JSON.parse(line) as { id?: unknown; result?: unknown; error?: { message?: string } }
        const id = message.id
        const waiter = typeof id === 'number' ? waiters.get(id) : undefined
        if (waiter === undefined || typeof id !== 'number') continue
        waiters.delete(id)
        waiter(message.error !== undefined ? new Error(message.error.message ?? 'model/list failed') : message.result)
      } catch {
        /* a torn line is skipped */
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
  const request = (cursor?: string): Promise<unknown> =>
    call('model/list', { limit: 100, includeHidden: true, ...(cursor !== undefined ? { cursor } : {}) })
  const seen = new Set<string>()
  const models: ListedModel[] = []
  try {
    await call('initialize', { clientInfo: { name: 'moon-bot', version: '0.1.0' }, capabilities: {} })
    let cursor: string | undefined
    do {
      const page = modelsOf(await request(cursor))
      models.push(...page.models)
      if (page.nextCursor !== undefined && seen.has(page.nextCursor)) break
      if (page.nextCursor !== undefined) seen.add(page.nextCursor)
      cursor = page.nextCursor
    } while (cursor !== undefined)
    return models
  } finally {
    child.kill()
  }
}
