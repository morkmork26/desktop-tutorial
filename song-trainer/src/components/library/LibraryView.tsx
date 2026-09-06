import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import type { ImportAdapter } from '../../adapters/importAdapter'
import { ProjectCard } from './ProjectCard'
import styles from './LibraryView.module.css'

interface LibraryViewProps {
  readonly importAdapter: ImportAdapter
}

export function LibraryView({ importAdapter }: LibraryViewProps) {
  const projects = useAppStore((s) => s.projects)
  const loading = useAppStore((s) => s.loading)
  const error = useAppStore((s) => s.error)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const loadProjects = useAppStore((s) => () => s.loadProjects())
  const openProject = useAppStore((s) => (id: string) => s.openProject(id))
  const deleteProject = useAppStore((s) => (id: string) => s.deleteProject(id))
  const setSearchQuery = useAppStore((s) => (q: string) => { s.setSearchQuery(q) })
  const searchProjects = useAppStore((s) => () => s.searchProjects())
  const repository = useAppStore((s) => s.repository)
  const setError = useAppStore((s) => (e: string | null) => { s.setError(e) })

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => { void searchProjects() }, 300)
  }, [setSearchQuery, searchProjects])

  const handleImport = useCallback(async () => {
    if (!repository) return
    try {
      const result = await importAdapter.pickAndImport()
      if (!result) return
      await repository.create({
        title: result.originalName.replace(/\.[^.]+$/, ''),
        audioStoredName: result.storedName,
        audioOriginalName: result.originalName,
        durationMs: 0,
      })
      await loadProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }, [importAdapter, repository, loadProjects, setError])

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Delete this project? The managed audio file will also be removed.')) {
      void deleteProject(id)
    }
  }, [deleteProject])

  return (
    <main className={styles.library}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Rhythm Song Trainer</p>
          <h1 className={styles.title}>Your <em>Library</em></h1>
        </div>
      </header>

      {error && <p role="alert" style={{ color: '#e87461', marginBottom: 16 }}>{error}</p>}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search songs..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Search library"
        />
        <button className={styles.importBtn} onClick={() => void handleImport()}>
          + Import Song
        </button>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading...</p>}

      {!loading && projects.length === 0 ? (
        <div className={styles.empty}>
          <p>No songs yet</p>
          <p>Import a WAV or MP3 to get started</p>
          <div className={styles.emptyAction}>
            <button className={styles.importBtn} onClick={() => void handleImport()}>
              + Import Your First Song
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={(id) => void openProject(id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  )
}
