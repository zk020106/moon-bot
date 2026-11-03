// One send, with the local row that stands in until the host's transcript row arrives.
import { errorCopy } from './i18n.ts'
import type { PendingSends } from './pending-sends.ts'

export interface SendDeps {
  readonly pending: PendingSends | undefined
  readonly call: (endpoint: string, payload?: unknown) => Promise<unknown>
  readonly after: (work: Promise<unknown>) => Promise<unknown>
  readonly partFor: (id: string) => string
}

/**
 * The row shows before the request is answered, so a click is never a blank screen. The
 * host's own row replaces it once the transcript catches up; a failure keeps its row so
 * the reason stays readable.
 */
export function sendWithPending(deps: SendDeps, sessionId: string, text: string): Promise<unknown> {
  const id = deps.pending?.add(sessionId, text)
  const done = deps.after(deps.call('send', { sessionId: deps.partFor(sessionId), text }))
  if (id !== undefined)
    void done.then(
      () => deps.pending?.settle(id, { ok: true }),
      (error: unknown) =>
        deps.pending?.settle(id, {
          ok: false,
          error: errorCopy(undefined, error instanceof Error ? error.message : String(error)),
        }),
    )
  return done
}
