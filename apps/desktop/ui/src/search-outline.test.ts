import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { OUTLINE_CAP, appendOutline, outlineFromItems } from './search-outline.ts'

describe('search-outline', () => {
  it('appends instead of replacing, and caps the newest lines', () => {
    let outline = appendOutline(undefined, 'prompt', 'bodydebug 1')
    outline = appendOutline(outline, 'response', '1')
    outline = appendOutline(outline, 'prompt', 'bodydebug 2')
    assert.equal(outline.length, 3)
    assert.match(outline[0]!.prompt ?? '', /bodydebug 1/)
    assert.equal(outline[1]!.response, '1')
    assert.match(outline[2]!.prompt ?? '', /bodydebug 2/)

    for (let i = 0; i < OUTLINE_CAP + 5; i += 1) {
      outline = appendOutline(outline, 'prompt', `msg ${i}`)
    }
    assert.equal(outline.length, OUTLINE_CAP)
    assert.match(outline.at(-1)!.prompt ?? '', /msg \d+/)
    assert.ok(!(outline[0]!.prompt ?? '').includes('bodydebug 1'))
  })

  it('builds an outline from loaded chat items', () => {
    const outline = outlineFromItems([
      { kind: 'user', text: 'bodydebug 5: reply with only the digit 5' },
      { kind: 'bot', text: '5' },
      { kind: 'system', text: 'ignore' },
      { kind: 'user', text: '  ' },
    ])
    assert.equal(outline.length, 2)
    assert.match(outline[0]!.prompt ?? '', /bodydebug 5/)
    assert.equal(outline[1]!.response, '5')
  })
})
