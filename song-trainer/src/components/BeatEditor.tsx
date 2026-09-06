import { useCallback, useRef, useState } from 'react'
import { applyGlobalOffset, createCorrection, setDownbeat, tapTempoBeats, validateBeatMap } from '../domain/beatCorrection'
import type { BeatMapCorrection } from '../analysis/types'
import type { Milliseconds } from '../domain/types'
import styles from './BeatEditor.module.css'

interface BeatEditorProps {
  readonly beats: readonly Milliseconds[]
  readonly bpm: number | null
  readonly beatsPerBar: number
  readonly durationMs: Milliseconds
  readonly currentTimeMs: Milliseconds
  readonly onApplyCorrection: (correction: BeatMapCorrection) => void
  readonly onReset: () => void
}

export function BeatEditor({ beats, bpm, beatsPerBar, durationMs, currentTimeMs, onApplyCorrection, onReset }: BeatEditorProps) {
  const [offsetMs, setOffsetMs] = useState(0)
  const [taps, setTaps] = useState<Milliseconds[]>([])
  const [error, setError] = useState<string | null>(null)
  const tapStartRef = useRef(performance.now())

  const handleOffset = useCallback(() => {
    if (offsetMs === 0) return
    const corrected = applyGlobalOffset(beats, offsetMs)
    const errors = validateBeatMap(corrected, durationMs)
    if (errors.length > 0) { setError(errors.join(' ')); return }
    setError(null)
    onApplyCorrection(createCorrection('offset', corrected, bpm, beatsPerBar))
    setOffsetMs(0)
  }, [beats, offsetMs, durationMs, bpm, beatsPerBar, onApplyCorrection])

  const handleSetDownbeat = useCallback(() => {
    const corrected = setDownbeat(beats, currentTimeMs)
    onApplyCorrection(createCorrection('downbeat', corrected, bpm, beatsPerBar))
  }, [beats, currentTimeMs, bpm, beatsPerBar, onApplyCorrection])

  const handleTap = useCallback(() => {
    const now = performance.now()
    if (taps.length === 0) {
      tapStartRef.current = now
      setTaps([0])
    } else {
      setTaps((prev) => [...prev, Math.round(now - tapStartRef.current)])
    }
  }, [taps.length])

  const handleApplyTaps = useCallback(() => {
    if (taps.length < 2) { setError('Tap at least 2 beats.'); return }
    const corrected = tapTempoBeats(taps, durationMs)
    const errors = validateBeatMap(corrected, durationMs)
    if (errors.length > 0) { setError(errors.join(' ')); return }
    const avgInterval = taps.length > 1
      ? taps.slice(1).reduce((sum, t, i) => sum + t - (taps[i] ?? 0), 0) / (taps.length - 1)
      : 500
    const tapBpm = Math.round(60_000 / avgInterval)
    setError(null)
    onApplyCorrection(createCorrection('tap-tempo', corrected, tapBpm, beatsPerBar))
    setTaps([])
  }, [taps, durationMs, beatsPerBar, onApplyCorrection])

  return (
    <div className={styles.editor}>
      <h3 className={styles.title}>Beat Correction</h3>
      <div className={styles.controls}>
        <div className={styles.field}>
          <span className={styles.label}>Global offset (ms)</span>
          <input
            className={styles.input}
            type="number"
            value={offsetMs}
            onChange={(e) => setOffsetMs(Number(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>BPM</span>
          <input className={styles.input} type="text" readOnly value={bpm ?? 'Unknown'} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleOffset}>Apply Offset</button>
        <button className={styles.btn} onClick={handleSetDownbeat}>Set Downbeat Here</button>
        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onReset}>Reset to Detector</button>
      </div>

      <div className={styles.tapArea} onClick={handleTap} onKeyDown={(e) => { if (e.key === ' ') handleTap() }} role="button" tabIndex={0}>
        {taps.length === 0 ? 'Tap to set tempo' : `${taps.length} taps (${taps.length >= 2 ? 'click Apply' : 'keep tapping'})`}
      </div>
      {taps.length >= 2 && (
        <div className={styles.actions} style={{ marginTop: 8 }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleApplyTaps}>Apply Tap Tempo</button>
          <button className={styles.btn} onClick={() => setTaps([])}>Clear Taps</button>
        </div>
      )}

      {error && <p className={styles.info} style={{ color: '#e87461' }}>{error}</p>}
      <p className={styles.info}>{beats.length} beats · {beatsPerBar}/4 meter · version preserved</p>
    </div>
  )
}
