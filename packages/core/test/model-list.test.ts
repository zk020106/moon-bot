// model/list: one bad id is dropped, a repeated page stops, hidden models stay listed.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { isModelId, listModels, modelsOf } from '../src/engine/acp/model-list.ts'

test('a model id with whitespace or a comma is refused on its own', () => {
  const page = modelsOf({
    data: [
      { model: 'gpt-5', displayName: 'GPT-5', supportedReasoningEfforts: [{ reasoningEffort: 'high' }] },
      { model: 'bad id' },
      { model: 'a,b' },
      { model: 'hidden-one', hidden: true },
    ],
    nextCursor: 'p2',
  })
  assert.deepEqual(
    page.models.map(model => model.id),
    ['gpt-5', 'hidden-one'],
  )
  assert.deepEqual(page.models[0]?.efforts, ['high'])
  assert.equal(page.models[1]?.hidden, true)
  assert.equal(page.nextCursor, 'p2')
  assert.equal(isModelId('ok'), true)
})

test('pages are followed until the cursor repeats', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'model-list-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(
    join(dir, 'list.cjs'),
    `
let input = ''
process.stdin.on('data', chunk => {
  input += chunk
  for (let end = input.indexOf('\\n'); end >= 0; end = input.indexOf('\\n')) {
    const line = input.slice(0, end).trim()
    input = input.slice(end + 1)
    if (line === '') continue
    const message = JSON.parse(line)
    if (message.method !== 'model/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} }) + '\\n')
      continue
    }
    const cursor = message.params?.cursor
    const data = cursor === 'p2'
      ? [{ model: 'second' }]
      : [{ model: 'first' }, { model: 'bad id' }]
    const nextCursor = cursor === 'p2' ? 'p2' : 'p2'
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { data, nextCursor } }) + '\\n')
  }
})
`,
  )
  const models = await listModels({ command: process.execPath, args: [join(dir, 'list.cjs')] })
  assert.deepEqual(
    models.map(model => model.id),
    ['first', 'second'],
  )
})
