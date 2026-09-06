# Status

## Current checkpoint

Android milestone A1 is code-complete and CI-verified; physical-device synchronization QA is required before A2. The former Windows/Tauri prototype is not the target architecture.

## Verified reusable baseline

- React 19, strict TypeScript, Vite, Vitest, ESLint, CSS Modules, and design tokens.
- Tested domain logic for original-media timing, subdivisions, loops, lyric parsing/sync, beat corrections, sections, sessions, and metadata validation.
- Reusable library, beat, lyric, practice, settings, beat-grid, and waveform concepts.
- Deterministic legal 60/90/120 BPM WAV fixture generator with two-second intro.
- Working-tree fixes for SQL call shape, stable Zustand selectors, zero-millisecond lyric nudging, and separate downbeat anchoring.
- Last clean checkpoint before the platform change: typecheck, lint, and 53 Vitest tests passed on 2026-09-07. This evidence becomes stale after migration source changes.

## Android A1 implemented and verified

- Capacitor 8.4.3 Android shell, minimum API 29, target/compile API 36.
- Offline manifest with no internet or broad storage permission and Android backup disabled.
- Kotlin Capacitor plugin with Media3 load/play/pause/seek/speed/loop/metronome controls and generation-tagged snapshots.
- PCM click processor inserted before Sonic speed adjustment and reset from Media3 `StreamMetadata.positionOffsetUs`.
- React native synchronization screen for the 120 BPM/two-second-intro fixture.
- Repository-root GitHub Actions workflow now runs frontend and Android gates.
- CI run 34059849771 passed TypeScript, lint, 53 Vitest tests, web build, Kotlin/Gradle tests, Android lint, debug APK, release AAB, and artifact upload.
- `npm audit` reports zero known vulnerabilities for the pinned dependency set.

## Not implemented for Android

- Android document import/private copy.
- Room database and migrations.
- MediaCodec PCM decoding, waveform peak cache, and offline beat analyzer.
- Integrated saved workflow across Practice, Beats, Lyrics, and More.
- Android adaptive/accessibility pass, native integration tests, CI, APK/AAB, and physical-device audio QA.

## Retired work

Tauri/Rust, HTMLMediaElement as production clock, Web Audio metronome, Python/librosa sidecar, WebView2 QA, and NSIS installer work are retired. Keep those files temporarily only as reference until the Android audio spike passes.

## Next gate

Install the CI debug APK on physical Android hardware and run the synchronization section of `docs/audio-qa.md`. If it passes, proceed to A2 import and Room persistence. If it fails, repair the audio pipeline before migrating editors.

Last updated: 2026-09-07
