import type { CreateProjectInput, ProjectRecord, ProjectRepository } from './types'
import type { AnalysisResult } from '../domain/types'
import type { BeatMapCorrection, BeatMapVersion } from '../analysis/types'
import type { SyncedLine } from '../domain/lyricSync'
import type { PracticeSession } from '../domain/practiceSession'
import type { Section } from '../domain/sections'
import { emptyWorkspace, type ProjectWorkspace, type SavedLoop } from '../domain/workspace'

function uuid(): string {
  return crypto.randomUUID()
}

function isoNow(): string {
  return new Date().toISOString()
}

export class MemoryProjectRepository implements ProjectRepository {
  private projects = new Map<string, ProjectRecord>()
  private workspaces = new Map<string, ProjectWorkspace>()

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
      ...(input.audioSourceUrl ? { audioSourceUrl: input.audioSourceUrl } : {}),
    }
    this.projects.set(record.id, record)
    this.workspaces.set(record.id, emptyWorkspace())
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
    this.workspaces.delete(id)
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

  loadWorkspace(projectId: string): Promise<ProjectWorkspace> {
    return Promise.resolve(this.workspaces.get(projectId) ?? emptyWorkspace())
  }

  saveAnalysis(projectId: string, result: AnalysisResult): Promise<BeatMapVersion> {
    const workspace = this.workspaces.get(projectId) ?? emptyWorkspace()
    const analysisRunId = uuid()
    const beatMap: BeatMapVersion = {
      id: uuid(),
      projectId,
      analysisRunId,
      parentBeatMapId: null,
      version: 1,
      source: 'detector',
      bpm: result.bpm,
      beatsPerBar: result.meter.beatsPerBar,
      beats: result.beatsMs,
      downbeatTimeMs: result.beatsMs[0] ?? null,
      createdAt: isoNow(),
    }
    this.workspaces.set(projectId, { ...workspace, analysis: result, beatMaps: [beatMap] })
    const project = this.projects.get(projectId)
    if (project) {
      this.projects.set(projectId, {
        ...project,
        durationMs: result.durationMs,
        analysisStatus: 'complete',
        updatedAt: isoNow(),
      })
    }
    return Promise.resolve(beatMap)
  }

  saveBeatCorrection(
    projectId: string,
    correction: BeatMapCorrection,
    source: 'correction' | 'reset' = 'correction',
  ): Promise<BeatMapVersion> {
    const workspace = this.workspaces.get(projectId) ?? emptyWorkspace()
    const parent = workspace.beatMaps.at(-1) ?? null
    const map: BeatMapVersion = {
      id: uuid(),
      projectId,
      analysisRunId: parent?.analysisRunId ?? null,
      parentBeatMapId: parent?.id ?? null,
      version: (parent?.version ?? 0) + 1,
      source,
      bpm: correction.bpm,
      beatsPerBar: correction.beatsPerBar,
      beats: correction.beats,
      downbeatTimeMs: correction.downbeatTimeMs,
      createdAt: isoNow(),
    }
    this.workspaces.set(projectId, { ...workspace, beatMaps: [...workspace.beatMaps, map] })
    return Promise.resolve(map)
  }

  saveLyrics(projectId: string, lines: readonly SyncedLine[]): Promise<void> {
    const workspace = this.workspaces.get(projectId) ?? emptyWorkspace()
    this.workspaces.set(projectId, { ...workspace, lyrics: structuredClone(lines) })
    return Promise.resolve()
  }

  saveSections(projectId: string, sections: readonly Section[]): Promise<void> {
    const workspace = this.workspaces.get(projectId) ?? emptyWorkspace()
    this.workspaces.set(projectId, { ...workspace, sections: structuredClone(sections) })
    return Promise.resolve()
  }

  saveLoops(projectId: string, loops: readonly SavedLoop[]): Promise<void> {
    const workspace = this.workspaces.get(projectId) ?? emptyWorkspace()
    this.workspaces.set(projectId, { ...workspace, loops: structuredClone(loops) })
    return Promise.resolve()
  }

  addPracticeSession(session: PracticeSession): Promise<void> {
    const workspace = this.workspaces.get(session.projectId) ?? emptyWorkspace()
    this.workspaces.set(session.projectId, { ...workspace, sessions: [...workspace.sessions, session] })
    return Promise.resolve()
  }
}
