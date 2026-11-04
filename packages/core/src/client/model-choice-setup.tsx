// Inline first-run provider setup for the model-choice dock. Reuses AddProvider so the
// empty-chat path is: add a Known/Custom provider → pick a model → chat, without only
// dumping the user into Settings → Models.
import { createElement as h, useEffect, useState } from 'react'
import { t } from './i18n.ts'
import { AddProvider } from './providers-add.tsx'
import type { Apply, ProvidersActions, ProvidersView } from './providers-types.ts'
import { translated } from './providers-types.ts'

export type FirstRunProvidersActions = ProvidersActions & {
  refreshModels?: (() => Promise<unknown>) | undefined
}

export function canSetupProviderInline(actions: object): boolean {
  const view = actions as Record<string, unknown>
  return (
    typeof view.providers === 'function' &&
    typeof view.addProvider === 'function' &&
    typeof view.providerModels === 'function' &&
    typeof view.setProviderKey === 'function' &&
    typeof view.removeProvider === 'function'
  )
}

/** The AddProvider form hosted in the first-model dock. */
export function FirstRunAddProvider({
  actions,
  onDone,
}: {
  actions: FirstRunProvidersActions
  onDone: () => void
}) {
  const [view, setView] = useState<ProvidersView | null>(null)
  const [error, setError] = useState('')
  const apply: Apply = promise =>
    translated(promise)
      .then(next => {
        if ((next as ProvidersView | undefined)?.providers) setView(next as ProvidersView)
        // AddProvider treats a truthy apply result as success (same as ProvidersPage's run()).
        return next ?? true
      })
      .catch((failure: unknown) => {
        setError(
          (
            failure as {
              message?: string
            } | null
          )?.message ?? String(failure),
        )
        throw failure
      })
  useEffect(() => {
    let live = true
    void translated(actions.providers())
      .then(next => {
        if (live) setView(next)
      })
      .catch((failure: unknown) => {
        if (live)
          setError(
            (
              failure as {
                message?: string
              } | null
            )?.message ?? String(failure),
          )
      })
    return () => {
      live = false
    }
  }, [])
  if (view === null && error === '') {
    return <div className='bt-set-hint'>{t('Loading…')}</div>
  }
  if (view === null || !view.available) {
    return (
      <div className='bt-set-hint' role='alert'>
        {error !== '' ? error : t('Model providers cannot be set up here.')}
      </div>
    )
  }
  return (
    <div className='bt-model-setup' role='group' aria-label={t('Add a provider')}>
      {error ? (
        <div className='bt-secret-error' role='alert'>
          {error}
        </div>
      ) : null}
      <AddProvider
        view={view}
        apply={apply}
        actions={actions}
        onDone={() => {
          setError('')
          void Promise.resolve(actions.refreshModels?.()).finally(onDone)
        }}
      />
    </div>
  )
}
