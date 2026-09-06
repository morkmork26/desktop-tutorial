import { describe, expect, it } from 'vitest'
import { computeStats, formatPracticeTime } from './practiceSession'
import type { PracticeSession } from './practiceSession'

describe('practiceSession', () => {
  it('computes stats from sessions', () => {
    const sessions: PracticeSession[] = [
      { id: '1', projectId: 'p1', startedAt: '2026-01-01T10:00:00Z', endedAt: '2026-01-01T10:30:00Z', practicedMs: 1_800_000, difficultSectionId: 's1' },
      { id: '2', projectId: 'p1', startedAt: '2026-01-02T10:00:00Z', endedAt: '2026-01-02T10:15:00Z', practicedMs: 900_000, difficultSectionId: null },
    ]
    const stats = computeStats(sessions)
    expect(stats.totalSessions).toBe(2)
    expect(stats.totalPracticedMs).toBe(2_700_000)
    expect(stats.difficultSectionIds).toEqual(['s1'])
  })

  it('formats practice time', () => {
    expect(formatPracticeTime(90_000)).toBe('1m')
    expect(formatPracticeTime(3_660_000)).toBe('1h 1m')
  })

  it('handles empty sessions', () => {
    const stats = computeStats([])
    expect(stats.totalSessions).toBe(0)
    expect(stats.lastSessionAt).toBeNull()
  })
})
