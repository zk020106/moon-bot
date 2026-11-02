import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { runAppServerTurn } from '../src/engine/acp/app-server-turn.ts'

test('an app-server turn initializes, names the model, then starts the turn', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'app-server-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const log = join(dir, 'seen.json')
  writeFileSync(
    join(dir, 'server.cjs'),
    `
const { writeFileSync } = require('node:fs')
const seen = []
let input = ''
process.stdin.on('data', chunk => {
  input += chunk
  for (let end = input.indexOf('\\n'); end >= 0; end = input.indexOf('\\n')) {
    const line = input.slice(0, end).trim()
    input = input.slice(end + 1)
    if (line === '') continue
    const message = JSON.parse(line)
    seen.push({ method: message.method, params: message.params, result: message.result })
    writeFileSync(${JSON.stringify(log)}, JSON.stringify(seen))
    const result = message.method === 'thread/start' ? { thread: { id: 'thr-1' } } : { ok: true }
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }) + '\\n')
    if (message.method === 'turn/start') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'item/commandExecution/requestApproval', params: { command: 'rm -rf build' } }) + '\\n')
    }
    if (message.id === 9 && message.result) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: 'item/agentMessage/delta', params: { delta: 'Hi' } }) + '\\n')
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', method: 'turn/completed', params: {} }) + '\\n')
    }
  }
})
`,
  )
  const turn = await runAppServerTurn({
    command: process.execPath,
    args: [join(dir, 'server.cjs')],
    cwd: '/work',
    model: 'gpt-6-sol',
    effort: 'high',
    text: 'hello',
  })
  assert.equal(turn.threadId, 'thr-1')
  assert.deepEqual(
    turn.events.map(event => event.type),
    ['assistant/stream', 'turn/end'],
  )
  const seen = JSON.parse(readFileSync(log, 'utf8')) as { method: string; params: Record<string, unknown> }[]
  assert.deepEqual(
    seen.flatMap(entry => (entry.method === undefined ? [] : [entry.method])),
    ['initialize', 'thread/start', 'turn/start'],
  )
  const answer = seen.find(entry => entry.result !== undefined)
  assert.equal(answer?.result?.decision, 'decline')
  assert.equal(seen[1]?.params.model, 'gpt-6-sol')
  assert.equal(seen.find(entry => entry.method === 'turn/start')?.params.effort, 'high')
  assert.equal(seen[1]?.params.cwd, '/work')
  assert.deepEqual(seen[2]?.params.input, [{ type: 'text', text: 'hello' }])
})
