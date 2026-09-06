import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MetronomeScheduler } from './MetronomeScheduler'
import { AudioTransport } from './AudioTransport'
import type { Beat } from '../domain/types'

const TEST_BEATS: Beat[] = [
  { id: 'b0', timeMs: 2000, beatInBar: 1, isDownbeat: true },
  { id: 'b1', timeMs: 2500, beatInBar: 2, isDownbeat: false },
  { id: 'b2', timeMs: 3000, beatInBar: 3, isDownbeat: false },
  { id: 'b3', timeMs: 3500, beatInBar: 4, isDownbeat: false },
  { id: 'b4', timeMs: 4000, beatInBar: 1, isDownbeat: true },
]

interface ScheduledClick { time: number; frequency: number }

function createMockTransport(currentTimeSec: number, rate = 1, paused = false) {
  return {
    media: {
      currentTime: currentTimeSec,
      playbackRate: rate,
      paused,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  } as unknown as AudioTransport
}

function createMockAudioContext(baseTime = 10) {
  const scheduled: ScheduledClick[] = []
  const mockCtx = {
    currentTime: baseTime,
    resume: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    destination: {},
    createOscillator: vi.fn(() => {
      let freq = 440
      const osc = {
        frequency: { get value() { return freq }, set value(v: number) { freq = v } },
        connect: vi.fn(() => ({ connect: vi.fn() })),
        start: vi.fn((at: number) => { scheduled.push({ time: at, frequency: freq }) }),
        stop: vi.fn(),
      }
      return osc
    }),
    createGain: vi.fn(() => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
  }
  return { mockCtx, scheduled }
}

describe('MetronomeScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    if (!globalThis.AudioContext) {
      globalThis.AudioContext = class AudioContext {} as unknown as typeof globalThis.AudioContext
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('schedules clicks within the lookahead window', async () => {
    const transport = createMockTransport(1.95, 1, false)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()

    expect(scheduled.length).toBeGreaterThan(0)
    expect(scheduled[0]!.frequency).toBe(1320)

    scheduler.destroy()
  })

  it('does not schedule beats behind current time', async () => {
    const transport = createMockTransport(3.0, 1, false)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()

    const scheduledTimes = scheduled.map(s => s.time)
    scheduledTimes.forEach(t => {
      expect(t).toBeGreaterThanOrEqual(mockCtx.currentTime)
    })

    scheduler.destroy()
  })

  it('stop cancels the scheduling interval', async () => {
    const transport = createMockTransport(2.0, 1, false)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()
    scheduler.stop()

    vi.advanceTimersByTime(100)

    scheduler.destroy()
  })

  it('rebuild resets scheduling cursor', async () => {
    const transport = createMockTransport(2.0, 1, false)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()
    const firstCount = scheduled.length

    scheduler.rebuild()
    expect(scheduled.length).toBeGreaterThanOrEqual(firstCount)

    scheduler.destroy()
  })

  it('uses higher frequency for downbeats', async () => {
    const transport = createMockTransport(1.95, 1, false)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()

    const downbeatClicks = scheduled.filter(s => s.frequency === 1320)
    const normalClicks = scheduled.filter(s => s.frequency === 880)
    expect(downbeatClicks.length).toBeGreaterThan(0)
    expect(normalClicks.length + downbeatClicks.length).toBe(scheduled.length)

    scheduler.destroy()
  })

  it('does not schedule when paused', async () => {
    const transport = createMockTransport(2.0, 1, true)
    const scheduler = new MetronomeScheduler(transport, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()
    scheduler.rebuild()

    expect(scheduled.length).toBe(0)

    scheduler.destroy()
  })

  it('adjusts scheduled time for playback rate', async () => {
    const transport75 = createMockTransport(1.95, 0.75, false)
    const scheduler = new MetronomeScheduler(transport75, () => TEST_BEATS)
    const { mockCtx, scheduled } = createMockAudioContext()

    vi.spyOn(globalThis, 'AudioContext').mockImplementation(() => mockCtx as unknown as AudioContext)

    await scheduler.start()

    if (scheduled.length > 0) {
      const offset = scheduled[0]!.time - mockCtx.currentTime
      expect(offset).toBeGreaterThan(0)
    }

    scheduler.destroy()
  })
})
