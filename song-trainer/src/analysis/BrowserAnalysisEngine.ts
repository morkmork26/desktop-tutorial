import type { AnalysisResult } from '../domain/types'
import type { AnalysisEngine } from './types'

export class BrowserAnalysisEngine implements AnalysisEngine {
  private cancelled = false

  async analyze(audioUrl: string, onProgress?: (percent: number) => void): Promise<AnalysisResult> {
    this.cancelled = false
    onProgress?.(10)

    const context = new OfflineAudioContext(1, 1, 44100)
    const response = await fetch(audioUrl)
    const buffer = await response.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(buffer)
    const durationMs = Math.round(audioBuffer.duration * 1000)

    if (this.cancelled) throw new Error('Analysis cancelled')
    onProgress?.(30)

    const pcm = audioBuffer.getChannelData(0)
    const sampleRate = audioBuffer.sampleRate
    const bpm = detectTempo(pcm, sampleRate)

    if (this.cancelled) throw new Error('Analysis cancelled')
    onProgress?.(70)

    const beats = generateBeats(bpm, durationMs)
    onProgress?.(100)

    return {
      schemaVersion: 1,
      durationMs,
      bpm,
      meter: { beatsPerBar: 4, beatUnit: 4 },
      beatsMs: beats,
      tempoSegments: [{ startMs: 0, endMs: durationMs, bpm }],
      confidence: null,
      warnings: ['Browser analysis is approximate. Review and correct beats manually.'],
    }
  }

  cancel(): void {
    this.cancelled = true
  }
}

function detectTempo(pcm: Float32Array, sampleRate: number): number {
  const hopSize = Math.floor(sampleRate / 10)
  const energies: number[] = []

  for (let i = 0; i < pcm.length; i += hopSize) {
    let sum = 0
    const end = Math.min(i + hopSize, pcm.length)
    for (let j = i; j < end; j++) {
      sum += (pcm[j] ?? 0) * (pcm[j] ?? 0)
    }
    energies.push(sum / (end - i))
  }

  const onsets: number[] = []
  for (let i = 1; i < energies.length; i++) {
    const diff = (energies[i] ?? 0) - (energies[i - 1] ?? 0)
    if (diff > 0) onsets.push(diff)
    else onsets.push(0)
  }

  let bestBpm = 120
  let bestCorrelation = -1

  for (let bpm = 60; bpm <= 200; bpm++) {
    const lagSamples = (60 / bpm) * 10
    let correlation = 0
    let count = 0
    for (let i = 0; i < onsets.length - Math.ceil(lagSamples); i++) {
      correlation += (onsets[i] ?? 0) * (onsets[i + Math.round(lagSamples)] ?? 0)
      count++
    }
    if (count > 0) correlation /= count
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestBpm = bpm
    }
  }

  return bestBpm
}

function generateBeats(bpm: number, durationMs: number): number[] {
  const intervalMs = 60_000 / bpm
  const beats: number[] = []
  for (let t = 0; t <= durationMs; t += intervalMs) {
    beats.push(Math.round(t))
  }
  return beats
}
