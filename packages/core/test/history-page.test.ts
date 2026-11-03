// The page behind the chat: when a part holds more rows than one page, the page must be
// the NEWEST rows. Keeping the oldest instead hides every reply after the first page,
// which reads as "the Bot stopped answering".
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { historyPageOf } from '../src/service/history-page.ts'
import type { Store } from '../src/store/db.ts'

const row = (seq: number) => ({
  id: seq + 1,
  sessionId: 's1',
  seq,
  turn: Math.floor(seq / 2),
  role: 'user',
  content: [{ type: 'text', text: `m${seq}` }],
  source: null,
  stopReason: null,
  raw: null,
  createdAt: 1000 + seq,
})

/** A store whose `pageBetween` answers oldest-first, the way the real one does. */
const storeOf = (count: number): Store =>
  ({
    sessions: {
      pageBetween: (_sessionId: string, bounds: { readonly limit: number }) => {
        const all = Array.from({ length: count }, (_unused, seq) => row(seq))
        return all.slice(-bounds.limit)
      },
    },
  }) as unknown as Store

test('a part with more rows than a page shows the newest ones', async () => {
  const page = await historyPageOf(storeOf(70))({
    address: { kind: 'session', sessionId: 's1' },
    maxMessages: 60,
  })
  assert.equal(page.hasMore, true)
  assert.equal(page.records.length, 60)
  assert.equal(page.records[0]?.seq, 10)
  assert.equal(page.records.at(-1)?.seq, 69)
})

test('a part that fits in one page is shown whole', async () => {
  const page = await historyPageOf(storeOf(5))({
    address: { kind: 'session', sessionId: 's1' },
    maxMessages: 60,
  })
  assert.equal(page.hasMore, false)
  assert.deepEqual(
    page.records.map(record => record.seq),
    [0, 1, 2, 3, 4],
  )
})
