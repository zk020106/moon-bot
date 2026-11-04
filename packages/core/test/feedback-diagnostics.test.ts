import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseDiagnosticsMarkdown } from '../src/client/feedback-diagnostics.ts'

test('parseDiagnosticsMarkdown turns the versions table into rows and keeps the rest', () => {
  const markdown = [
    '| | |',
    '|---|---|',
    '| Moon Bot | 0.1.0 |',
    '| OS | linux |',
    '| Language | zh |',
    '',
    'No host errors recorded.',
  ].join('\n')
  const parsed = parseDiagnosticsMarkdown(markdown)
  assert.deepEqual(parsed.facts, [
    { label: 'Moon Bot', value: '0.1.0' },
    { label: 'OS', value: 'linux' },
    { label: 'Language', value: 'zh' },
  ])
  assert.equal(parsed.rest, 'No host errors recorded.')
})

test('parseDiagnosticsMarkdown falls back when there is no table', () => {
  const parsed = parseDiagnosticsMarkdown('plain text only')
  assert.deepEqual(parsed.facts, [])
  assert.equal(parsed.rest, 'plain text only')
})
