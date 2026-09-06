import type { CreateProjectInput, ProjectRecord, ProjectRepository } from './types'

type SqlPlugin = {
  execute(db: string, query: string, bindValues?: unknown[]): Promise<{ rowsAffected: number }>
  select<T>(db: string, query: string, bindValues?: unknown[]): Promise<T[]>
}

const DB = 'sqlite:rhythm-song-trainer.sqlite'

function uuid(): string {
  return crypto.randomUUID()
}

function isoNow(): string {
  return new Date().toISOString()
}

interface ProjectRow {
  id: string
  title: string
  artist: string | null
  audio_stored_name: string
  audio_original_name: string
  duration_ms: number
  analysis_status: string
  created_at: string
  updated_at: string
  last_opened_at: string
}

function rowToRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioStoredName: row.audio_stored_name,
    audioOriginalName: row.audio_original_name,
    durationMs: row.duration_ms,
    analysisStatus: row.analysis_status as ProjectRecord['analysisStatus'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
  }
}

export class SqlProjectRepository implements ProjectRepository {
  constructor(private readonly sql: SqlPlugin) {}

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const id = uuid()
    const now = isoNow()
    await this.sql.execute(DB,
      `INSERT INTO projects (id, title, artist, audio_stored_name, audio_original_name, duration_ms, analysis_status, created_at, updated_at, last_opened_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $7, $7)`,
      [id, input.title, input.artist ?? null, input.audioStoredName, input.audioOriginalName, input.durationMs, now],
    )
    const record = await this.getById(id)
    if (!record) throw new Error('Failed to create project')
    return record
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const rows = await this.sql.select<ProjectRow>(DB,
      'SELECT * FROM projects WHERE id = $1', [id],
    )
    const row = rows[0]
    return row ? rowToRecord(row) : null
  }

  async list(options?: { limit?: number; offset?: number }): Promise<readonly ProjectRecord[]> {
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const rows = await this.sql.select<ProjectRow>(DB,
      'SELECT * FROM projects ORDER BY last_opened_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    )
    return rows.map(rowToRecord)
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.sql.execute(DB,
      'UPDATE projects SET title = $1, updated_at = $2 WHERE id = $3',
      [title, isoNow(), id],
    )
  }

  async updateAnalysisStatus(id: string, status: ProjectRecord['analysisStatus']): Promise<void> {
    await this.sql.execute(DB,
      'UPDATE projects SET analysis_status = $1, updated_at = $2 WHERE id = $3',
      [status, isoNow(), id],
    )
  }

  async touchLastOpened(id: string): Promise<void> {
    const now = isoNow()
    await this.sql.execute(DB,
      'UPDATE projects SET last_opened_at = $1, updated_at = $1 WHERE id = $2',
      [now, id],
    )
  }

  async remove(id: string): Promise<void> {
    await this.sql.execute(DB, 'DELETE FROM projects WHERE id = $1', [id])
  }

  async search(query: string): Promise<readonly ProjectRecord[]> {
    const pattern = `%${query}%`
    const rows = await this.sql.select<ProjectRow>(DB,
      'SELECT * FROM projects WHERE title LIKE $1 OR artist LIKE $1 ORDER BY last_opened_at DESC LIMIT 50',
      [pattern],
    )
    return rows.map(rowToRecord)
  }
}
