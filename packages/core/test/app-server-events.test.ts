import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eventOfAppServer } from '../src/engine/acp/app-server-events.ts'

test('assistant deltas and the turn end are engine events; other notices are ignored', () => {
  assert.deepEqual(eventOfAppServer({ method: 'item/agentMessage/delta', params: { delta: 'Hi' } }, 3), {
    type: 'assistant/stream',
    text: 'Hi',
  })
  assert.equal(eventOfAppServer({ method: 'item/agentMessage/delta', params: { delta: '' } }, 3), undefined)
  assert.deepEqual(eventOfAppServer({ method: 'turn/completed', params: {} }, 3), { type: 'turn/end', turn: 3 })
  assert.equal(eventOfAppServer({ method: 'thread/status/changed', params: {} }, 3), undefined)
  assert.deepEqual(
    eventOfAppServer(
      { method: 'item/started', params: { item: { type: 'commandExecution', id: 'c1', command: 'ls' } } },
      3,
    ),
    { type: 'tool/call', callId: 'c1', name: 'command', arguments: 'ls' },
  )
  assert.deepEqual(
    eventOfAppServer(
      { method: 'item/completed', params: { item: { type: 'commandExecution', id: 'c1', status: 'failed' } } },
      3,
    ),
    { type: 'tool/result', callId: 'c1', isError: true },
  )
  assert.equal(
    eventOfAppServer({ method: 'item/started', params: { item: { type: 'agentMessage', id: 'a1' } } }, 3),
    undefined,
  )
})
