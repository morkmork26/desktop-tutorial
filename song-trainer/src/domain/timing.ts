import type { Beat, LoopRange, Milliseconds, TimedSyllable } from './types'

export const toMilliseconds = (seconds: number): Milliseconds => Math.round(seconds * 1000)
export const toSeconds = (milliseconds: Milliseconds): number => milliseconds / 1000

export function createSteadyBeatMap(
  bpm: number,
  firstBeatMs: Milliseconds,
  durationMs: Milliseconds,
  beatsPerBar = 4,
): Beat[] {
  if (!Number.isFinite(bpm) || bpm <= 0 || beatsPerBar < 1) return []
  const intervalMs = 60_000 / bpm
  const beats: Beat[] = []
  for (let time = firstBeatMs, index = 0; time <= durationMs; time += intervalMs, index += 1) {
    const beatInBar = (index % beatsPerBar) + 1
    beats.push({
      id: `beat-${index}`,
      timeMs: Math.round(time),
      beatInBar,
      isDownbeat: beatInBar === 1,
    })
  }
  return beats
}

export function activeBeatIndex(beats: readonly Beat[], mediaTimeMs: Milliseconds): number {
  if (beats.length === 0 || mediaTimeMs < (beats[0]?.timeMs ?? 0)) return -1
  let low = 0
  let high = beats.length - 1
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const beat = beats[middle]
    if (!beat) break
    if (beat.timeMs <= mediaTimeMs) low = middle + 1
    else high = middle - 1
  }
  return high
}

export function activeSubdivision(
  beats: readonly Beat[],
  mediaTimeMs: Milliseconds,
  divisions: 1 | 2 | 4,
): { beatIndex: number; subdivision: number } | null {
  const beatIndex = activeBeatIndex(beats, mediaTimeMs)
  const beat = beats[beatIndex]
  if (!beat) return null
  const next = beats[beatIndex + 1]
  const prior = beats[beatIndex - 1]
  const interval = next
    ? next.timeMs - beat.timeMs
    : prior
      ? beat.timeMs - prior.timeMs
      : 500
  const elapsed = Math.max(0, mediaTimeMs - beat.timeMs)
  return { beatIndex, subdivision: Math.min(divisions - 1, Math.floor((elapsed / interval) * divisions)) }
}

export function validateLoop(loop: LoopRange, durationMs: Milliseconds): string | null {
  if (!Number.isInteger(loop.startMs) || !Number.isInteger(loop.endMs)) return 'Loop times must use whole milliseconds.'
  if (loop.startMs < 0 || loop.endMs > durationMs) return 'Loop must stay inside the song.'
  if (loop.endMs - loop.startMs < 250) return 'Loop must be at least 250 ms long.'
  return null
}

export function activeSyllableIndex(
  syllables: readonly TimedSyllable[],
  mediaTimeMs: Milliseconds,
): number {
  let active = -1
  syllables.forEach((syllable, index) => {
    if (syllable.timeMs !== null && syllable.timeMs <= mediaTimeMs) active = index
  })
  return active
}
