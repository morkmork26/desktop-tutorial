import type { LoopRange } from '../domain/types'

export interface TransportSnapshot {
  readonly currentTimeMs: number
  readonly durationMs: number
  readonly paused: boolean
  readonly playbackRate: number
  readonly volume: number
}

type Listener = (snapshot: TransportSnapshot) => void

export class AudioTransport {
  readonly media: HTMLAudioElement
  private listeners = new Set<Listener>()
  private frame: number | null = null
  private loop: LoopRange | null = null
  private snapshot: TransportSnapshot = {
    currentTimeMs: 0,
    durationMs: 0,
    paused: true,
    playbackRate: 1,
    volume: 1,
  }

  constructor(media = new Audio()) {
    this.media = media
    this.media.preload = 'auto'
    this.media.preservesPitch = true
    ;['loadedmetadata', 'play', 'pause', 'seeked', 'ratechange', 'volumechange', 'ended'].forEach((event) => {
      this.media.addEventListener(event, this.emit)
    })
  }

  load(source: string): void {
    this.pause()
    this.media.src = source
    this.media.load()
    this.emit()
  }

  async play(): Promise<void> {
    await this.media.play()
    this.ensureFrame()
  }

  pause(): void {
    this.media.pause()
    this.stopFrame()
    this.emit()
  }

  seek(timeMs: number): void {
    const duration = Number.isFinite(this.media.duration) ? this.media.duration * 1000 : timeMs
    this.media.currentTime = Math.max(0, Math.min(timeMs, duration)) / 1000
    this.emit()
  }

  setPlaybackRate(rate: number): void {
    this.media.playbackRate = Math.max(0.5, Math.min(1, rate))
  }

  setVolume(volume: number): void {
    this.media.volume = Math.max(0, Math.min(1, volume))
  }

  setLoop(loop: LoopRange | null): void {
    this.loop = loop
    this.emit()
  }

  getSnapshot = (): TransportSnapshot => this.snapshot

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => this.listeners.delete(listener)
  }

  destroy(): void {
    this.pause()
    this.listeners.clear()
  }

  private emit = (): void => {
    const timeMs = this.media.currentTime * 1000
    if (this.loop && !this.media.paused && timeMs >= this.loop.endMs) {
      this.media.currentTime = this.loop.startMs / 1000
    }
    this.snapshot = {
      currentTimeMs: Math.round(this.media.currentTime * 1000),
      durationMs: Number.isFinite(this.media.duration) ? Math.round(this.media.duration * 1000) : 0,
      paused: this.media.paused,
      playbackRate: this.media.playbackRate,
      volume: this.media.volume,
    }
    this.listeners.forEach((listener) => listener(this.snapshot))
    if (!this.media.paused) this.ensureFrame()
  }

  private ensureFrame(): void {
    if (this.frame !== null) return
    const update = (): void => {
      this.frame = null
      this.emit()
    }
    this.frame = requestAnimationFrame(update)
  }

  private stopFrame(): void {
    if (this.frame === null) return
    cancelAnimationFrame(this.frame)
    this.frame = null
  }
}
