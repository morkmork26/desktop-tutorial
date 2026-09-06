import type { AnalysisResult, Milliseconds } from './types'
import type { Section } from './sections'
import type { SyncedLine } from './lyricSync'

export interface ProjectExport {
  readonly schema: 'rhythm-song-trainer/project'
  readonly schemaVersion: 1
  readonly title: string
  readonly artist: string | null
  readonly durationMs: Milliseconds
  readonly analysis: AnalysisResult | null
  readonly beatMaps: readonly { version: number; source: string; beats: readonly Milliseconds[]; bpm: number | null; beatsPerBar: number }[]
  readonly lyrics: readonly SyncedLine[] | null
  readonly sections: readonly Section[]
  readonly exportedAt: string
}

export function createExport(data: Omit<ProjectExport, 'schema' | 'schemaVersion' | 'exportedAt'>): ProjectExport {
  return {
    schema: 'rhythm-song-trainer/project',
    schemaVersion: 1,
    ...data,
    exportedAt: new Date().toISOString(),
  }
}

export function validateImport(json: unknown): { valid: true; data: ProjectExport } | { valid: false; error: string } {
  if (!json || typeof json !== 'object') return { valid: false, error: 'Invalid JSON structure.' }
  const obj = json as Record<string, unknown>
  if (obj['schema'] !== 'rhythm-song-trainer/project') return { valid: false, error: 'Unknown schema.' }
  if (obj['schemaVersion'] !== 1) return { valid: false, error: `Unsupported schema version: ${String(obj['schemaVersion'])}` }
  if (typeof obj['title'] !== 'string') return { valid: false, error: 'Missing or invalid title.' }
  if (typeof obj['durationMs'] !== 'number') return { valid: false, error: 'Missing or invalid duration.' }
  return { valid: true, data: json as ProjectExport }
}
