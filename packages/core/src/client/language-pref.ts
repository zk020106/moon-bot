// Interface language preference for this device only (like glass). The window
// boots from this tag; changing it reloads so every view picks up the new copy.
import { STORAGE } from './storage.ts'

export type InterfaceLanguage = 'en' | 'zh'

export const LANGUAGE_EVENT = 'moon-bot:language'

const TAGS: Record<InterfaceLanguage, string> = {
  en: 'en',
  zh: 'zh-CN',
}

export function languageFromTag(tag: string | null | undefined): InterfaceLanguage {
  return /^zh\b/iu.test(String(tag ?? '')) ? 'zh' : 'en'
}

export function readLanguage(
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage,
  fallbackTag: string = typeof navigator !== 'undefined' ? navigator.language : 'en',
): InterfaceLanguage {
  try {
    const saved = storage?.getItem(STORAGE.language)
    if (saved === 'en' || saved === 'zh') return saved
  } catch {
    /* private mode */
  }
  return languageFromTag(fallbackTag)
}

export function languageTag(id: InterfaceLanguage): string {
  return TAGS[id]
}

export function setLanguage(
  id: InterfaceLanguage,
  storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(STORAGE.language, id)
  } catch {
    /* private mode */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = TAGS[id]
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LANGUAGE_EVENT))
}
