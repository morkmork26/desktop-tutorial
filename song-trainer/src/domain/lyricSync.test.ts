import { describe, expect, it } from 'vitest'
import {
  createSyncedLines,
  splitIntoSyllables,
  mergeSyllables,
  splitSyllable,
  applySyncTap,
  nudgeTimestamp,
  clearSyncRange,
} from './lyricSync'
import type { TimedSyllable } from './types'

describe('lyricSync', () => {
  it('creates synced lines preserving structure', () => {
    const lines = createSyncedLines("Hello world\nGoodbye moon")
    expect(lines).toHaveLength(2)
    expect(lines[0]!.tokens).toHaveLength(2)
    expect(lines[0]!.tokens[0]!.text).toBe('Hello')
  })

  it('splits words into syllables', () => {
    expect(splitIntoSyllables('amazing').length).toBeGreaterThanOrEqual(2)
    expect(splitIntoSyllables('go')).toEqual(['go'])
    expect(splitIntoSyllables('I')).toEqual(['I'])
  })

  it('merges adjacent syllables', () => {
    const sylls: TimedSyllable[] = [
      { id: 's0', text: 'hel', timeMs: 100 },
      { id: 's1', text: 'lo', timeMs: 200 },
      { id: 's2', text: 'world', timeMs: 300 },
    ]
    const merged = mergeSyllables(sylls, 0, 1)
    expect(merged).toHaveLength(2)
    expect(merged[0]!.text).toBe('hello')
    expect(merged[0]!.timeMs).toBe(100)
  })

  it('splits a syllable at position', () => {
    const sylls: TimedSyllable[] = [
      { id: 's0', text: 'hello', timeMs: 100 },
    ]
    const split = splitSyllable(sylls, 0, 2)
    expect(split).toHaveLength(2)
    expect(split[0]!.text).toBe('he')
    expect(split[1]!.text).toBe('llo')
  })

  it('applies sync tap at media time', () => {
    const sylls: TimedSyllable[] = [
      { id: 's0', text: 'hel', timeMs: null },
      { id: 's1', text: 'lo', timeMs: null },
    ]
    const synced = applySyncTap(sylls, 0, 1500)
    expect(synced[0]!.timeMs).toBe(1500)
    expect(synced[1]!.timeMs).toBeNull()
  })

  it('nudges timestamp by delta', () => {
    const sylls: TimedSyllable[] = [
      { id: 's0', text: 'hel', timeMs: 1000 },
    ]
    const nudged = nudgeTimestamp(sylls, 0, -50)
    expect(nudged[0]!.timeMs).toBe(950)
  })

  it('clears sync range', () => {
    const sylls: TimedSyllable[] = [
      { id: 's0', text: 'a', timeMs: 100 },
      { id: 's1', text: 'b', timeMs: 200 },
      { id: 's2', text: 'c', timeMs: 300 },
    ]
    const cleared = clearSyncRange(sylls, 0, 1)
    expect(cleared[0]!.timeMs).toBeNull()
    expect(cleared[1]!.timeMs).toBeNull()
    expect(cleared[2]!.timeMs).toBe(300)
  })
})
