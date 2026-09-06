import { describe, expect, it } from 'vitest'
import { createExport, validateImport } from './projectExport'

describe('projectExport', () => {
  it('creates an export with schema metadata', () => {
    const exported = createExport({
      title: 'Test',
      artist: null,
      durationMs: 180_000,
      analysis: null,
      beatMaps: [],
      lyrics: null,
      sections: [],
    })
    expect(exported.schema).toBe('rhythm-song-trainer/project')
    expect(exported.schemaVersion).toBe(1)
    expect(exported.exportedAt).toBeTruthy()
  })

  it('validates import schema', () => {
    expect(validateImport(null)).toEqual({ valid: false, error: 'Invalid JSON structure.' })
    expect(validateImport({ schema: 'wrong' })).toEqual({ valid: false, error: 'Unknown schema.' })
    expect(validateImport({
      schema: 'rhythm-song-trainer/project',
      schemaVersion: 1,
      title: 'Test',
      durationMs: 180_000,
    })).toEqual(expect.objectContaining({ valid: true }))
  })

  it('rejects unsupported version', () => {
    const result = validateImport({
      schema: 'rhythm-song-trainer/project',
      schemaVersion: 99,
    })
    expect(result.valid).toBe(false)
  })
})
