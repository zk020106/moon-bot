import { createElement as h } from 'react'
import { t } from './i18n.ts'
import { parseDiagnosticsMarkdown } from './feedback-diagnostics.ts'

export function DiagnosticsPreview({ markdown }: { readonly markdown: string }) {
  if (markdown.trim() === '') {
    return (
      <pre tabIndex={0} aria-label={t('Diagnostics')}>
        {t('Loading…')}
      </pre>
    )
  }
  const { facts, rest } = parseDiagnosticsMarkdown(markdown)
  if (facts.length === 0) {
    return (
      <pre tabIndex={0} aria-label={t('Diagnostics')}>
        {markdown}
      </pre>
    )
  }
  return (
    <div className='bt-fb-diag' tabIndex={0} aria-label={t('Diagnostics')}>
      <table className='bt-fb-diag-table'>
        <tbody>
          {facts.map(row => (
            <tr key={`${row.label}:${row.value}`}>
              <th scope='row'>{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rest !== '' ? <pre className='bt-fb-diag-rest'>{rest}</pre> : null}
    </div>
  )
}
