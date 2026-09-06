import { useMemo } from 'react'
import type { SyncedLine } from '../domain/lyricSync'
import type { Section } from '../domain/sections'
import type { PracticeSession } from '../domain/practiceSession'
import { computeStats, formatPracticeTime } from '../domain/practiceSession'
import { activeSyllableIndex } from '../domain/timing'
import type { Milliseconds } from '../domain/types'
import styles from './PracticeView.module.css'

interface PracticeViewProps {
  readonly lines: readonly SyncedLine[]
  readonly sections: readonly Section[]
  readonly sessions: readonly PracticeSession[]
  readonly currentTimeMs: Milliseconds
  readonly onSeekToSection: (section: Section) => void
}

export function PracticeView({ lines, sections, sessions, currentTimeMs, onSeekToSection }: PracticeViewProps) {
  const allSyllables = useMemo(
    () => lines.flatMap((l) => l.tokens.flatMap((t) => t.syllables)),
    [lines],
  )
  const activeIdx = activeSyllableIndex(allSyllables, currentTimeMs)
  const stats = useMemo(() => computeStats(sessions), [sessions])

  const activeSection = sections.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs,
  )

  let flatIndex = 0

  return (
    <div className={styles.practice}>
      <h3 className={styles.title}>Practice</h3>

      <div className={styles.lyricDisplay}>
        {lines.map((line) => {
          const lineHasActive = line.tokens.some((t) =>
            t.syllables.some(() => {
              const idx = allSyllables.indexOf(t.syllables[0]!)
              return idx >= 0 && Math.abs(idx - activeIdx) < t.syllables.length
            }),
          )
          return (
            <div key={line.id} className={`${styles.lyricLine} ${lineHasActive ? styles.lyricLineActive : ''}`}>
              {line.tokens.map((token) => (
                <span key={token.id}>
                  {token.syllables.map((syll) => {
                    const myIdx = flatIndex++
                    const isActive = myIdx === activeIdx
                    return (
                      <span key={syll.id} className={`${styles.syllable} ${isActive ? styles.syllableActive : ''}`}>
                        {syll.text}
                      </span>
                    )
                  })}
                  {' '}
                </span>
              ))}
            </div>
          )
        })}
        {lines.length === 0 && <p style={{ color: 'var(--muted)' }}>No lyrics synced yet</p>}
      </div>

      {sections.length > 0 && (
        <div className={styles.sectionNav}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`${styles.sectionBtn} ${activeSection?.id === section.id ? styles.sectionActive : ''}`}
              onClick={() => onSeekToSection(section)}
            >{section.name}</button>
          ))}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span>Sessions</span>
          <span className={styles.statValue}>{stats.totalSessions}</span>
        </div>
        <div className={styles.statRow}>
          <span>Total practice</span>
          <span className={styles.statValue}>{formatPracticeTime(stats.totalPracticedMs)}</span>
        </div>
        {stats.lastSessionAt && (
          <div className={styles.statRow}>
            <span>Last session</span>
            <span className={styles.statValue}>{new Date(stats.lastSessionAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
