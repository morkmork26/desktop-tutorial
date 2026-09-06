import { useCallback, useState } from 'react'
import { createSyncedLines, applySyncTap, nudgeTimestamp, clearSyncRange } from '../domain/lyricSync'
import type { SyncedLine } from '../domain/lyricSync'
import type { Milliseconds, TimedSyllable } from '../domain/types'
import { activeSyllableIndex } from '../domain/timing'
import styles from './LyricSync.module.css'

interface LyricSyncProps {
  readonly currentTimeMs: Milliseconds
  readonly onSeek: (timeMs: Milliseconds) => void
  readonly initialLines?: readonly SyncedLine[]
  readonly onLinesChange?: (lines: readonly SyncedLine[]) => void
}

export function LyricSync({ currentTimeMs, onSeek, initialLines = [], onLinesChange }: LyricSyncProps) {
  const [rawText, setRawText] = useState(() => initialLines.map((line) => line.text).join('\n'))
  const [lines, setLines] = useState<SyncedLine[]>(() => [...structuredClone(initialLines)])
  const [syncing, setSyncing] = useState(false)
  const [syncCursor, setSyncCursor] = useState(0)

  const handlePaste = useCallback((text: string) => {
    setRawText(text)
    const next = createSyncedLines(text)
    setLines(next)
    onLinesChange?.(next)
    setSyncCursor(0)
  }, [onLinesChange])

  const allSyllables = lines.flatMap((l) => l.tokens.flatMap((t) => t.syllables))
  const activeIdx = activeSyllableIndex(allSyllables, currentTimeMs)

  const rebuildFromFlat = useCallback((flat: TimedSyllable[]) => {
    let idx = 0
    setLines((prev) => {
      const next = prev.map((line) => ({
        ...line,
        tokens: line.tokens.map((token) => ({
          ...token,
          syllables: token.syllables.map(() => flat[idx++]!),
        })),
      }))
      onLinesChange?.(next)
      return next
    })
  }, [onLinesChange])

  const handleSyncTap = useCallback(() => {
    if (!syncing || syncCursor >= allSyllables.length) return
    const updated = applySyncTap(allSyllables, syncCursor, currentTimeMs)
    rebuildFromFlat(updated)
    setSyncCursor((c) => c + 1)
  }, [syncing, syncCursor, allSyllables, currentTimeMs, rebuildFromFlat])

  const handleNudge = useCallback((idx: number, delta: number) => {
    const updated = nudgeTimestamp(allSyllables, idx, delta)
    rebuildFromFlat(updated)
  }, [allSyllables, rebuildFromFlat])

  const handleClearAll = useCallback(() => {
    const updated = clearSyncRange(allSyllables, 0, allSyllables.length - 1)
    rebuildFromFlat(updated)
    setSyncCursor(0)
  }, [allSyllables, rebuildFromFlat])

  const handleTokenClick = useCallback((syll: TimedSyllable) => {
    if (syll.timeMs !== null) onSeek(syll.timeMs)
  }, [onSeek])

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Lyrics</h3>

      {lines.length === 0 ? (
        <textarea
          className={styles.textarea}
          placeholder="Paste lyrics here..."
          value={rawText}
          onChange={(e) => handlePaste(e.target.value)}
        />
      ) : (
        <>
          <div className={styles.lines}>
            {lines.map((line) => (
              <div key={line.id} className={styles.line}>
                <div className={styles.lineNumber}>Line {line.ordinal + 1}</div>
                <div className={styles.tokens}>
                  {line.tokens.map((token) =>
                    token.syllables.map((syll, si) => {
                      const flatIdx = allSyllables.indexOf(syll)
                      const isSynced = syll.timeMs !== null
                      const isActive = flatIdx === activeIdx
                      const isCursor = syncing && flatIdx === syncCursor
                      return (
                        <span
                          key={`${token.id}-${si}`}
                          className={`${styles.token} ${isSynced ? styles.synced : styles.unsynced} ${isActive ? styles.active : ''} ${isCursor ? styles.active : ''}`}
                          onClick={() => handleTokenClick(syll)}
                          onContextMenu={(e) => { e.preventDefault(); handleNudge(flatIdx, 25) }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') handleNudge(flatIdx, -25)
                            if (e.key === 'ArrowRight') handleNudge(flatIdx, 25)
                          }}
                          title={syll.timeMs !== null ? `${syll.timeMs}ms` : 'unsynced'}
                        >
                          {syll.text}
                        </span>
                      )
                    }),
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${syncing ? '' : styles.btnSync}`}
              onClick={() => { setSyncing(!syncing); if (!syncing) setSyncCursor(0) }}
            >
              {syncing ? 'Stop Sync' : 'Start Tap Sync'}
            </button>
            {syncing && (
              <button className={`${styles.btn} ${styles.btnSync}`} onClick={handleSyncTap}>
                Tap ({syncCursor}/{allSyllables.length})
              </button>
            )}
            <button className={styles.btn} onClick={handleClearAll}>Clear Timing</button>
            <button className={styles.btn} onClick={() => { setLines([]); setRawText(''); onLinesChange?.([]) }}>Edit Text</button>
          </div>
          <p className={styles.hint}>
            {syncing ? 'Press Tap or Space while playing to sync each syllable' : 'Click synced syllables to seek. Arrow keys nudge ±25ms.'}
          </p>
        </>
      )}
    </div>
  )
}
