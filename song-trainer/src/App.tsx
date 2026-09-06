import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioTransport } from './audio/AudioTransport'
import { MetronomeScheduler } from './audio/MetronomeScheduler'
import { useTransport } from './audio/useTransport'
import { BeatGrid } from './components/BeatGrid'
import { Waveform } from './components/Waveform'
import { LibraryView } from './components/library/LibraryView'
import { activeSubdivision, createSteadyBeatMap, validateLoop } from './domain/timing'
import { useAppStore } from './stores/useAppStore'
import { MemoryProjectRepository } from './repositories/MemoryProjectRepository'
import { createImportAdapter } from './adapters/importAdapter'
import type { LoopRange } from './domain/types'
import styles from './App.module.css'

const FIXTURE_DURATION_MS = 18_000
const FIXTURE_BEATS = createSteadyBeatMap(120, 2_000, FIXTURE_DURATION_MS)
const SPEEDS = [0.5, 0.75, 1] as const

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, milliseconds) / 1000
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

function SyncLab() {
  const transport = useMemo(() => new AudioTransport(), [])
  const snapshot = useTransport(transport)
  const beatsRef = useRef(FIXTURE_BEATS)
  const metronome = useMemo(() => new MetronomeScheduler(transport, () => beatsRef.current), [transport])
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [divisions, setDivisions] = useState<1 | 2 | 4>(4)
  const [loop, setLoop] = useState<LoopRange | null>({ startMs: 6_000, endMs: 10_000 })
  const [status, setStatus] = useState('Fixture ready')
  const closeProject = useAppStore((s) => s.closeProject)

  useEffect(() => {
    transport.load('/fixtures/120-bpm-accented.wav')
    return () => {
      metronome.destroy()
      transport.destroy()
    }
  }, [metronome, transport])

  useEffect(() => {
    transport.setLoop(loop)
    if (metronomeOn) metronome.rebuild()
  }, [loop, metronome, metronomeOn, transport])

  useEffect(() => {
    const media = transport.media
    const rebuild = () => metronome.rebuild()
    media.addEventListener('seeked', rebuild)
    media.addEventListener('ratechange', rebuild)
    media.addEventListener('pause', rebuild)
    media.addEventListener('play', rebuild)
    return () => {
      media.removeEventListener('seeked', rebuild)
      media.removeEventListener('ratechange', rebuild)
      media.removeEventListener('pause', rebuild)
      media.removeEventListener('play', rebuild)
    }
  }, [metronome, transport])

  const active = activeSubdivision(FIXTURE_BEATS, snapshot.currentTimeMs, divisions)
  const beat = active ? (FIXTURE_BEATS[active.beatIndex] ?? null) : null
  const effectiveDuration = snapshot.durationMs || FIXTURE_DURATION_MS

  const togglePlayback = async () => {
    try {
      if (snapshot.paused) {
        await transport.play()
        if (metronomeOn) await metronome.start()
        setStatus('Playing from the media clock')
      } else {
        transport.pause()
        metronome.stop()
        setStatus('Paused — stored timing unchanged')
      }
    } catch {
      setStatus('Audio could not start. Regenerate fixtures and try again.')
    }
  }

  const toggleMetronome = async () => {
    const next = !metronomeOn
    setMetronomeOn(next)
    if (next && !snapshot.paused) await metronome.start()
    else metronome.stop()
  }

  const updateLoop = (next: LoopRange) => {
    const error = validateLoop(next, effectiveDuration)
    if (error) return setStatus(error)
    setLoop(next)
    setStatus(`Loop ${formatTime(next.startMs)}–${formatTime(next.endMs)}`)
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            <button
              onClick={closeProject}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >← Library</button>
            {' · '}synchronization lab
          </p>
          <h1>Feel the phrase.<br /><em>See the pocket.</em></h1>
        </div>
        <div className={styles.clock} aria-live="polite">
          <span>{formatTime(snapshot.currentTimeMs)}</span>
          <small>/ {formatTime(effectiveDuration)}</small>
        </div>
      </header>

      <section className={styles.workspace}>
        <div className={styles.metaRow}>
          <div>
            <span className={styles.kicker}>Timing fixture</span>
            <h2>120 BPM · 4/4 · 2-second intro</h2>
          </div>
          <div className={styles.status}><i />{status}</div>
        </div>

        <Waveform
          transport={transport}
          beats={FIXTURE_BEATS}
          durationMs={effectiveDuration}
          currentTimeMs={snapshot.currentTimeMs}
          loop={loop}
          onLoopChange={updateLoop}
        />

        <input
          aria-label="Seek through song"
          className={styles.seek}
          type="range"
          min="0"
          max={effectiveDuration}
          step="10"
          value={Math.min(snapshot.currentTimeMs, effectiveDuration)}
          onChange={(event) => transport.seek(Number(event.currentTarget.value))}
        />

        <div className={styles.practiceGrid}>
          <div className={styles.pulsePanel}>
            <div className={styles.panelTitle}>
              <span>Active subdivision</span>
              <strong>{beat ? `Bar ${Math.floor((active?.beatIndex ?? 0) / 4) + 1} · Beat ${beat.beatInBar}` : 'Intro'}</strong>
            </div>
            <BeatGrid beat={beat} subdivision={active?.subdivision ?? -1} divisions={divisions} />
            <div className={styles.segmented} aria-label="Subdivision">
              {([1, 2, 4] as const).map((value) => (
                <button className={divisions === value ? styles.selected : ''} key={value} onClick={() => setDivisions(value)}>
                  {value === 1 ? 'Quarter' : value === 2 ? 'Eighth' : 'Sixteenth'}
                </button>
              ))}
            </div>
          </div>

          <aside className={styles.controls}>
            <button className={styles.play} onClick={() => void togglePlayback()}>
              <span>{snapshot.paused ? '▶' : 'Ⅱ'}</span>{snapshot.paused ? 'Play fixture' : 'Pause'}
            </button>

            <label className={styles.controlGroup}>
              <span>Practice speed</span>
              <div className={styles.segmented}>
                {SPEEDS.map((speed) => (
                  <button
                    className={snapshot.playbackRate === speed ? styles.selected : ''}
                    key={speed}
                    onClick={() => transport.setPlaybackRate(speed)}
                  >{speed * 100}%</button>
                ))}
              </div>
            </label>

            <label className={styles.toggleRow}>
              <span><strong>Metronome</strong><small>Web Audio lookahead</small></span>
              <input type="checkbox" checked={metronomeOn} onChange={() => void toggleMetronome()} />
            </label>

            <label className={styles.toggleRow}>
              <span><strong>Phrase loop</strong><small>6.0–10.0 seconds</small></span>
              <input type="checkbox" checked={loop !== null} onChange={() => setLoop(loop ? null : { startMs: 6_000, endMs: 10_000 })} />
            </label>
          </aside>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Stored markers: {FIXTURE_BEATS.length} integer timestamps</span>
        <span>Pitch preservation: requested · Windows QA pending</span>
        <span>Canonical clock: media.currentTime</span>
      </footer>
    </main>
  )
}

const importAdapter = createImportAdapter()

export default function App() {
  const view = useAppStore((s) => s.view)
  const repository = useAppStore((s) => s.repository)
  const setRepository = useAppStore((s) => s.setRepository)

  useEffect(() => {
    if (!repository) {
      if ('__TAURI_INTERNALS__' in window) {
        void Promise.all([
          import('@tauri-apps/plugin-sql'),
          import('./repositories/SqlProjectRepository'),
        ]).then(([mod, { SqlProjectRepository }]) => {
          void mod.default.load('sqlite:rhythm-song-trainer.sqlite').then(() => {
            setRepository(new SqlProjectRepository(mod.default as unknown as ConstructorParameters<typeof SqlProjectRepository>[0]))
          })
        })
      } else {
        setRepository(new MemoryProjectRepository())
      }
    }
  }, [repository, setRepository])

  if (view === 'library') return <LibraryView importAdapter={importAdapter} />
  return <SyncLab />
}
