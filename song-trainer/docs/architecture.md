# Android Architecture

## Chosen stack

- React 19 + strict TypeScript + Vite for the existing reusable UI and domain logic.
- Capacitor 8 as the Android-only native container and typed JavaScript/Kotlin bridge.
- Kotlin native plugin for import, decoding/analysis, transport, metronome, waveform cache, and repository calls.
- Jetpack Media3 ExoPlayer for playback, seeking, loops, and pitch-preserving speed control.
- A custom Media3 `AudioProcessor` for click mixing before Media3's Sonic speed processor.
- Room over private SQLite for transactional data and migration validation.
- Android Storage Access Framework for audio import and metadata export/import.

Capacitor is selected because it can be added to the existing Vite app and supports custom Android code. The app is not intended to run as a website; browser adapters are test harnesses only.

## Runtime boundary

```text
Android document picker returns content:// URI
  → Kotlin validates header and streams to filesDir/audio/*.part
  → fsync + atomic rename
  → MediaExtractor/MediaCodec decode mono PCM
  → local onset/tempo/beat analyzer + versioned waveform peaks
  → Kotlin validates result and Room commits metadata
  → typed Capacitor bridge returns project/workspace snapshots
  → React renders library, editor, and practice screens

Media3 ExoPlayer (authoritative position)
  → custom click AudioProcessor reads explicit beat timestamps
  → SonicAudioProcessor applies speed with pitch = 1.0
  → native transport snapshots
  → React playhead, lyrics, beat pulse, sections, and loop UI
```

## Clock contract

`NativeAudioTransport` is the only authority for playback position, duration, playing/buffering state, speed, volume, and loop restarts. React may request a snapshot on animation frames for smooth drawing, but it uses the returned native position and never adds wall-clock elapsed time to invent one.

Events are emitted on load, ready, play, pause, seek completion, discontinuity, speed change, loop restart, end, and error. Every event carries a monotonically increasing generation; React ignores stale events from an earlier load or seek.

The metronome is not a second player or JavaScript timer. A custom PCM processor mixes accent and regular click samples at explicit beat timestamps before Media3 applies speed. Media3 provides the processor's exact post-flush media origin through `StreamMetadata.positionOffsetUs`, so load, seek, and loop discontinuities reset the click cursor to the pipeline's actual position. This should preserve alignment through seek, looping, and rate changes. The synchronization spike must prove the design on physical Android hardware before editors are migrated.

## Native plugin surface

```ts
interface NativeSongPlugin {
  importAudio(): Promise<ImportedAudio>
  analyze(projectId: string): Promise<void>
  cancelAnalysis(projectId: string): Promise<void>
  load(projectId: string): Promise<TransportSnapshot>
  play(): Promise<void>
  pause(): Promise<void>
  seek(timeMs: number): Promise<void>
  setSpeed(rate: 0.5 | 0.75 | 1): Promise<void>
  setLoop(loop: LoopRange | null): Promise<void>
  setMetronome(enabled: boolean, volume: number): Promise<void>
  getTransportSnapshot(): Promise<TransportSnapshot>
  listProjects(): Promise<ProjectRecord[]>
  loadWorkspace(projectId: string): Promise<ProjectWorkspace>
  saveWorkspace(command: WorkspaceMutation): Promise<ProjectWorkspace>
}
```

The bridge exchanges schema-versioned JSON DTOs. Kotlin/Room entities never leak into React. Mutation commands are narrow and validated natively; React cannot submit arbitrary SQL or filesystem paths.

## Analysis strategy

Python and PyInstaller are removed because an Android sidecar is not a viable V1 runtime. Android's MediaExtractor/MediaCodec decodes WAV/MP3 to mono float PCM. A deterministic app-owned analyzer computes:

1. short-time energy and a spectral-flux-style onset envelope;
2. adaptive onset thresholding;
3. tempo candidates from autocorrelation within 60–200 BPM;
4. phase selection against onset peaks;
5. explicit beat timestamps and interval-stability warnings.

Legal 60/90/120 BPM fixtures remain the objective baseline. Detection that misses the accuracy threshold stays visibly failed; it is never replaced silently with 120 BPM. Manual tap tempo, offset, and downbeat tools remain first-class recovery.

## Storage and privacy

- `filesDir/audio/`: UUID-named private imports.
- `cacheDir/waveforms/v1/`: regenerable peak arrays.
- Room: projects, immutable analysis runs, versioned beat maps, lyrics, sections, loops, sessions, settings.
- Export: schema-versioned metadata JSON selected through `ACTION_CREATE_DOCUMENT`; audio omitted.
- No `INTERNET`, broad media, microphone, location, or contacts permission.
- Project deletion removes Room data and private audio through one user-confirmed workflow and reports partial cleanup failures.

## Reuse map

Keep with small or no changes:

- Domain types, integer-millisecond timing, lyric tokenization/sync, beat correction, sections/loops/sessions, export validation, Zustand low-frequency state, design tokens, React components, and Vitest tests.

Refactor:

- `AudioTransport` behind a transport interface with browser-fixture and Capacitor-native implementations.
- `ProjectRepository` into a Capacitor DTO adapter backed by Room.
- `Waveform` into a canvas/SVG renderer fed by cached peaks; remove media-element ownership.
- Library import into the Android native plugin.
- Navigation/layout for compact and expanded Android windows.

Remove only after the Android synchronization spike passes:

- `src-tauri/`, Tauri packages/config/capabilities, Rust SQL/import code, NSIS workflows, the Python sidecar plan, and WaveSurfer media integration.

## Quality gates

1. Architecture: Capacitor Android shell builds and no Tauri import reaches production code.
2. Audio spike: the 120 BPM fixture passes two-minute drift, seek, loop, and 50/75/100% tests on hardware.
3. Persistence: Room migration and process-relaunch integration tests pass.
4. Workflow: complete offline V1 flow passes at phone and tablet widths.
5. Release: lint/tests/debug APK/release AAB pass and physical-device QA is recorded.
