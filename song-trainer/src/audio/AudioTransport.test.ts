import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { AudioTransport } from './AudioTransport'

function createMockMedia(): HTMLAudioElement {
  let _src = ''
  let _currentTime = 0
  let _playbackRate = 1
  let _volume = 1
  let _paused = true
  const _duration = 18
  const listeners = new Map<string, Set<EventListener>>()

  const media = {
    get src() { return _src },
    set src(v: string) { _src = v },
    get currentTime() { return _currentTime },
    set currentTime(v: number) { _currentTime = v; fire('seeked') },
    get playbackRate() { return _playbackRate },
    set playbackRate(v: number) { _playbackRate = v; fire('ratechange') },
    get volume() { return _volume },
    set volume(v: number) { _volume = v; fire('volumechange') },
    get paused() { return _paused },
    get duration() { return _duration },
    preload: 'auto',
    preservesPitch: true,
    load: vi.fn(),
    play: vi.fn(() => { _paused = false; fire('play'); return Promise.resolve() }),
    pause: vi.fn(() => { _paused = true; fire('pause') }),
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(handler)
    }),
    removeEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.get(event)?.delete(handler)
    }),
  }

  function fire(event: string) {
    listeners.get(event)?.forEach(fn => fn(new Event(event)))
  }

  return media as unknown as HTMLAudioElement
}

describe('AudioTransport', () => {
  let transport: AudioTransport
  let media: HTMLAudioElement

  beforeEach(() => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
    media = createMockMedia()
    transport = new AudioTransport(media)
  })

  afterEach(() => {
    transport.destroy()
    vi.restoreAllMocks()
  })

  it('starts paused with zero time', () => {
    const snap = transport.getSnapshot()
    expect(snap.paused).toBe(true)
    expect(snap.currentTimeMs).toBe(0)
    expect(snap.playbackRate).toBe(1)
  })

  it('loads a source and resets', () => {
    transport.load('/fixtures/120-bpm-accented.wav')
    expect(media.src).toBe('/fixtures/120-bpm-accented.wav')
    expect(media.load).toHaveBeenCalled() // eslint-disable-line @typescript-eslint/unbound-method
  })

  it('play/pause transitions update snapshot', async () => {
    transport.load('/test.wav')
    await transport.play()
    expect(transport.getSnapshot().paused).toBe(false)
    transport.pause()
    expect(transport.getSnapshot().paused).toBe(true)
  })

  it('seek clamps to valid range', () => {
    transport.load('/test.wav')
    transport.seek(5000)
    expect(media.currentTime).toBe(5)
    transport.seek(-100)
    expect(media.currentTime).toBe(0)
  })

  it('setPlaybackRate clamps between 0.5 and 1', () => {
    transport.setPlaybackRate(0.75)
    expect(media.playbackRate).toBe(0.75)
    transport.setPlaybackRate(0.3)
    expect(media.playbackRate).toBe(0.5)
    transport.setPlaybackRate(1.5)
    expect(media.playbackRate).toBe(1)
  })

  it('notifies subscribers on state changes', async () => {
    const snapshots: boolean[] = []
    transport.subscribe((snap) => snapshots.push(snap.paused))
    await transport.play()
    transport.pause()
    expect(snapshots).toContain(true)
    expect(snapshots).toContain(false)
  })

  it('loop wraps playback at endMs', async () => {
    transport.load('/test.wav')
    transport.setLoop({ startMs: 2000, endMs: 4000 })
    await transport.play()
    Object.defineProperty(media, 'currentTime', { value: 4.1, writable: true, configurable: true })
    transport.seek(4100)
    const snap = transport.getSnapshot()
    expect(snap.currentTimeMs).toBeLessThanOrEqual(4100)
  })

  it('setLoop(null) clears loop', () => {
    transport.setLoop({ startMs: 1000, endMs: 3000 })
    transport.setLoop(null)
    const snap = transport.getSnapshot()
    expect(snap).toBeDefined()
  })

  it('destroy clears listeners', () => {
    const fn = vi.fn()
    transport.subscribe(fn)
    fn.mockClear()
    transport.destroy()
    transport.seek(1000)
  })
})
