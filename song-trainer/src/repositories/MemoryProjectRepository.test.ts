import { describe, expect, it } from 'vitest'
import { MemoryProjectRepository } from './MemoryProjectRepository'

const input = {
  title: 'Test Song',
  artist: 'Test Artist',
  audioStoredName: 'abc-123.wav',
  audioOriginalName: 'my-song.wav',
  durationMs: 180_000,
}

describe('MemoryProjectRepository', () => {
  it('creates and retrieves a project', async () => {
    const repo = new MemoryProjectRepository()
    const created = await repo.create(input)
    expect(created.title).toBe('Test Song')
    expect(created.analysisStatus).toBe('pending')
    const fetched = await repo.getById(created.id)
    expect(fetched?.id).toBe(created.id)
  })

  it('lists projects ordered by last opened', async () => {
    const repo = new MemoryProjectRepository()
    const a = await repo.create({ ...input, title: 'A' })
    await repo.create({ ...input, title: 'B' })
    await repo.touchLastOpened(a.id)
    const list = await repo.list()
    expect(list[0]?.title).toBe('A')
    expect(list[1]?.title).toBe('B')
  })

  it('updates title', async () => {
    const repo = new MemoryProjectRepository()
    const p = await repo.create(input)
    await repo.updateTitle(p.id, 'Renamed')
    const fetched = await repo.getById(p.id)
    expect(fetched?.title).toBe('Renamed')
  })

  it('updates analysis status', async () => {
    const repo = new MemoryProjectRepository()
    const p = await repo.create(input)
    await repo.updateAnalysisStatus(p.id, 'complete')
    const fetched = await repo.getById(p.id)
    expect(fetched?.analysisStatus).toBe('complete')
  })

  it('removes a project', async () => {
    const repo = new MemoryProjectRepository()
    const p = await repo.create(input)
    await repo.remove(p.id)
    expect(await repo.getById(p.id)).toBeNull()
  })

  it('searches by title and artist', async () => {
    const repo = new MemoryProjectRepository()
    await repo.create({ ...input, title: 'Happy Birthday' })
    await repo.create({ ...input, title: 'Sad Song', artist: 'Happy Singer' })
    const results = await repo.search('happy')
    expect(results).toHaveLength(2)
  })

  it('returns null for unknown id', async () => {
    const repo = new MemoryProjectRepository()
    expect(await repo.getById('nonexistent')).toBeNull()
  })
})
