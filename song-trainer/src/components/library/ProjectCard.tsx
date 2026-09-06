import type { ProjectRecord } from '../../repositories/types'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
  readonly project: ProjectRecord
  readonly onOpen: (id: string) => void
  readonly onDelete: (id: string) => void
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function statusDot(status: ProjectRecord['analysisStatus']): string {
  switch (status) {
    case 'complete': return styles.dotComplete ?? ''
    case 'failed': case 'cancelled': return styles.dotFailed ?? ''
    case 'running': return styles.dotRunning ?? ''
    default: return styles.dotPending ?? ''
  }
}

export function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  return (
    <article
      className={styles.card}
      onClick={() => onOpen(project.id)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(project.id) }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
    >
      <h3 className={styles.cardTitle}>{project.title}</h3>
      {project.artist && <p className={styles.artist}>{project.artist}</p>}
      <div className={styles.meta}>
        <span>{formatDuration(project.durationMs)}</span>
        <span>{project.audioOriginalName}</span>
        <span className={styles.status}>
          <i className={`${styles.dot} ${statusDot(project.analysisStatus)}`} />
          {project.analysisStatus}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(project.id) }}
          aria-label={`Delete ${project.title}`}
        >Delete</button>
      </div>
    </article>
  )
}
