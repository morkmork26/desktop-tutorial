import type { Milliseconds } from './types'

export interface PracticeSession {
  readonly id: string
  readonly projectId: string
  readonly startedAt: string
  readonly endedAt: string | null
  readonly practicedMs: Milliseconds
  readonly difficultSectionId: string | null
}

export interface PracticeStats {
  readonly totalSessions: number
  readonly totalPracticedMs: Milliseconds
  readonly lastSessionAt: string | null
  readonly difficultSectionIds: readonly string[]
}

export function computeStats(sessions: readonly PracticeSession[]): PracticeStats {
  const total = sessions.reduce((sum, s) => sum + s.practicedMs, 0)
  const last = sessions.length > 0
    ? sessions.reduce((latest, s) => s.startedAt > latest ? s.startedAt : latest, '')
    : null
  const difficult = [...new Set(
    sessions.filter((s) => s.difficultSectionId).map((s) => s.difficultSectionId!),
  )]
  return {
    totalSessions: sessions.length,
    totalPracticedMs: total,
    lastSessionAt: last,
    difficultSectionIds: difficult,
  }
}

export function formatPracticeTime(ms: Milliseconds): string {
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}
