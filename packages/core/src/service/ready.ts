// Readiness: whether this instance can actually serve a turn, not merely whether its
// process is up. `/healthz` answers "the server is running", which stays true when the
// model gateway is unreachable — the container looked healthy while every reply failed.
import { accessSync, constants } from 'node:fs'

export interface ReadyCheck {
  readonly ok: boolean
  readonly checks: Readonly<Record<string, boolean>>
  readonly detail: Readonly<Record<string, string>>
}

export interface ReadyInput {
  /** Where the team's data lives; a turn writes there. */
  readonly home: string
  /** Providers the settings declare, by id. */
  readonly providers: readonly string[]
  /** Whether a provider resolves to a usable route (address and models). */
  readonly resolves: (provider: string) => boolean
}

/**
 * The checks a deployment can fail without the process dying. Each one is something that
 * broke in practice: a read-only data folder, and a gateway the container cannot reach.
 */
export function readinessOf(input: ReadyInput): ReadyCheck {
  const checks: Record<string, boolean> = {}
  const detail: Record<string, string> = {}

  try {
    accessSync(input.home, constants.W_OK)
    checks.data = true
  } catch {
    checks.data = false
    detail.data = 'the data folder is not writable'
  }

  if (input.providers.length === 0) {
    checks.providers = false
    detail.providers = 'no model provider is set up'
  } else {
    const usable = input.providers.filter(provider => input.resolves(provider))
    checks.providers = usable.length > 0
    if (usable.length === 0) detail.providers = `${input.providers.join(', ')} resolve to no usable route`
  }

  const ok = Object.values(checks).every(Boolean)
  return { ok, checks, detail }
}
