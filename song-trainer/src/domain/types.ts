export type Milliseconds = number

export interface Beat {
  readonly id: string
  readonly timeMs: Milliseconds
  readonly beatInBar: number
  readonly isDownbeat: boolean
}

export interface LoopRange {
  readonly startMs: Milliseconds
  readonly endMs: Milliseconds
}

export interface TimedSyllable {
  readonly id: string
  readonly text: string
  readonly timeMs: Milliseconds | null
}

export interface AnalysisResult {
  readonly schemaVersion: 1
  readonly durationMs: Milliseconds
  readonly bpm: number | null
  readonly meter: { readonly beatsPerBar: number; readonly beatUnit: 4 }
  readonly beatsMs: readonly Milliseconds[]
  readonly tempoSegments: readonly {
    readonly startMs: Milliseconds
    readonly endMs: Milliseconds
    readonly bpm: number
  }[]
  readonly confidence: number | null
  readonly warnings: readonly string[]
}
