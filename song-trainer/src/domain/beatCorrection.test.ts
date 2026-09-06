import { describe, expect, it } from 'vitest'
import { applyGlobalOffset, setDownbeat, tapTempoBeats, validateBeatMap } from './beatCorrection'

describe('beatCorrection', () => {
  it('applies global offset and clamps to zero', () => {
    const beats = [100, 600, 1100]
    expect(applyGlobalOffset(beats, -200)).toEqual([0, 400, 900])
    expect(applyGlobalOffset(beats, 50)).toEqual([150, 650, 1150])
  })

  it('selects the closest beat as downbeat without changing timestamp order', () => {
    const beats = [0, 500, 1000, 1500]
    const result = setDownbeat(beats, 980)
    expect(result).toBe(1000)
    expect(beats).toEqual([0, 500, 1000, 1500])
  })

  it('generates beats from tap tempo', () => {
    const taps = [1000, 1500, 2000]
    const result = tapTempoBeats(taps, 5000)
    expect(result[0]).toBe(1000)
    expect(result.length).toBeGreaterThan(3)
    expect(result[result.length - 1]! <= 5000).toBe(true)
  })

  it('validates beat map errors', () => {
    expect(validateBeatMap([], 5000)).toContain('Beat map is empty.')
    expect(validateBeatMap([-10, 100], 5000)).toEqual(expect.arrayContaining([expect.stringContaining('non-negative')]))
    expect(validateBeatMap([100, 100, 200], 5000)).toEqual(expect.arrayContaining([expect.stringContaining('Duplicate')]))
    expect(validateBeatMap([100, 200, 6000], 5000)).toEqual(expect.arrayContaining([expect.stringContaining('exceeds')]))
    expect(validateBeatMap([100, 500, 1000], 5000)).toEqual([])
  })
})
