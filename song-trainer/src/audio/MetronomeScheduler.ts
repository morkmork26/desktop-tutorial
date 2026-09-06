import type { Beat } from '../domain/types'
import type { AudioTransport } from './AudioTransport'

export class MetronomeScheduler {
  private context: AudioContext | null = null
  private timer: number | null = null
  private scheduledThroughMs = -1

  constructor(
    private readonly transport: AudioTransport,
    private readonly beats: () => readonly Beat[],
  ) {}

  async start(): Promise<void> {
    this.context ??= new AudioContext()
    await this.context.resume()
    this.rebuild()
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.scheduledThroughMs = -1
  }

  rebuild(): void {
    this.stop()
    if (this.transport.media.paused || !this.context) return
    this.scheduleWindow()
    this.timer = window.setInterval(() => this.scheduleWindow(), 25)
  }

  destroy(): void {
    this.stop()
    void this.context?.close()
    this.context = null
  }

  private scheduleWindow(): void {
    if (!this.context || this.transport.media.paused) return
    const mediaNowMs = this.transport.media.currentTime * 1000
    const rate = this.transport.media.playbackRate
    const mediaHorizonMs = mediaNowMs + 150 * rate
    this.beats().forEach((beat) => {
      if (beat.timeMs <= mediaNowMs + 8 || beat.timeMs > mediaHorizonMs || beat.timeMs <= this.scheduledThroughMs) return
      const webAudioTime = this.context!.currentTime + (beat.timeMs - mediaNowMs) / 1000 / rate
      this.click(webAudioTime, beat.isDownbeat)
      this.scheduledThroughMs = beat.timeMs
    })
  }

  private click(at: number, accented: boolean): void {
    if (!this.context) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.frequency.value = accented ? 1320 : 880
    gain.gain.setValueAtTime(accented ? 0.16 : 0.09, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start(at)
    oscillator.stop(at + 0.04)
  }
}
