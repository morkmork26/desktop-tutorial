import { describe, expect, it } from 'vitest'
import { createSection, validateSection, reorderSections } from './sections'

describe('sections', () => {
  it('creates a section with ordinal', () => {
    const s = createSection('Chorus', 5000, 15000, [])
    expect(s.name).toBe('Chorus')
    expect(s.ordinal).toBe(0)
  })

  it('validates section bounds', () => {
    expect(validateSection({ startMs: -1, endMs: 5000 }, 10000)).toMatch(/non-negative/)
    expect(validateSection({ startMs: 0, endMs: 11000 }, 10000)).toMatch(/exceeds/)
    expect(validateSection({ startMs: 5000, endMs: 5000 }, 10000)).toMatch(/after start/)
    expect(validateSection({ startMs: 0, endMs: 100 }, 10000)).toMatch(/500ms/)
    expect(validateSection({ startMs: 0, endMs: 5000 }, 10000)).toBeNull()
  })

  it('reorders sections', () => {
    const sections = [
      { id: 'a', name: 'A', ordinal: 0, startMs: 0, endMs: 5000 },
      { id: 'b', name: 'B', ordinal: 1, startMs: 5000, endMs: 10000 },
      { id: 'c', name: 'C', ordinal: 2, startMs: 10000, endMs: 15000 },
    ]
    const reordered = reorderSections(sections, 2, 0)
    expect(reordered.map((s) => s.name)).toEqual(['C', 'A', 'B'])
    expect(reordered.map((s) => s.ordinal)).toEqual([0, 1, 2])
  })
})
