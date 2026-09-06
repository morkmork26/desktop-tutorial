import type { Milliseconds } from './types'
import type { BeatMapCorrection } from '../analysis/types'

export function applyGlobalOffset(beats: readonly Milliseconds[], offsetMs: number): Milliseconds[] {
  return beats.map((t) => Math.max(0, Math.round(t + offsetMs)))
}

export function setDownbeat(beats: readonly Milliseconds[], downbeatTimeMs: Milliseconds): Milliseconds | null {
  const sorted = [...beats].sort((a, b) => a - b)
  if (sorted.length === 0) return null
  return sorted.reduce((prev, curr) =>
    Math.abs(curr - downbeatTimeMs) < Math.abs(prev - downbeatTimeMs) ? curr : prev,
  sorted[0] ?? 0)
}

export function tapTempoBeats(taps: readonly Milliseconds[], durationMs: Milliseconds): Milliseconds[] {
  if (taps.length < 2) return [...taps]
  const intervals = taps.slice(1).map((t, i) => t - (taps[i] ?? 0))
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  if (avgInterval <= 0) return [...taps]

  const firstTap = taps[0] ?? 0
  const beats: Milliseconds[] = []
  for (let t = firstTap; t <= durationMs; t += avgInterval) {
    beats.push(Math.round(t))
  }
  return beats
}

export function validateBeatMap(beats: readonly Milliseconds[], durationMs: Milliseconds): string[] {
  const errors: string[] = []
  if (beats.length === 0) errors.push('Beat map is empty.')
  const sorted = [...beats].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if ((sorted[i] ?? 0) < 0) { errors.push('Beat timestamps must be non-negative.'); break }
    if ((sorted[i] ?? 0) > durationMs) { errors.push('Beat timestamp exceeds song duration.'); break }
  }
  const unique = new Set(sorted)
  if (unique.size !== sorted.length) errors.push('Duplicate beat timestamps found.')
  return errors
}

export function createCorrection(
  type: BeatMapCorrection['type'],
  beats: readonly Milliseconds[],
  bpm: number | null,
  beatsPerBar: number,
  downbeatTimeMs: Milliseconds | null = beats[0] ?? null,
): BeatMapCorrection {
  return { type, beats: [...beats].sort((a, b) => a - b), bpm, beatsPerBar, downbeatTimeMs }
}
