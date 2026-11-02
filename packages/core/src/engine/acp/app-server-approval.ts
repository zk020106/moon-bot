// An approval Codex asks the client for. No decision function means refuse: a missing
// host must not become an allow.
export interface ApprovalRequest {
  readonly method: string
  readonly id: number | string
  readonly command?: string | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const APPROVALS = new Set([
  'item/commandExecution/requestApproval',
  'item/fileChange/requestApproval',
  'item/permissions/requestApproval',
])

export function approvalOf(message: unknown): ApprovalRequest | undefined {
  if (!isRecord(message) || typeof message.method !== 'string' || !APPROVALS.has(message.method)) return undefined
  if (typeof message.id !== 'number' && typeof message.id !== 'string') return undefined
  const params = isRecord(message.params) ? message.params : {}
  const command = typeof params.command === 'string' ? params.command : undefined
  return { method: message.method, id: message.id, ...(command !== undefined ? { command } : {}) }
}

export function approvalAnswer(
  id: number | string,
  allow: boolean,
): { jsonrpc: '2.0'; id: number | string; result: { decision: 'accept' | 'decline' } } {
  return { jsonrpc: '2.0', id, result: { decision: allow ? 'accept' : 'decline' } }
}
