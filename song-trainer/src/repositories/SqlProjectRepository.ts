import type { CreateProjectInput, ProjectRecord, ProjectRepository } from './types'
import type { AnalysisResult, TimedSyllable } from '../domain/types'
import type { BeatMapCorrection, BeatMapVersion } from '../analysis/types'
import type { SyncedLine, SyncedToken } from '../domain/lyricSync'
import type { PracticeSession } from '../domain/practiceSession'
import type { Section } from '../domain/sections'
import type { ProjectWorkspace, SavedLoop } from '../domain/workspace'

type SqlPlugin = {
  execute(query: string, bindValues?: unknown[]): Promise<{ rowsAffected: number }>
  select<T>(query: string, bindValues?: unknown[]): Promise<T[]>
}

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

interface AnalysisRow { result_json: string | null }
interface BeatMapRow {
  id: string
  project_id: string
  analysis_run_id: string | null
  parent_beat_map_id: string | null
  version: number
  source: BeatMapVersion['source']
  bpm: number | null
  beats_per_bar: number
  created_at: string
}
interface BeatRow {
  beat_map_id: string
  time_ms: number
  beat_in_bar: number
  is_downbeat: number
}
interface LyricDocumentRow { id: string }
interface LyricLineRow { id: string; ordinal: number; text: string }
interface LyricTokenRow { id: string; line_id: string; ordinal: number; text: string; normalized_text: string }
interface LyricSyllableRow { id: string; token_id: string; ordinal: number; text: string; time_ms: number | null }
interface SectionRow { id: string; name: string; ordinal: number; start_ms: number; end_ms: number }
interface LoopRow { id: string; name: string; kind: SavedLoop['kind']; start_ms: number; end_ms: number }
interface SessionRow {
  id: string
  project_id: string
  started_at: string
  ended_at: string | null
  practiced_ms: number
  difficult_section_id: string | null
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
    await this.sql.execute(
      `INSERT INTO projects (id, title, artist, audio_stored_name, audio_original_name, duration_ms, analysis_status, created_at, updated_at, last_opened_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $7, $7)`,
      [id, input.title, input.artist ?? null, input.audioStoredName, input.audioOriginalName, input.durationMs, now],
    )
    const record = await this.getById(id)
    if (!record) throw new Error('Failed to create project')
    return record
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const rows = await this.sql.select<ProjectRow>(
      'SELECT * FROM projects WHERE id = $1', [id],
    )
    const row = rows[0]
    return row ? rowToRecord(row) : null
  }

  async list(options?: { limit?: number; offset?: number }): Promise<readonly ProjectRecord[]> {
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    const rows = await this.sql.select<ProjectRow>(
      'SELECT * FROM projects ORDER BY last_opened_at DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    )
    return rows.map(rowToRecord)
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.sql.execute(
      'UPDATE projects SET title = $1, updated_at = $2 WHERE id = $3',
      [title, isoNow(), id],
    )
  }

  async updateAnalysisStatus(id: string, status: ProjectRecord['analysisStatus']): Promise<void> {
    await this.sql.execute(
      'UPDATE projects SET analysis_status = $1, updated_at = $2 WHERE id = $3',
      [status, isoNow(), id],
    )
  }

  async touchLastOpened(id: string): Promise<void> {
    const now = isoNow()
    await this.sql.execute(
      'UPDATE projects SET last_opened_at = $1, updated_at = $1 WHERE id = $2',
      [now, id],
    )
  }

  async remove(id: string): Promise<void> {
    await this.sql.execute('DELETE FROM projects WHERE id = $1', [id])
  }

  async search(query: string): Promise<readonly ProjectRecord[]> {
    const pattern = `%${query}%`
    const rows = await this.sql.select<ProjectRow>(
      'SELECT * FROM projects WHERE title LIKE $1 OR artist LIKE $1 ORDER BY last_opened_at DESC LIMIT 50',
      [pattern],
    )
    return rows.map(rowToRecord)
  }

  async loadWorkspace(projectId: string): Promise<ProjectWorkspace> {
    const [analysisRows, mapRows, beatRows, documentRows, sectionRows, loopRows, sessionRows] = await Promise.all([
      this.sql.select<AnalysisRow>(
        `SELECT result_json FROM analysis_runs
         WHERE project_id = $1 AND status = 'complete' AND result_json IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [projectId],
      ),
      this.sql.select<BeatMapRow>('SELECT * FROM beat_maps WHERE project_id = $1 ORDER BY version', [projectId]),
      this.sql.select<BeatRow>(
        `SELECT b.beat_map_id, b.time_ms, b.beat_in_bar, b.is_downbeat
         FROM beats b JOIN beat_maps m ON m.id = b.beat_map_id
         WHERE m.project_id = $1 ORDER BY m.version, b.ordinal`,
        [projectId],
      ),
      this.sql.select<LyricDocumentRow>('SELECT id FROM lyric_documents WHERE project_id = $1', [projectId]),
      this.sql.select<SectionRow>('SELECT * FROM sections WHERE project_id = $1 ORDER BY ordinal', [projectId]),
      this.sql.select<LoopRow>('SELECT * FROM loops WHERE project_id = $1 ORDER BY created_at', [projectId]),
      this.sql.select<SessionRow>('SELECT * FROM practice_sessions WHERE project_id = $1 ORDER BY started_at', [projectId]),
    ])

    const analysisText = analysisRows[0]?.result_json
    const analysis = analysisText ? JSON.parse(analysisText) as AnalysisResult : null
    const beatsByMap = new Map<string, BeatRow[]>()
    beatRows.forEach((beat) => {
      const rows = beatsByMap.get(beat.beat_map_id) ?? []
      rows.push(beat)
      beatsByMap.set(beat.beat_map_id, rows)
    })
    const beatMaps: BeatMapVersion[] = mapRows.map((map) => {
      const rows = beatsByMap.get(map.id) ?? []
      return {
        id: map.id,
        projectId: map.project_id,
        analysisRunId: map.analysis_run_id,
        parentBeatMapId: map.parent_beat_map_id,
        version: map.version,
        source: map.source,
        bpm: map.bpm,
        beatsPerBar: map.beats_per_bar,
        beats: rows.map((beat) => beat.time_ms),
        downbeatTimeMs: rows.find((beat) => beat.is_downbeat === 1)?.time_ms ?? null,
        createdAt: map.created_at,
      }
    })

    const lyrics = documentRows[0]
      ? await this.loadLyrics(documentRows[0].id)
      : []

    return {
      analysis,
      beatMaps,
      lyrics,
      sections: sectionRows.map((row) => ({
        id: row.id,
        name: row.name,
        ordinal: row.ordinal,
        startMs: row.start_ms,
        endMs: row.end_ms,
      })),
      loops: loopRows.map((row) => ({
        id: row.id,
        name: row.name,
        kind: row.kind,
        startMs: row.start_ms,
        endMs: row.end_ms,
      })),
      sessions: sessionRows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        practicedMs: row.practiced_ms,
        difficultSectionId: row.difficult_section_id,
      })),
    }
  }

  async saveAnalysis(projectId: string, result: AnalysisResult): Promise<BeatMapVersion> {
    const now = isoNow()
    const analysisRunId = uuid()
    const map: BeatMapVersion = {
      id: uuid(), projectId, analysisRunId, parentBeatMapId: null, version: 1,
      source: 'detector', bpm: result.bpm, beatsPerBar: result.meter.beatsPerBar,
      beats: result.beatsMs, downbeatTimeMs: result.beatsMs[0] ?? null, createdAt: now,
    }
    await this.transaction(async () => {
      await this.sql.execute(
        `INSERT INTO analysis_runs
         (id, project_id, schema_version, engine_version, status, bpm, meter_beats, confidence, result_json, warning_json, created_at, completed_at)
         VALUES ($1, $2, $3, 'browser-v1', 'complete', $4, $5, $6, $7, $8, $9, $9)`,
        [analysisRunId, projectId, result.schemaVersion, result.bpm, result.meter.beatsPerBar,
          result.confidence, JSON.stringify(result), JSON.stringify(result.warnings), now],
      )
      await this.insertBeatMap(map)
      await this.sql.execute(
        `UPDATE projects SET duration_ms = $1, analysis_status = 'complete', updated_at = $2 WHERE id = $3`,
        [result.durationMs, now, projectId],
      )
    })
    return map
  }

  async saveBeatCorrection(
    projectId: string,
    correction: BeatMapCorrection,
    source: 'correction' | 'reset' = 'correction',
  ): Promise<BeatMapVersion> {
    const parents = await this.sql.select<BeatMapRow>(
      'SELECT * FROM beat_maps WHERE project_id = $1 ORDER BY version DESC LIMIT 1',
      [projectId],
    )
    const parent = parents[0]
    const map: BeatMapVersion = {
      id: uuid(), projectId, analysisRunId: parent?.analysis_run_id ?? null,
      parentBeatMapId: parent?.id ?? null, version: (parent?.version ?? 0) + 1,
      source, bpm: correction.bpm, beatsPerBar: correction.beatsPerBar,
      beats: correction.beats, downbeatTimeMs: correction.downbeatTimeMs, createdAt: isoNow(),
    }
    await this.transaction(() => this.insertBeatMap(map))
    return map
  }

  async saveLyrics(projectId: string, lines: readonly SyncedLine[]): Promise<void> {
    await this.transaction(async () => {
      await this.sql.execute('DELETE FROM lyric_documents WHERE project_id = $1', [projectId])
      const documentId = uuid()
      const now = isoNow()
      await this.sql.execute(
        'INSERT INTO lyric_documents (id, project_id, source_text, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)',
        [documentId, projectId, lines.map((line) => line.text).join('\n'), now],
      )
      for (const line of lines) {
        await this.sql.execute(
          'INSERT INTO lyric_lines (id, document_id, ordinal, text) VALUES ($1, $2, $3, $4)',
          [line.id, documentId, line.ordinal, line.text],
        )
        for (let tokenOrdinal = 0; tokenOrdinal < line.tokens.length; tokenOrdinal += 1) {
          const token = line.tokens[tokenOrdinal]!
          await this.sql.execute(
            'INSERT INTO lyric_tokens (id, line_id, ordinal, text, normalized_text, time_ms) VALUES ($1, $2, $3, $4, $5, $6)',
            [token.id, line.id, tokenOrdinal, token.text, token.normalized,
              token.syllables.find((syllable) => syllable.timeMs !== null)?.timeMs ?? null],
          )
          for (let syllableOrdinal = 0; syllableOrdinal < token.syllables.length; syllableOrdinal += 1) {
            const syllable = token.syllables[syllableOrdinal]!
            await this.sql.execute(
              'INSERT INTO lyric_syllables (id, token_id, ordinal, text, time_ms) VALUES ($1, $2, $3, $4, $5)',
              [syllable.id, token.id, syllableOrdinal, syllable.text, syllable.timeMs],
            )
          }
        }
      }
    })
  }

  async saveSections(projectId: string, sections: readonly Section[]): Promise<void> {
    await this.replaceRows('sections', projectId, async () => {
      for (const section of sections) {
        await this.sql.execute(
          'INSERT INTO sections (id, project_id, name, ordinal, start_ms, end_ms) VALUES ($1, $2, $3, $4, $5, $6)',
          [section.id, projectId, section.name, section.ordinal, section.startMs, section.endMs],
        )
      }
    })
  }

  async saveLoops(projectId: string, loops: readonly SavedLoop[]): Promise<void> {
    await this.replaceRows('loops', projectId, async () => {
      for (const loop of loops) {
        await this.sql.execute(
          'INSERT INTO loops (id, project_id, name, kind, start_ms, end_ms, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [loop.id, projectId, loop.name, loop.kind, loop.startMs, loop.endMs, isoNow()],
        )
      }
    })
  }

  async addPracticeSession(session: PracticeSession): Promise<void> {
    await this.sql.execute(
      `INSERT INTO practice_sessions
       (id, project_id, started_at, ended_at, practiced_ms, difficult_section_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.id, session.projectId, session.startedAt, session.endedAt,
        session.practicedMs, session.difficultSectionId],
    )
  }

  private async loadLyrics(documentId: string): Promise<SyncedLine[]> {
    const [lineRows, tokenRows, syllableRows] = await Promise.all([
      this.sql.select<LyricLineRow>('SELECT * FROM lyric_lines WHERE document_id = $1 ORDER BY ordinal', [documentId]),
      this.sql.select<LyricTokenRow>(
        `SELECT t.* FROM lyric_tokens t JOIN lyric_lines l ON l.id = t.line_id
         WHERE l.document_id = $1 ORDER BY l.ordinal, t.ordinal`, [documentId],
      ),
      this.sql.select<LyricSyllableRow>(
        `SELECT s.* FROM lyric_syllables s JOIN lyric_tokens t ON t.id = s.token_id
         JOIN lyric_lines l ON l.id = t.line_id WHERE l.document_id = $1
         ORDER BY l.ordinal, t.ordinal, s.ordinal`, [documentId],
      ),
    ])
    return lineRows.map((line): SyncedLine => ({
      id: line.id,
      text: line.text,
      ordinal: line.ordinal,
      tokens: tokenRows.filter((token) => token.line_id === line.id).map((token): SyncedToken => ({
        id: token.id,
        text: token.text,
        normalized: token.normalized_text,
        syllables: syllableRows.filter((syllable) => syllable.token_id === token.id)
          .map((syllable): TimedSyllable => ({ id: syllable.id, text: syllable.text, timeMs: syllable.time_ms })),
      })),
    }))
  }

  private async insertBeatMap(map: BeatMapVersion): Promise<void> {
    await this.sql.execute(
      `INSERT INTO beat_maps
       (id, project_id, analysis_run_id, parent_beat_map_id, version, source, bpm, beats_per_bar, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [map.id, map.projectId, map.analysisRunId, map.parentBeatMapId, map.version,
        map.source, map.bpm, map.beatsPerBar, map.createdAt],
    )
    const downbeatIndex = map.downbeatTimeMs === null ? 0 : Math.max(0, map.beats.indexOf(map.downbeatTimeMs))
    for (let ordinal = 0; ordinal < map.beats.length; ordinal += 1) {
      const timeMs = map.beats[ordinal]!
      const phase = ((ordinal - downbeatIndex) % map.beatsPerBar + map.beatsPerBar) % map.beatsPerBar
      await this.sql.execute(
        'INSERT INTO beats (id, beat_map_id, ordinal, time_ms, beat_in_bar, is_downbeat) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuid(), map.id, ordinal, timeMs, phase + 1, timeMs === map.downbeatTimeMs ? 1 : 0],
      )
    }
  }

  private async replaceRows(
    table: 'sections' | 'loops',
    projectId: string,
    insert: () => Promise<void>,
  ): Promise<void> {
    await this.transaction(async () => {
      await this.sql.execute(`DELETE FROM ${table} WHERE project_id = $1`, [projectId])
      await insert()
    })
  }

  private async transaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.sql.execute('BEGIN IMMEDIATE')
    try {
      const result = await operation()
      await this.sql.execute('COMMIT')
      return result
    } catch (error) {
      await this.sql.execute('ROLLBACK')
      throw error
    }
  }
}
