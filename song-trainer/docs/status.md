# Status

## Current checkpoint

All five milestones implemented. V1 feature set is code-complete pending native compilation and Windows QA.

### Implemented and verified

- React 19, TypeScript (strict), Vite, Vitest, ESLint (zero warnings), CSS Modules, design tokens.
- Deterministic 60/90/120 BPM WAV fixture generator with 2-second intros.
- Canonical AudioTransport with shared HTMLMediaElement, loop enforcement, and speed control.
- Web Audio MetronomeScheduler with lookahead scheduling and transport event rebuilding.
- Beat/subdivision utilities with variable spacing, binary search, and loop validation.
- Lyric tokenization preserving punctuation, apostrophes, and line membership.
- Waveform display via WaveSurfer with beat markers, loop handles (container-relative), and playhead.
- BeatGrid pulse visualization with quarter/eighth/sixteenth modes.
- Project repository layer: SQL (Tauri) and in-memory (browser) implementations.
- Zustand app store with library/project view routing.
- Import adapter abstraction for browser file picker and Tauri native dialog.
- Library UI with search, import, project cards, and delete confirmation.
- Browser-based tempo detection via autocorrelation and beat generation.
- Beat correction: global offset, downbeat anchor, tap tempo, validation, version tracking.
- BeatEditor component with all correction tools.
- Lyric sync domain: synced lines, syllable split/merge, tap sync, nudge, clear range.
- LyricSync component with keyboard-first tap workflow and syllable seeking.
- Section management with validation and reordering.
- Practice session tracking with cumulative stats and time formatting.
- Project export/import with schema validation.
- PracticeView with live syllable highlighting and section navigation.
- Settings panel: count-in, default speed, metronome volume, reduced motion.
- Rust import module: WAV/MP3 validation, atomic copy, rollback, duplicate-safe naming.
- Rust source formatted with cargo fmt.
- SQLite V1 migration with full relational schema.

### Verification

- 49 Vitest tests across 10 test files, all passing.
- Strict TypeScript with noUncheckedIndexedAccess and exactOptionalPropertyTypes.
- ESLint with zero warnings (recommendedTypeChecked + react-hooks + react-refresh).
- Vite production build succeeds.
- Cargo fmt check passes.

### Pending

- Native Tauri compilation (requires system dev headers: pkg-config, libglib2.0-dev, libgtk-3-dev, libwebkit2gtk-4.1-dev, gcc).
- Cargo test and cargo check (blocked by missing C compiler and dev headers).
- Python/librosa analyzer sidecar (browser stub exists; Tauri sidecar needs PyInstaller packaging).
- Windows WebView2 audio QA (drift, seek recovery, pitch preservation at all speeds).
- GitHub Actions CI pipeline.
- Unsigned NSIS installer artifact.

## Last Updated

2026-09-06
