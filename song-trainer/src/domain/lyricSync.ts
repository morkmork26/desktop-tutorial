import type { Milliseconds, TimedSyllable } from './types'

export interface SyncedLine {
  readonly id: string
  readonly text: string
  readonly tokens: readonly SyncedToken[]
  readonly ordinal: number
}

export interface SyncedToken {
  readonly id: string
  readonly text: string
  readonly normalized: string
  readonly syllables: readonly TimedSyllable[]
}

export function createSyncedLines(rawText: string): SyncedLine[] {
  const lines = rawText.replaceAll('\r\n', '\n').split('\n')
  return lines.map((lineText, lineIndex) => {
    const words = [...lineText.matchAll(/\S+/gu)]
    const tokens: SyncedToken[] = words.map((match, tokenIndex) => {
      const text = match[0]
      const syllables = splitIntoSyllables(text).map((syllText, syllIndex) => ({
        id: `l${lineIndex}-t${tokenIndex}-s${syllIndex}`,
        text: syllText,
        timeMs: null,
      }))
      return {
        id: `l${lineIndex}-t${tokenIndex}`,
        text,
        normalized: text.toLocaleLowerCase().replace(/(^[^\p{L}\p{N}]+|[^\p{L}\p{N}''-]+$)/gu, ''),
        syllables,
      }
    })
    return {
      id: `line-${lineIndex}`,
      text: lineText,
      tokens,
      ordinal: lineIndex,
    }
  })
}

export function splitIntoSyllables(word: string): string[] {
  const clean = word.replace(/[^\p{L}]/gu, '')
  if (clean.length <= 2) return [word]
  const parts = clean.split(/(?<=[aeiouy])(?=[^aeiouy])/i).filter(Boolean)
  if (parts.length <= 1) return [word]
  return parts
}

export function mergeSyllables(syllables: readonly TimedSyllable[], startIdx: number, endIdx: number): TimedSyllable[] {
  if (startIdx < 0 || endIdx >= syllables.length || startIdx >= endIdx) return [...syllables]
  const merged: TimedSyllable = {
    id: syllables[startIdx]!.id,
    text: syllables.slice(startIdx, endIdx + 1).map((s) => s.text).join(''),
    timeMs: syllables[startIdx]!.timeMs,
  }
  return [...syllables.slice(0, startIdx), merged, ...syllables.slice(endIdx + 1)]
}

export function splitSyllable(syllables: readonly TimedSyllable[], idx: number, splitAt: number): TimedSyllable[] {
  const syll = syllables[idx]
  if (!syll || splitAt <= 0 || splitAt >= syll.text.length) return [...syllables]
  const left: TimedSyllable = { id: syll.id, text: syll.text.slice(0, splitAt), timeMs: syll.timeMs }
  const right: TimedSyllable = { id: `${syll.id}-split`, text: syll.text.slice(splitAt), timeMs: null }
  return [...syllables.slice(0, idx), left, right, ...syllables.slice(idx + 1)]
}

export function applySyncTap(
  syllables: readonly TimedSyllable[],
  syllableIndex: number,
  timeMs: Milliseconds,
): TimedSyllable[] {
  return syllables.map((s, i) =>
    i === syllableIndex ? { ...s, timeMs } : s,
  )
}

export function nudgeTimestamp(
  syllables: readonly TimedSyllable[],
  syllableIndex: number,
  deltaMs: number,
): TimedSyllable[] {
  const syll = syllables[syllableIndex]
  if (!syll?.timeMs) return [...syllables]
  return syllables.map((s, i) =>
    i === syllableIndex ? { ...s, timeMs: Math.max(0, (s.timeMs ?? 0) + deltaMs) } : s,
  )
}

export function clearSyncRange(
  syllables: readonly TimedSyllable[],
  startIdx: number,
  endIdx: number,
): TimedSyllable[] {
  return syllables.map((s, i) =>
    i >= startIdx && i <= endIdx ? { ...s, timeMs: null } : s,
  )
}
