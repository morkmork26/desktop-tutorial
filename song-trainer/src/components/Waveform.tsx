import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import type { AudioTransport } from '../audio/AudioTransport'
import type { Beat, LoopRange } from '../domain/types'
import styles from './Waveform.module.css'

interface WaveformProps {
  readonly transport: AudioTransport
  readonly beats: readonly Beat[]
  readonly durationMs: number
  readonly currentTimeMs: number
  readonly loop: LoopRange | null
  readonly onLoopChange: (loop: LoopRange) => void
}

export function Waveform({ transport, beats, durationMs, currentTimeMs, loop, onLoopChange }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      media: transport.media,
      height: 136,
      waveColor: '#6c675f',
      progressColor: '#f3b562',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      interact: true,
    })
    return () => wavesurfer.destroy()
  }, [transport])

  const safeDuration = Math.max(durationMs, 1)
  const loopLeft = loop ? `${(loop.startMs / safeDuration) * 100}%` : '0%'
  const loopWidth = loop ? `${((loop.endMs - loop.startMs) / safeDuration) * 100}%` : '0%'

  const updateBoundary = (which: 'start' | 'end', clientX: number) => {
    if (!loop || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const percent = ((clientX - rect.left) / rect.width) * 100
    const timeMs = Math.round(Math.max(0, Math.min(100, percent)) / 100 * safeDuration)
    onLoopChange(which === 'start'
      ? { startMs: Math.min(timeMs, loop.endMs - 250), endMs: loop.endMs }
      : { startMs: loop.startMs, endMs: Math.max(timeMs, loop.startMs + 250) })
  }

  return (
    <div className={styles.shell} aria-label="Song waveform and beat map">
      <div ref={containerRef} className={styles.wave} />
      <div className={styles.markers} aria-hidden="true">
        {beats.map((beat) => (
          <span
            className={beat.isDownbeat ? styles.downbeat : styles.beat}
            key={beat.id}
            style={{ left: `${(beat.timeMs / safeDuration) * 100}%` }}
          />
        ))}
      </div>
      {loop && (
        <div className={styles.loop} style={{ left: loopLeft, width: loopWidth }}>
          <button
            aria-label="Move loop start"
            className={styles.handle}
            onPointerUp={(event) => updateBoundary('start', event.clientX)}
          />
          <button
            aria-label="Move loop end"
            className={`${styles.handle} ${styles.endHandle}`}
            onPointerUp={(event) => updateBoundary('end', event.clientX)}
          />
        </div>
      )}
      <div className={styles.playhead} style={{ left: `${(currentTimeMs / safeDuration) * 100}%` }} />
    </div>
  )
}
