import assert from 'node:assert/strict'
import { test } from 'node:test'
import { capabilityOf } from '../src/engine/acp/provider-capability.ts'

test('a listed model is not treated as a runnable turn', () => {
  const codex = capabilityOf('codex')
  assert.equal(codex.listsModels, true)
  assert.equal(codex.runsTurns, false)
  assert.equal(codex.protocol, 'app-server')
  assert.equal(capabilityOf('codex-acp').runsTurns, true)
  assert.equal(capabilityOf('claude').listsModels, false)
  assert.match(capabilityOf('claude').reason ?? '', /claude-agent-acp/)
  assert.equal(capabilityOf('nope').reason, 'unknown provider')
  // Only the ACP family and the built-in engine may claim they can run a turn.
  for (const id of ['claude', 'grok', 'cursor-agent', 'codex']) {
    assert.equal(capabilityOf(id).runsTurns, false, id)
  }
})
