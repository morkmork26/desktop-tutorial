import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export interface NativeTransportSnapshot {
  readonly generation: number
  readonly currentTimeMs: number
  readonly durationMs: number
  readonly paused: boolean
  readonly buffering: boolean
  readonly playbackRate: number
}

interface NativeSongPlugin {
  loadFixture(): Promise<NativeTransportSnapshot>
  play(): Promise<NativeTransportSnapshot>
  pause(): Promise<NativeTransportSnapshot>
  seek(options: { timeMs: number }): Promise<NativeTransportSnapshot>
  setSpeed(options: { rate: number }): Promise<NativeTransportSnapshot>
  setLoop(options: { enabled: boolean; startMs?: number; endMs?: number }): Promise<NativeTransportSnapshot>
  setMetronome(options: { enabled: boolean; volume: number }): Promise<NativeTransportSnapshot>
  getTransportSnapshot(): Promise<NativeTransportSnapshot>
  addListener(
    eventName: 'transportState',
    listener: (snapshot: NativeTransportSnapshot) => void,
  ): Promise<PluginListenerHandle>
}

export const NativeSong = registerPlugin<NativeSongPlugin>('NativeSong')
