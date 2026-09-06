import type { AnalysisResult, Milliseconds } from '../domain/types'

export interface AnalysisEngine {
  analyze(pcmPath: string, onProgress?: (percent: number) => void): Promise<AnalysisResult>
  cancel(): void
}

export interface BeatMapVersion {
  readonly id: string
  readonly projectId: string
  readonly analysisRunId: string | null
  readonly parentBeatMapId: string | null
  readonly version: number
  readonly source: 'detector' | 'correction' | 'reset'
  readonly bpm: number | null
  readonly beatsPerBar: number
  readonly beats: readonly Milliseconds[]
  readonly createdAt: string
}

export interface BeatMapCorrection {
  readonly type: 'offset' | 'downbeat' | 'tap-tempo' | 'manual'
  readonly beats: readonly Milliseconds[]
  readonly bpm: number | null
  readonly beatsPerBar: number
}
