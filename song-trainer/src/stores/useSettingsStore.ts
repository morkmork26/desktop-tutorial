import { create } from 'zustand'

interface Settings {
  countInBeats: number
  defaultSpeed: number
  metronomeVolume: number
  reducedMotion: boolean
  setCountInBeats: (beats: number) => void
  setDefaultSpeed: (speed: number) => void
  setMetronomeVolume: (volume: number) => void
  setReducedMotion: (enabled: boolean) => void
}

export const useSettingsStore = create<Settings>((set) => ({
  countInBeats: 4,
  defaultSpeed: 1,
  metronomeVolume: 0.5,
  reducedMotion: false,
  setCountInBeats(beats) { set({ countInBeats: Math.max(0, Math.min(8, beats)) }) },
  setDefaultSpeed(speed) { set({ defaultSpeed: Math.max(0.25, Math.min(1, speed)) }) },
  setMetronomeVolume(volume) { set({ metronomeVolume: Math.max(0, Math.min(1, volume)) }) },
  setReducedMotion(enabled) { set({ reducedMotion: enabled }) },
}))
