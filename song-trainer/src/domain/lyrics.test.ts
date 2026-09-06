import { describe, expect, it } from 'vitest'
import { tokenizeLyrics } from './lyrics'

describe('tokenizeLyrics', () => {
  it('preserves punctuation, apostrophes, internal hyphens, and line membership', () => {
    const tokens = tokenizeLyrics("Don't stop—\nhold-on, singer!")
    expect(tokens.map((token) => token.text)).toEqual(["Don't", 'stop—', 'hold-on,', 'singer!'])
    expect(tokens.map((token) => token.normalized)).toEqual(["don't", 'stop', 'hold-on', 'singer'])
    expect(tokens.map((token) => token.lineIndex)).toEqual([0, 0, 1, 1])
  })
})
