// Session settings an ACP agent publishes, and the verdict of a requested change.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { configOptionsOf, configSetResult, endpointEnv, isModelOption } from '../src/engine/acp/session-config.ts'

test('a model select is recognised by id or by category', () => {
  const options = configOptionsOf({
    configOptions: [
      {
        id: 'model',
        name: 'Model',
        type: { type: 'select', currentValue: 'gpt', options: [{ value: 'gpt', name: 'GPT' }] },
      },
      { id: 'effort', name: 'Effort', category: 'model', options: [{ id: 'high', name: 'High' }] },
      { id: 'approval', name: 'Approval', category: 'mode', type: 'boolean', currentValue: 'true' },
    ],
  })
  assert.deepEqual(
    options.filter(isModelOption).map(option => option.id),
    ['model', 'effort'],
  )
  assert.equal(options[0]?.currentValue, 'gpt')
  assert.equal(options[1]?.options[0]?.value, 'high')
  assert.equal(options[2]?.type, 'boolean')
})

test('a set the agent settled elsewhere is a rejection, not a success', () => {
  const kept = configSetResult('model', 'opus', { configOptions: [{ id: 'model', currentValue: 'opus', options: [] }] })
  const moved = configSetResult('model', 'opus', {
    configOptions: [{ id: 'model', currentValue: 'sonnet', options: [] }],
  })
  assert.equal(kept.rejected, false)
  assert.equal(moved.rejected, true)
  assert.equal(moved.actual, 'sonnet')
})

test('a custom endpoint rides in the environment, and a key stays literal', () => {
  const env = endpointEnv('/team', [
    {
      id: 'magpie',
      name: 'Magpie',
      baseUrl: 'http://gateway/v1',
      apiKey: '$SECRET!',
      models: [{ id: 'grok', name: 'Grok' }],
    },
    { id: 'empty', name: 'Empty', baseUrl: 'http://gateway/v1', models: [] },
  ])
  assert.equal(env.CODEX_HOME, '/team/agents/codex')
  const overlay = JSON.parse(env.OPENCODE_CONFIG_CONTENT ?? '{}') as {
    provider: Record<string, { options: { apiKey: string } }>
  }
  assert.equal(overlay.provider.magpie?.options.apiKey, '$'.repeat(2) + 'SECRET!')
  assert.equal(overlay.provider.empty, undefined)
})

test('a start failure names the engine and how to leave it', async () => {
  const { startFailureOf } = await import('../src/engine/acp/session-settings.ts')
  const line = startFailureOf('Codex (ACP)', 'Invalid params')
  assert.match(line, /Codex \(ACP\) could not start this turn/)
  assert.match(line, /Invalid params/)
  assert.match(line, /built-in engine/)
})
