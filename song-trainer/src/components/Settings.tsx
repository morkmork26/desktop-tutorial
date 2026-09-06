import { useSettingsStore } from '../stores/useSettingsStore'
import styles from './Settings.module.css'

export function Settings() {
  const countInBeats = useSettingsStore((s) => s.countInBeats)
  const defaultSpeed = useSettingsStore((s) => s.defaultSpeed)
  const metronomeVolume = useSettingsStore((s) => s.metronomeVolume)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const setCountInBeats = useSettingsStore((s) => (v: number) => { s.setCountInBeats(v) })
  const setDefaultSpeed = useSettingsStore((s) => (v: number) => { s.setDefaultSpeed(v) })
  const setMetronomeVolume = useSettingsStore((s) => (v: number) => { s.setMetronomeVolume(v) })
  const setReducedMotion = useSettingsStore((s) => (v: boolean) => { s.setReducedMotion(v) })

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Settings</h3>

      <div className={styles.field}>
        <label className={styles.label}>Count-in beats: {countInBeats}</label>
        <input
          className={styles.range}
          type="range" min="0" max="8" step="1"
          value={countInBeats}
          onChange={(e) => setCountInBeats(Number(e.target.value))}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Default speed: {Math.round(defaultSpeed * 100)}%</label>
        <input
          className={styles.range}
          type="range" min="0.25" max="1" step="0.05"
          value={defaultSpeed}
          onChange={(e) => setDefaultSpeed(Number(e.target.value))}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Metronome volume: {Math.round(metronomeVolume * 100)}%</label>
        <input
          className={styles.range}
          type="range" min="0" max="1" step="0.05"
          value={metronomeVolume}
          onChange={(e) => setMetronomeVolume(Number(e.target.value))}
        />
      </div>

      <div className={styles.toggle}>
        <span className={styles.toggleLabel}>Reduced motion</span>
        <input
          className={styles.toggleInput}
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
        />
      </div>
    </div>
  )
}
