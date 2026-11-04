/** Client-side chat search outline: recent user/bot lines the palette can match. */

export const OUTLINE_CAP = 80

export type OutlineEntry = {
  readonly turn: number
  readonly prompt?: string
  readonly response?: string
}

export type OutlineItem = {
  readonly kind?: string
  readonly text?: unknown
  readonly turn?: number
}

/** Keep the newest lines; drop the oldest when past the cap. */
export function appendOutline(
  previous: readonly OutlineEntry[] | undefined,
  field: 'prompt' | 'response',
  text: string,
): OutlineEntry[] {
  if (text.trim() === '') return previous !== undefined ? [...previous] : []
  const prev = previous ?? []
  const lastTurn = prev.length > 0 ? Number(prev[prev.length - 1]?.turn ?? -1) : -1
  const next: OutlineEntry[] = [...prev, { turn: lastTurn + 1, [field]: text }]
  return next.length > OUTLINE_CAP ? next.slice(next.length - OUTLINE_CAP) : next
}

/** Replace the outline with the chat page's visible user/bot lines (after a load). */
export function outlineFromItems(items: readonly OutlineItem[]): OutlineEntry[] {
  const entries: OutlineEntry[] = []
  for (const item of items) {
    if (item.kind !== 'user' && item.kind !== 'bot') continue
    const text = String(item.text ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text === '') continue
    const field = item.kind === 'bot' ? 'response' : 'prompt'
    const turn = typeof item.turn === 'number' ? item.turn : entries.length
    entries.push({ turn, [field]: text })
  }
  return entries.length > OUTLINE_CAP ? entries.slice(entries.length - OUTLINE_CAP) : entries
}
