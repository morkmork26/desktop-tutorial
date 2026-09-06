import type { CreateProjectInput, ProjectRecord, ProjectRepository } from './types'

function uuid(): string {
  return crypto.randomUUID()
}

function isoNow(): string {
  return new Date().toISOString()
}

export class MemoryProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectRecord>()

  create(input: CreateProjectInput): Promise<ProjectRecord> {
    const now = isoNow()
    const record: ProjectRecord = {
      id: uuid(),
      title: input.title,
      artist: input.artist ?? null,
      audioStoredName: input.audioStoredName,
      audioOriginalName: input.audioOriginalName,
      durationMs: input.durationMs,
      analysisStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }
    this.projects.set(record.id, record)
    return Promise.resolve(record)
  }

  getById(id: string): Promise<ProjectRecord | null> {
    return Promise.resolve(this.projects.get(id) ?? null)
  }

  list(options?: { limit?: number; offset?: number }): Promise<readonly ProjectRecord[]> {
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const sorted = [...this.projects.values()].sort(
      (a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt),
    )
    return Promise.resolve(sorted.slice(offset, offset + limit))
  }

  updateTitle(id: string, title: string): Promise<void> {
    const existing = this.projects.get(id)
    if (!existing) return Promise.resolve()
    this.projects.set(id, { ...existing, title, updatedAt: isoNow() })
    return Promise.resolve()
  }

  updateAnalysisStatus(id: string, status: ProjectRecord['analysisStatus']): Promise<void> {
    const existing = this.projects.get(id)
    if (!existing) return Promise.resolve()
    this.projects.set(id, { ...existing, analysisStatus: status, updatedAt: isoNow() })
    return Promise.resolve()
  }

  touchLastOpened(id: string): Promise<void> {
    const existing = this.projects.get(id)
    if (!existing) return Promise.resolve()
    const now = isoNow()
    this.projects.set(id, { ...existing, lastOpenedAt: now, updatedAt: now })
    return Promise.resolve()
  }

  remove(id: string): Promise<void> {
    this.projects.delete(id)
    return Promise.resolve()
  }

  search(query: string): Promise<readonly ProjectRecord[]> {
    const lower = query.toLowerCase()
    return Promise.resolve(
      [...this.projects.values()].filter(
        (p) => p.title.toLowerCase().includes(lower) || (p.artist?.toLowerCase().includes(lower) ?? false),
      ),
    )
  }
}
