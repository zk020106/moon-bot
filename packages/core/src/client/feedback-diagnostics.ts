/** Parse the diagnostics Markdown report for the Feedback preview (copy still uses raw Markdown). */

export type DiagnosticsFact = { readonly label: string; readonly value: string }

export type DiagnosticsPreviewModel = {
  readonly facts: readonly DiagnosticsFact[]
  readonly rest: string
}

const ROW = /^\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/

/** Split a reportMarkdown string into fact rows and the remaining prose/log blocks. */
export function parseDiagnosticsMarkdown(markdown: string): DiagnosticsPreviewModel {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const facts: DiagnosticsFact[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index] ?? ''
    const trimmed = line.trim()
    if (trimmed === '') {
      index += 1
      break
    }
    if (/^\|[\s-|]+\|$/.test(trimmed) || trimmed === '| | |') {
      index += 1
      continue
    }
    const match = ROW.exec(trimmed)
    if (!match) break
    const label = (match[1] ?? '').replace(/\\\|/g, '|').trim()
    const value = (match[2] ?? '').replace(/\\\|/g, '|').trim()
    if (label !== '' || value !== '') facts.push({ label: label || '—', value })
    index += 1
  }
  const rest = lines.slice(index).join('\n').trim()
  return { facts, rest }
}
