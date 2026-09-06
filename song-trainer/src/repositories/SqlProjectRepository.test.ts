import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SqlProjectRepository } from './SqlProjectRepository'

const projectRow = {
  id: 'project-1',
  title: 'Test Song',
  artist: null,
  audio_stored_name: 'audio.wav',
  audio_original_name: 'song.wav',
  duration_ms: 1_000,
  analysis_status: 'pending',
  created_at: '2026-09-07T00:00:00.000Z',
  updated_at: '2026-09-07T00:00:00.000Z',
  last_opened_at: '2026-09-07T00:00:00.000Z',
}

describe('SqlProjectRepository', () => {
  const execute = vi.fn((query: string, bindValues?: unknown[]) => {
    void query
    void bindValues
    return Promise.resolve({ rowsAffected: 1 })
  })
  const select = vi.fn((query: string, bindValues?: unknown[]) => {
    void query
    void bindValues
    return Promise.resolve([projectRow] as unknown[])
  })

  const createRepository = () => new SqlProjectRepository(
    { execute, select } as unknown as ConstructorParameters<typeof SqlProjectRepository>[0],
  )

  beforeEach(() => {
    execute.mockClear()
    select.mockClear()
  })

  it('uses the loaded Tauri Database instance signature', async () => {
    const repository = createRepository()
    await repository.list({ limit: 10, offset: 2 })

    expect(select).toHaveBeenCalledWith(
      expect.stringMatching(/^SELECT \*/),
      [10, 2],
    )
  })

  it('binds project creation values after the SQL statement', async () => {
    const repository = createRepository()
    await repository.create({
      title: 'Test Song',
      audioStoredName: 'audio.wav',
      audioOriginalName: 'song.wav',
      durationMs: 1_000,
    })

    expect(execute.mock.calls[0]?.[0]).toMatch(/^INSERT INTO projects/)
    expect(execute.mock.calls[0]?.[1]).toEqual(expect.arrayContaining(['Test Song', 'audio.wav', 'song.wav', 1_000]))
  })
})
