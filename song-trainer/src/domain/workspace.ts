import type { BeatMapVersion } from '../analysis/types'
import type { AnalysisResult, LoopRange } from './types'
import type { SyncedLine } from './lyricSync'
import type { PracticeSession } from './practiceSession'
import type { Section } from './sections'

export interface SavedLoop extends LoopRange {
  readonly id: string
  readonly name: string
  readonly kind: 'custom' | 'line' | 'section'
}

export interface ProjectWorkspace {
  readonly analysis: AnalysisResult | null
  readonly beatMaps: readonly BeatMapVersion[]
  readonly lyrics: readonly SyncedLine[]
  readonly sections: readonly Section[]
  readonly loops: readonly SavedLoop[]
  readonly sessions: readonly PracticeSession[]
}

export const emptyWorkspace = (): ProjectWorkspace => ({
  analysis: null,
  beatMaps: [],
  lyrics: [],
  sections: [],
  loops: [],
  sessions: [],
})

export function activeBeatMap(workspace: ProjectWorkspace): BeatMapVersion | null {
  return workspace.beatMaps.at(-1) ?? null
}
