import { create } from 'zustand'
import type { ProjectRecord, ProjectRepository } from '../repositories/types'

export type AppView = 'library' | 'project'

interface AppState {
  view: AppView
  projects: readonly ProjectRecord[]
  activeProject: ProjectRecord | null
  searchQuery: string
  loading: boolean
  error: string | null
  repository: ProjectRepository | null
  setRepository: (repo: ProjectRepository) => void
  loadProjects: () => Promise<void>
  openProject: (id: string) => Promise<void>
  closeProject: () => void
  deleteProject: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  searchProjects: () => Promise<void>
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'library',
  projects: [],
  activeProject: null,
  searchQuery: '',
  loading: false,
  error: null,
  repository: null,

  setRepository(repo) {
    set({ repository: repo })
  },

  async loadProjects() {
    const { repository } = get()
    if (!repository) return
    set({ loading: true, error: null })
    try {
      const projects = await repository.list()
      set({ projects, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load projects', loading: false })
    }
  },

  async openProject(id) {
    const { repository } = get()
    if (!repository) return
    set({ loading: true, error: null })
    try {
      await repository.touchLastOpened(id)
      const project = await repository.getById(id)
      if (!project) throw new Error('Project not found')
      set({ activeProject: project, view: 'project', loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to open project', loading: false })
    }
  },

  closeProject() {
    set({ activeProject: null, view: 'library' })
  },

  async deleteProject(id) {
    const { repository } = get()
    if (!repository) return
    try {
      await repository.remove(id)
      const { activeProject } = get()
      if (activeProject?.id === id) set({ activeProject: null, view: 'library' })
      await get().loadProjects()
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete project' })
    }
  },

  setSearchQuery(query) {
    set({ searchQuery: query })
  },

  async searchProjects() {
    const { repository, searchQuery } = get()
    if (!repository) return
    if (!searchQuery.trim()) return get().loadProjects()
    set({ loading: true })
    try {
      const projects = await repository.search(searchQuery)
      set({ projects, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Search failed', loading: false })
    }
  },

  setError(error) {
    set({ error })
  },
}))
