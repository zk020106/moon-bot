// Codex app-server behind the AgentRuntime seam: one turn opens an ephemeral thread and
// streams its notifications as engine events. Approval reaches the host's own decider;
// with none, a command is declined.
import type { EngineEvent } from '../events.ts'
import { callFailureOf } from '../failure.ts'
import type { AgentRuntime, CancelReason, TurnInput, TurnMessage } from '../runtime.ts'
import { runAppServerTurn } from './app-server-turn.ts'

export interface AppServerRuntimeOptions {
  readonly command: string
  readonly args: readonly string[]
  readonly emit: (sessionId: string, event: EngineEvent) => void
  /** Asked before a command runs. Absent means every command is declined. */
  readonly allow?: ((sessionId: string, command: string) => boolean) | undefined
  /** Extra environment for the spawned CLI, such as a private CODEX_HOME. */
  readonly env?: Readonly<Record<string, string>> | undefined
  readonly timeoutMs?: number | undefined
}

export class AppServerRuntime implements AgentRuntime {
  private readonly options: AppServerRuntimeOptions
  private running = new Map<string, () => void>()

  constructor(options: AppServerRuntimeOptions) {
    this.options = options
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {
    for (const cancel of this.running.values()) cancel()
    this.running.clear()
  }

  async *runTurn(input: TurnInput): AsyncIterable<EngineEvent> {
    const text = input.message.content.map(block => (block.type === 'text' ? block.text : '')).join('\n')
    const turn = 1
    const sessionId = input.sessionId
    const head: EngineEvent[] = [
      { type: 'turn/start', turn },
      { type: 'user/message', content: input.message.content, source: input.message.source },
    ]
    for (const event of head) {
      this.options.emit(sessionId, event)
      yield event
    }
    let cancelled = false
    this.running.set(sessionId, () => {
      cancelled = true
    })
    try {
      const result = await runAppServerTurn(
        {
          command: this.options.command,
          args: this.options.args,
          ...(input.config?.cwd !== undefined ? { cwd: input.config.cwd } : {}),
          ...(input.config?.model !== undefined ? { model: input.config.model } : {}),
          ...(input.config?.effort !== undefined ? { effort: input.config.effort } : {}),
          text,
          ...(this.options.env !== undefined ? { env: this.options.env } : {}),
          allow: command => this.options.allow?.(sessionId, command) === true,
        },
        this.options.timeoutMs ?? 60_000,
      )
      for (const event of result.events) {
        if (event.type === 'assistant/stream') {
          const streamed: EngineEvent = { type: 'assistant/stream', text: event.text ?? '' }
          this.options.emit(sessionId, streamed)
          yield streamed
        } else if (event.type === 'tool/call') {
          const call: EngineEvent = {
            type: 'tool/call',
            callId: event.callId ?? '',
            name: event.name ?? 'command',
            arguments: event.arguments ?? '',
          }
          this.options.emit(sessionId, call)
          yield call
        } else if (event.type === 'tool/result') {
          const out: EngineEvent = {
            type: 'tool/result',
            callId: event.callId ?? '',
            ...(event.isError === true ? { isError: true } : {}),
          }
          this.options.emit(sessionId, out)
          yield out
        }
      }
      const end: EngineEvent = cancelled
        ? { type: 'turn/end', turn, reason: { kind: 'aborted', reason: 'user' } }
        : { type: 'turn/end', turn, reason: { kind: 'completed' } }
      this.options.emit(sessionId, end)
      yield end
    } catch (error) {
      const end: EngineEvent = { type: 'turn/end', turn, reason: { kind: 'error', error: callFailureOf(error) } }
      this.options.emit(sessionId, end)
      yield end
    } finally {
      this.running.delete(sessionId)
    }
  }

  async steer(sessionId: string, message: TurnMessage): Promise<boolean> {
    // app-server has no mid-turn injection in what this build speaks.
    void sessionId
    void message
    return false
  }

  async cancelTurn(sessionId: string, reason?: CancelReason): Promise<void> {
    void reason
    this.running.get(sessionId)?.()
  }
}
