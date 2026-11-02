import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { AppServerRuntime } from '../src/engine/acp/app-server-runtime.ts'
import type { EngineEvent } from '../src/engine/events.ts'

const SERVER = String.raw`
const out = value => process.stdout.write(JSON.stringify(value) + '\n')
let input = ''
process.stdin.on('data', chunk => {
  input += chunk
  for (let end = input.indexOf('\n'); end >= 0; end = input.indexOf('\n')) {
    const line = input.slice(0, end).trim()
    input = input.slice(end + 1)
    if (line === '') continue
    const message = JSON.parse(line)
    if (message.result !== undefined) {
      if (message.id === 42) {
        out({ jsonrpc: '2.0', method: 'item/started', params: { item: { type: 'commandExecution', id: 'c1', command: 'ls' } } })
        out({ jsonrpc: '2.0', method: 'item/agentMessage/delta', params: { delta: 'Done.' } })
        out({ jsonrpc: '2.0', method: 'item/completed', params: { item: { type: 'commandExecution', id: 'c1' } } })
        out({ jsonrpc: '2.0', method: 'turn/completed', params: {} })
      }
      continue
    }
    if (message.method === 'thread/start') {
      out({ jsonrpc: '2.0', id: message.id, result: { thread: { id: 'thr' } } })
    } else if (message.method === 'turn/start') {
      out({ jsonrpc: '2.0', id: message.id, result: { ok: true } })
      out({ jsonrpc: '2.0', id: 42, method: 'item/commandExecution/requestApproval', params: { command: 'ls' } })
    } else {
      out({ jsonrpc: '2.0', id: message.id, result: {} })
    }
  }
})
`

test('an app-server turn reaches the engine as events, and a command is declined without a decider', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'as-runtime-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'server.cjs'), SERVER)
  const seen: EngineEvent[] = []
  const runtime = new AppServerRuntime({
    command: process.execPath,
    args: [join(dir, 'server.cjs')],
    emit: (_id, event) => seen.push(event),
    timeoutMs: 10_000,
  })
  const events: EngineEvent[] = []
  for await (const event of runtime.runTurn({
    sessionId: 's1',
    message: { content: [{ type: 'text', text: 'go' }] },
    config: { model: 'gpt-6-sol', cwd: '/work' },
  }))
    events.push(event)
  assert.deepEqual(
    events.map(event => event.type),
    ['turn/start', 'user/message', 'tool/call', 'assistant/stream', 'tool/result', 'turn/end'],
  )
  const end = events.at(-1)
  assert.equal(end?.type === 'turn/end' ? end.reason.kind : '', 'completed')
  assert.deepEqual(
    seen.map(event => event.type),
    events.map(event => event.type),
  )
})
