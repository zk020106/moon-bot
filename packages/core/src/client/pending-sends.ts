// Messages the user sent that the host has not drawn yet. They live in memory only: after
// a reload the host transcript is the truth.
//
// Why this exists: the host stores a message, starts a turn, and reports `running` in that
// order, and the chat needs the server's word for all three. Between the click and the
// first report there is a gap with nothing on screen, which reads as "my message vanished".
// These rows fill that gap: the text shows at once, the indicator counts from the click,
// and the row leaves as soon as the host's own row arrives.

export type PendingSendState = 'sending' | 'sent' | 'failed'

export interface PendingSend {
  readonly id: string
  readonly sessionId: string
  readonly text: string
  readonly at: number
  state: PendingSendState
  error?: string | undefined
}

export const PENDING_ID_PREFIX = 'pending:'

export const isPendingId = (id: string): boolean => id.startsWith(PENDING_ID_PREFIX)

/** How long a sent row stays after the host accepted it, in case the transcript lags. */
export const SENT_GRACE_MS = 3_000

type Listener = () => void

export interface PendingSends {
  add(sessionId: string, text: string): string
  settle(id: string, outcome: { readonly ok: true } | { readonly ok: false; readonly error?: string | undefined }): void
  /** Drops a row now: the host's own row for this text has arrived. */
  clear(sessionId: string, text?: string): void
  rowsOf(sessionId: string): readonly PendingSend[]
  /** Every session with a row right now. */
  sessionIds(): readonly string[]
  /** Whether a send for this session is still the newest thing the user did. */
  latestAt(sessionId: string): number
  subscribe(listener: Listener): () => void
}

let counter = 0

export function createPendingSends(options: { readonly now?: () => number } = {}): PendingSends {
  const now = options.now ?? Date.now
  const rows = new Map<string, PendingSend[]>()
  const listeners = new Set<Listener>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const publish = (): void => {
    for (const listener of listeners) listener()
  }

  const replace = (sessionId: string, next: readonly PendingSend[]): void => {
    if (next.length === 0) rows.delete(sessionId)
    else rows.set(sessionId, [...next])
    publish()
  }

  const drop = (id: string): void => {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    for (const [sessionId, list] of rows) {
      const next = list.filter(row => row.id !== id)
      if (next.length !== list.length) replace(sessionId, next)
    }
  }

  return {
    add(sessionId, text) {
      counter += 1
      const id = `${PENDING_ID_PREFIX}${counter}`
      const row: PendingSend = { id, sessionId, text, at: now(), state: 'sending' }
      replace(sessionId, [...(rows.get(sessionId) ?? []), row])
      return id
    },

    settle(id, outcome) {
      for (const [sessionId, list] of rows) {
        const row = list.find(entry => entry.id === id)
        if (row === undefined) continue
        if (outcome.ok) {
          row.state = 'sent'
          delete row.error
          // The host accepted it; keep the row until its transcript row can appear.
          if (!timers.has(id)) {
            const timer = setTimeout(() => {
              timers.delete(id)
              drop(id)
            }, SENT_GRACE_MS)
            timers.set(id, timer)
          }
        } else {
          row.state = 'failed'
          row.error = outcome.error
        }
        replace(sessionId, list)
        return
      }
    },

    clear(sessionId, text) {
      const list = rows.get(sessionId)
      if (list === undefined) return
      // A failed row stays so its error is not swallowed; everything else leaves, because
      // the host's own row is now the truth for that text.
      const next =
        text === undefined
          ? list.filter(row => row.state === 'failed')
          : list.filter(row => row.state === 'failed' && !row.text.includes(text))
      replace(sessionId, next)
    },

    rowsOf(sessionId) {
      return rows.get(sessionId) ?? []
    },

    sessionIds() {
      return [...rows.keys()]
    },

    latestAt(sessionId) {
      const list = rows.get(sessionId)
      if (list === undefined || list.length === 0) return 0
      return list[list.length - 1]?.at ?? 0
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
