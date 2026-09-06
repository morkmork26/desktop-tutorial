import { useSyncExternalStore } from 'react'
import type { AudioTransport } from './AudioTransport'

export function useTransport(transport: AudioTransport) {
  return useSyncExternalStore(
    (listener) => transport.subscribe(listener),
    transport.getSnapshot,
    transport.getSnapshot,
  )
}
