import assert from 'node:assert/strict'
import { test } from 'node:test'
import { languageFromTag, languageTag, readLanguage, setLanguage } from '../src/client/language-pref.ts'

test('languageFromTag maps zh* to zh and everything else to en', () => {
  assert.equal(languageFromTag('zh-CN'), 'zh')
  assert.equal(languageFromTag('zh'), 'zh')
  assert.equal(languageFromTag('en-US'), 'en')
  assert.equal(languageFromTag(undefined), 'en')
})

test('readLanguage prefers a saved preference over the fallback tag', () => {
  const store = new Map<string, string>()
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
  assert.equal(readLanguage(storage, 'zh-CN'), 'zh')
  setLanguage('en', storage)
  assert.equal(readLanguage(storage, 'zh-CN'), 'en')
  assert.equal(languageTag('zh'), 'zh-CN')
})
