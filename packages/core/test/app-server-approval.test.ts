import assert from 'node:assert/strict'
import { test } from 'node:test'
import { approvalAnswer, approvalOf } from '../src/engine/acp/app-server-approval.ts'

test('a command approval is declined unless a decision allows it', () => {
  const request = approvalOf({
    jsonrpc: '2.0',
    id: 7,
    method: 'item/commandExecution/requestApproval',
    params: { command: 'rm -rf build' },
  })
  assert.equal(request?.command, 'rm -rf build')
  assert.deepEqual(approvalAnswer(7, false).result.decision, 'decline')
  assert.deepEqual(approvalAnswer(7, true).result.decision, 'accept')
  assert.equal(approvalOf({ method: 'turn/completed', id: 1 }), undefined)
})
