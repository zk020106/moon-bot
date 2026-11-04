// The checks a deployment can fail without its process dying.
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { readinessOf } from '../src/service/ready.ts'

test('a writable home and one usable provider is ready', () => {
  const home = mkdtempSync(join(tmpdir(), 'ready-'))
  try {
    const ready = readinessOf({ home, providers: ['magpie'], resolves: () => true })
    assert.equal(ready.ok, true)
    assert.deepEqual(ready.checks, { data: true, providers: true })
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a provider that resolves to nothing is not ready, and says which', () => {
  const home = mkdtempSync(join(tmpdir(), 'ready-'))
  try {
    const ready = readinessOf({ home, providers: ['magpie'], resolves: () => false })
    assert.equal(ready.ok, false)
    assert.equal(ready.checks.providers, false)
    assert.match(ready.detail.providers ?? '', /magpie resolve to no usable route/)
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('no provider at all is not ready', () => {
  const home = mkdtempSync(join(tmpdir(), 'ready-'))
  try {
    const ready = readinessOf({ home, providers: [], resolves: () => true })
    assert.equal(ready.ok, false)
    assert.equal(ready.detail.providers, 'no model provider is set up')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})

test('a home that does not exist is not writable', () => {
  const ready = readinessOf({ home: join(tmpdir(), 'definitely-not-here-xyz'), providers: ['p'], resolves: () => true })
  assert.equal(ready.ok, false)
  assert.equal(ready.checks.data, false)
})
