// The local rows that fill the gap between a send and the host's own transcript row.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPendingSends, PENDING_ID_PREFIX, SENT_GRACE_MS } from '../src/client/pending-sends.ts'

test('a send shows at once, and its row leaves when the host row arrives', () => {
  let clock = 1000
  const sends = createPendingSends({ now: () => clock })
  const id = sends.add('s1', 'hello')
  assert.equal(id.startsWith(PENDING_ID_PREFIX), true)
  assert.deepEqual(
    sends.rowsOf('s1').map(row => [row.text, row.state]),
    [['hello', 'sending']],
  )
  assert.equal(sends.latestAt('s1'), 1000)

  clock = 2000
  sends.clear('s1', 'hello')
  assert.equal(sends.rowsOf('s1').length, 0)
})

test('a failed send keeps its error and stays visible', () => {
  const sends = createPendingSends()
  const id = sends.add('s1', 'oops')
  sends.settle(id, { ok: false, error: 'the model is out of quota' })
  const [row] = sends.rowsOf('s1')
  assert.equal(row?.state, 'failed')
  assert.equal(row?.error, 'the model is out of quota')
  // Clearing a settled send must not hide a failure.
  sends.clear('s1')
  assert.equal(sends.rowsOf('s1').length, 1)
})

test('a sent row survives briefly, then leaves on its own', async () => {
  const sends = createPendingSends()
  const id = sends.add('s1', 'done')
  sends.settle(id, { ok: true })
  assert.equal(sends.rowsOf('s1')[0]?.state, 'sent')
  await new Promise(resolve => setTimeout(resolve, SENT_GRACE_MS + 100))
  assert.equal(sends.rowsOf('s1').length, 0)
})

test('rows are per session, and subscribers hear every change', () => {
  const sends = createPendingSends()
  let heard = 0
  const stop = sends.subscribe(() => {
    heard += 1
  })
  sends.add('s1', 'a')
  sends.add('s2', 'b')
  assert.equal(sends.rowsOf('s1').length, 1)
  assert.equal(sends.rowsOf('s2').length, 1)
  assert.equal(heard, 2)
  stop()
  sends.add('s1', 'c')
  assert.equal(heard, 2)
})
