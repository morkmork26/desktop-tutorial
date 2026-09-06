import { useEffect, useMemo, useState } from 'react'
import { NativeSong, type NativeTransportSnapshot } from '../native/NativeSong'
import { activeSubdivision, createSteadyBeatMap } from '../domain/timing'
import { BeatGrid } from './BeatGrid'
import styles from '../App.module.css'

const FIXTURE_DURATION_MS = 18_000
const BEATS = createSteadyBeatMap(120, 2_000, FIXTURE_DURATION_MS)
const EMPTY_SNAPSHOT: NativeTransportSnapshot = {
  generation: 0,
  currentTimeMs: 0,
  durationMs: 0,
  paused: true,
  buffering: false,
  playbackRate: 1,
}

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, milliseconds) / 1000
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function AndroidSyncSpike() {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT)
  const [metronome, setMetronome] = useState(true)
  const [loop, setLoop] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useMemo(
    () => activeSubdivision(BEATS, snapshot.currentTimeMs, 4),
    [snapshot.currentTimeMs],
  )
  const beat = active ? (BEATS[active.beatIndex] ?? null) : null

  useEffect(() => {
    let disposed = false
    let removeListener: (() => Promise<void>) | undefined
    void NativeSong.addListener('transportState', (next) => {
      if (!disposed) setSnapshot((current) => next.generation >= current.generation ? next : current)
    }).then((handle) => { removeListener = () => handle.remove() })
    void NativeSong.loadFixture()
      .then((next) => { if (!disposed) setSnapshot(next) })
      .then(() => NativeSong.setMetronome({ enabled: true, volume: 0.5 }))
      .catch((reason: unknown) => { if (!disposed) setError(reason instanceof Error ? reason.message : 'Could not load native fixture.') })
    return () => {
      disposed = true
      if (removeListener) void removeListener()
      void NativeSong.pause()
    }
  }, [])

  const togglePlayback = async () => {
    try {
      setSnapshot(snapshot.paused ? await NativeSong.play() : await NativeSong.pause())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Native playback failed.')
    }
  }

  const toggleMetronome = async () => {
    const enabled = !metronome
    setMetronome(enabled)
    await NativeSong.setMetronome({ enabled, volume: 0.5 })
  }

  const toggleLoop = async () => {
    const enabled = !loop
    setLoop(enabled)
    await NativeSong.setLoop(enabled
      ? { enabled: true, startMs: 6_000, endMs: 10_000 }
      : { enabled: false })
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Android native synchronization spike</p>
          <h1>Hear the beat.<br /><em>Prove the clock.</em></h1>
        </div>
        <div className={styles.clock} aria-live="polite">
          <span>{formatTime(snapshot.currentTimeMs)}</span>
          <small>/ {formatTime(snapshot.durationMs || FIXTURE_DURATION_MS)}</small>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.metaRow}>
          <div>
            <span className={styles.kicker}>Native fixture</span>
            <h2>120 BPM · 4/4 · 2-second intro</h2>
          </div>
          <div className={styles.status}><i />{snapshot.buffering ? 'Buffering' : 'Media3 ready'}</div>
        </div>

        {error && <p role="alert">{error}</p>}
        <input
          aria-label="Seek through fixture"
          className={styles.seek}
          type="range"
          min="0"
          max={snapshot.durationMs || FIXTURE_DURATION_MS}
          step="10"
          value={Math.min(snapshot.currentTimeMs, snapshot.durationMs || FIXTURE_DURATION_MS)}
          onChange={(event) => { void NativeSong.seek({ timeMs: Number(event.currentTarget.value) }) }}
        />

        <div className={styles.practiceGrid}>
          <div className={styles.pulsePanel}>
            <div className={styles.panelTitle}>
              <span>Native player position</span>
              <strong>{beat ? `Beat ${beat.beatInBar}` : 'Intro'}</strong>
            </div>
            <BeatGrid beat={beat} subdivision={active?.subdivision ?? -1} divisions={4} />
          </div>
          <aside className={styles.controls}>
            <button className={styles.play} onClick={() => { void togglePlayback() }}>
              {snapshot.paused ? '▶ Play' : 'Ⅱ Pause'}
            </button>
            <div className={styles.segmented} aria-label="Practice speed">
              {[0.5, 0.75, 1].map((rate) => (
                <button
                  className={snapshot.playbackRate === rate ? styles.selected : ''}
                  key={rate}
                  onClick={() => { void NativeSong.setSpeed({ rate }) }}
                >{rate * 100}%</button>
              ))}
            </div>
            <label className={styles.toggleRow}>
              <span><strong>Metronome</strong><small>Mixed before speed processing</small></span>
              <input type="checkbox" checked={metronome} onChange={() => { void toggleMetronome() }} />
            </label>
            <label className={styles.toggleRow}>
              <span><strong>A/B loop</strong><small>6.0–10.0 seconds</small></span>
              <input type="checkbox" checked={loop} onChange={() => { void toggleLoop() }} />
            </label>
          </aside>
        </div>
      </section>
    </main>
  )
}
