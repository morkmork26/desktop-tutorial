import type { Milliseconds } from './types'

export interface Section {
  readonly id: string
  readonly name: string
  readonly ordinal: number
  readonly startMs: Milliseconds
  readonly endMs: Milliseconds
}

export function createSection(
  name: string,
  startMs: Milliseconds,
  endMs: Milliseconds,
  existingSections: readonly Section[],
): Section {
  return {
    id: `section-${crypto.randomUUID().slice(0, 8)}`,
    name,
    ordinal: existingSections.length,
    startMs,
    endMs,
  }
}

export function validateSection(
  section: Pick<Section, 'startMs' | 'endMs'>,
  durationMs: Milliseconds,
): string | null {
  if (section.startMs < 0) return 'Section start must be non-negative.'
  if (section.endMs > durationMs) return 'Section end exceeds song duration.'
  if (section.endMs <= section.startMs) return 'Section end must be after start.'
  if (section.endMs - section.startMs < 500) return 'Section must be at least 500ms.'
  return null
}

export function reorderSections(sections: readonly Section[], fromIdx: number, toIdx: number): Section[] {
  const arr = [...sections]
  const [moved] = arr.splice(fromIdx, 1)
  if (!moved) return arr
  arr.splice(toIdx, 0, moved)
  return arr.map((s, i) => ({ ...s, ordinal: i }))
}
