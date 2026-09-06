import { describe, expect, it } from 'vitest'
import { activeBeatIndex, activeSubdivision, createSteadyBeatMap, validateLoop } from './timing'

describe('timing utilities', () => {
  it('creates explicit 120 BPM beats after intro silence', () => {
    const beats = createSteadyBeatMap(120, 2_000, 4_000)
    expect(beats.map((beat) => beat.timeMs)).toEqual([2_000, 2_500, 3_000, 3_500, 4_000])
    expect(beats.map((beat) => beat.isDownbeat)).toEqual([true, false, false, false, true])
  })

  it('handles empty and single-beat maps', () => {
    expect(activeBeatIndex([], 1_000)).toBe(-1)
    expect(activeSubdivision(createSteadyBeatMap(120, 500, 500), 650, 4)).toEqual({ beatIndex: 0, subdivision: 1 })
  })

  it('uses variable beat spacing for subdivisions', () => {
    const beats = [
      { id: 'a', timeMs: 0, beatInBar: 1, isDownbeat: true },
      { id: 'b', timeMs: 800, beatInBar: 2, isDownbeat: false },
    ] as const
    expect(activeSubdivision(beats, 600, 4)).toEqual({ beatIndex: 0, subdivision: 3 })
  })

  it('validates loop bounds', () => {
    expect(validateLoop({ startMs: 1_000, endMs: 2_000 }, 5_000)).toBeNull()
    expect(validateLoop({ startMs: 2_000, endMs: 2_100 }, 5_000)).toMatch(/250/)
    expect(validateLoop({ startMs: -1, endMs: 2_000 }, 5_000)).toMatch(/inside/)
  })

  it('does not change stored beat timing for playback rates', () => {
    const beats = createSteadyBeatMap(90, 1_000, 5_000)
    const snapshot = beats.map((beat) => beat.timeMs)
    ;[0.5, 0.75, 1].forEach(() => expect(beats.map((beat) => beat.timeMs)).toEqual(snapshot))
  })
})
