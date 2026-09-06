import type { Milliseconds } from '../domain/types'

export interface ProjectRecord {
  readonly id: string
  readonly title: string
  readonly artist: string | null
  readonly audioStoredName: string
  readonly audioOriginalName: string
  readonly durationMs: Milliseconds
  readonly analysisStatus: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled'
  readonly createdAt: string
  readonly updatedAt: string
  readonly lastOpenedAt: string
}

export interface CreateProjectInput {
  readonly title: string
  readonly artist?: string
  readonly audioStoredName: string
  readonly audioOriginalName: string
  readonly durationMs: Milliseconds
}

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<ProjectRecord>
  getById(id: string): Promise<ProjectRecord | null>
  list(options?: { limit?: number; offset?: number }): Promise<readonly ProjectRecord[]>
  updateTitle(id: string, title: string): Promise<void>
  updateAnalysisStatus(id: string, status: ProjectRecord['analysisStatus']): Promise<void>
  touchLastOpened(id: string): Promise<void>
  remove(id: string): Promise<void>
  search(query: string): Promise<readonly ProjectRecord[]>
}
