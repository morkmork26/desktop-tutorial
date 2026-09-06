import type { Beat } from '../domain/types'
import styles from './BeatGrid.module.css'

interface BeatGridProps {
  readonly beat: Beat | null
  readonly subdivision: number
  readonly divisions: 1 | 2 | 4
}

export function BeatGrid({ beat, subdivision, divisions }: BeatGridProps) {
  return (
    <div className={styles.grid} aria-label={`${divisions === 1 ? 'Quarter' : divisions === 2 ? 'Eighth' : 'Sixteenth'} note pulse`}>
      {Array.from({ length: divisions }, (_, index) => (
        <span
          className={`${styles.cell} ${index === subdivision ? styles.active : ''}`}
          key={index}
        >
          {index === 0 ? (beat?.beatInBar ?? '–') : '·'}
        </span>
      ))}
    </div>
  )
}
