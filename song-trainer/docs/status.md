# Status

## Current checkpoint

Android-only rebaseline in progress. The former Windows/Tauri prototype is not V1-complete and is not the target architecture.

## Verified reusable baseline

- React 19, strict TypeScript, Vite, Vitest, ESLint, CSS Modules, and design tokens.
- Tested domain logic for original-media timing, subdivisions, loops, lyric parsing/sync, beat corrections, sections, sessions, and metadata validation.
- Reusable library, beat, lyric, practice, settings, beat-grid, and waveform concepts.
- Deterministic legal 60/90/120 BPM WAV fixture generator with two-second intro.
- Working-tree fixes for SQL call shape, stable Zustand selectors, zero-millisecond lyric nudging, and separate downbeat anchoring.
- Last clean checkpoint before the platform change: typecheck, lint, and 53 Vitest tests passed on 2026-09-07. This evidence becomes stale after migration source changes.

## Not implemented for Android

- Capacitor Android project and typed Kotlin plugin.
- Media3 transport and native click-mixing synchronization spike.
- Android document import/private copy.
- Room database and migrations.
- MediaCodec PCM decoding, waveform peak cache, and offline beat analyzer.
- Integrated saved workflow across Practice, Beats, Lyrics, and More.
- Android adaptive/accessibility pass, native integration tests, CI, APK/AAB, and physical-device audio QA.

## Retired work

Tauri/Rust, HTMLMediaElement as production clock, Web Audio metronome, Python/librosa sidecar, WebView2 QA, and NSIS installer work are retired. Keep those files temporarily only as reference until the Android audio spike passes.

## Next gate

Finish documentation agreement and preserve platform-neutral fixes, then scaffold Capacitor Android and prove the Media3/click processor architecture on a physical Android device before migrating the remaining screens.

Last updated: 2026-09-07
