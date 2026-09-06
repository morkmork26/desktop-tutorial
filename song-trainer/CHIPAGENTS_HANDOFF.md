# Rhythm Song Trainer V1 — ChipAgents Development Handoff

Purpose: Give the next coding agent enough verified context, product intent, architecture, sequencing, and recovery information to continue this repository without relying on the prior chat.

Read this after the root `AGENTS.md`. Treat code and executed tests as evidence; treat roadmap items as planned until their acceptance checks pass.

## 1. Mission and finish line

Build a private, desktop-first Windows 11 practice application for a singer who knows a song but struggles with rhythmic phrasing. The V1 finish line is a complete local workflow:

```text
import WAV/MP3
  → analyze tempo and explicit beats
  → manually correct the beat map
  → paste and synchronize lyric syllables
  → loop a phrase, slow playback, and hear a synchronized metronome
  → close and reopen without losing work
```

Product name: **Rhythm Song Trainer**  
Repository: `morkmork26/song-trainer`  
Canonical local path: `/home/morkmork26/projects/song-trainer`  
Target: single-user, local-only, unsigned Windows 11 desktop application  
License: MIT for source code only; user-imported audio and lyrics are not licensed with the code

No server, login, analytics, telemetry, hidden network traffic, downloading, or lyric scraping belongs in V1.

## 2. Start here — takeover protocol

1. Read `AGENTS.md`, this handoff, `docs/00-project-memory/active-task.md`, and `docs/00-project-memory/current-state.md`.
2. Inspect `git status --short --branch`. Do not discard existing work. The initial checkpoint may still be uncommitted.
3. Run the available PMM upgrade/recovery command if that runtime exists. If it does not, use the project files directly and keep the active-task checkpoint accurate.
4. Generate legal fixtures with `npm run fixtures`; the WAV binaries are intentionally ignored by Git.
5. Re-run frontend checks before changing shared timing code.
6. Install platform prerequisites and validate the Tauri host before building more UI.
7. Work milestone by milestone. Do not call a feature complete because source exists; record executable evidence.

Baseline commands:

```bash
npm install
npm run fixtures
npm run typecheck
npm run lint
npm test
npm run build

rustup component add rustfmt
cd src-tauri
cargo fmt --all -- --check
cargo test --all-targets
cargo check
```

On Debian/Ubuntu/WSL, native Tauri compilation also needs the current Tauri 2 Linux development prerequisites. At this checkpoint, compilation specifically stopped because `pkg-config` was missing while `glib-sys` looked for GLib. Install the official prerequisite set appropriate to the distro rather than patching around those build scripts. Windows installer verification must run on Windows or GitHub Actions.

## 3. Truthful current state

### Implemented and frontend-verified

- Strict React 19, TypeScript, Vite, Vitest, ESLint, and CSS Modules foundation.
- Deterministic, generated 60/90/120 BPM WAV fixtures with a two-second silent intro and accented 4/4 downbeats.
- `AudioTransport` around one shared `HTMLAudioElement`.
- Media-clock playhead and explicit beat/subdivision activation.
- WaveSurfer v7 using the same media element as the transport.
- 50%, 75%, and 100% playback rate controls with `preservesPitch` requested.
- Phrase loop boundary and metronome scheduler using Web Audio lookahead.
- Unit coverage for steady and variable beat spacing, empty/single-beat maps, loop validation, playback-speed timing invariance, and lyric tokenization.
- Initial Tauri host source, restricted capability declaration, native import command, and comprehensive V1 SQLite migration.
- Rust tests in source for WAV validation, extension/header mismatch, duplicate-safe names, atomic copy completion, and partial-file absence.
- Product, architecture, timing, design, format, decision, status, QA, and project-memory documentation.

Most recent executed frontend evidence before this handoff:

```text
npm run typecheck  PASS
npm run lint       PASS
npm test           PASS — 2 files, 6 tests
npm run build      PASS — Vite production bundle generated
```

### Present in source but not yet proven

- Tauri host compilation and execution.
- SQLite plugin capability names and migration execution against a real app database.
- Native dialog → Rust import command → stored project transaction.
- Actual fixture playback and audible metronome alignment in a browser/WebView2.
- Loop boundary dragging correctness; the first spike implementation uses viewport coordinates and should be replaced with waveform-container coordinates or WaveSurfer Regions.
- Pitch preservation quality on Windows WebView2.

### Not implemented yet

- Typed `ProjectRepository` implementations and project-library screens.
- Symphonia WAV/MP3 decode to mono PCM, cache versioning, and waveform peak cache.
- Python/librosa analyzer, JSON contract, progress/cancellation, PyInstaller sidecar, and analyzer tests.
- Beat-map version operations, correction UI, undo/reset, offset/downbeat/tap-tempo/reanalysis tools.
- Lyric documents, line editing/reordering, syllable split/merge, tap synchronization, nudging, range resync, and marker drag.
- Full practice screen with sections, line/section loops, count-in, keyboard shortcuts, history, difficult sections, settings, metadata import/export, and recovery screens.
- React Testing Library integration coverage, Playwright browser flows, Windows workflow, tagged installer workflow, and manual Windows audio QA.

### Environment evidence and blockers

- Node `v24.20.0` and npm `11.19.0` are installed.
- Rust `1.98.1` and Cargo `1.98.1` are installed under `/home/morkmork26/.cargo/bin`.
- Python `3.14.4` is installed; librosa compatibility must be checked before locking the analyzer environment. A supported Python sidecar version may need to be pinned independently.
- Rust dependencies downloaded and `src-tauri/Cargo.lock` was generated.
- `cargo test --all-targets` reached native dependency compilation, then stopped because `pkg-config`/GLib development prerequisites were unavailable.
- `cargo fmt --check` could not run because the minimal Rust profile does not include `rustfmt`.
- No browser or Windows WebView2 audio QA has been claimed.

## 4. Non-negotiable architecture

### One canonical song clock

`HTMLMediaElement.currentTime` is the canonical media position. Waveform progress, current beat, active subdivision, lyric activation, sections, and loop boundaries derive from it. Never introduce a separate timer that accumulates song position.

The Web Audio clock is used only for precise future click scheduling:

```text
click AudioContext time
  = AudioContext.currentTime
  + (future beat media time − current media time) / playbackRate
```

Pause, resume, seek, speed change, and loop restart must clear the scheduler cursor and rebuild the lookahead window. Timing persisted to disk always remains integer milliseconds in original-media time; playback speed never rewrites it.

### Native trust boundary

```text
selected user file
  → Rust checks regular file + allowed extension + matching header
  → Rust generates the app-owned destination name
  → copy to a `.part` file, flush, and atomically rename
  → only then insert/update SQLite in one transaction
```

The frontend must not receive broad filesystem access. Do not add arbitrary shell permissions. App-owned audio/cache directories and the database are the only persistent native scope. Analysis receives an app-generated PCM file path, never a user-constructed command.

### Analysis boundary

Rust/Symphonia decodes supported WAV/MP3 input into the normalized mono PCM expected by the analyzer. The packaged Python/librosa sidecar returns a versioned transport result, not the frontend's internal model. Rust/TypeScript validate and normalize this JSON before persistence.

Required `AnalysisResult` fields:

- schema version
- duration in integer milliseconds
- BPM or `null`
- editable meter defaulting to 4/4
- explicit beat timestamps
- tempo segments
- warnings
- confidence or `null`

Librosa is advisory. It does not establish reliable meter, downbeats, or a trustworthy universal confidence score. Preserve raw detector output and require user confirmation/correction.

### Persistence model

Use the official Tauri SQLite plugin behind typed repositories. The first migration already declares projects, analysis runs, versioned beat maps/beats, lyric documents/lines/tokens/syllables, sections, loops, practice sessions, and settings.

Rules:

- UUID text identifiers for project and editable-domain records.
- ISO timestamps for metadata.
- Integer original-media milliseconds for all timing.
- Immutable detector analysis and beat-map roots.
- Every accepted correction creates a validated new beat-map version.
- Full reset selects/copies the immutable detector map; it never deletes the detector record.
- Cache artifacts carry explicit versions and are rebuildable.
- Metadata exports omit audio.

## 5. Full implementation plan I would follow

### Milestone 1 — Foundation and synchronization spike

Goal: prove the audio model before investing in polished screens.

1. Finish Linux/WSL native prerequisites, add `rustfmt`, and make Cargo formatting/tests/checks pass.
2. Fix any Tauri 2 configuration or plugin capability errors with minimal permissions.
3. Add focused tests for `AudioTransport` transitions and `MetronomeScheduler` mapping. Make Web Audio factories injectable so tests can inspect scheduled times without claiming audible correctness.
4. Replace loop-handle viewport math with WaveSurfer Regions or container-local coordinates.
5. Add keyboard transport controls and accessible state labels.
6. Perform browser visual/interaction smoke at desktop and tablet widths.
7. Perform the first Windows WebView2 QA: pause/resume, seek, 50/75/100%, loop restart, headphones/speakers, and two-minute drift.
8. If synchronized behavior fails, stop and change the transport architecture before milestone 2.

Acceptance:

- One media element serves transport and waveform.
- Markers and subdivision stay on the media clock.
- Metronome reschedules after every transport discontinuity.
- Stored beat times are byte-for-byte unchanged across speed changes.
- Windows listening results are written in `docs/audio-qa.md`; pitch preservation is not marketed before it passes.

### Milestone 2 — Local library, import, and persistence

1. Define typed frontend repository and native adapter interfaces before UI screens.
2. Connect the native open dialog to `import_audio`; distinguish cancellation from failure.
3. Complete WAV/MP3 validation, size/error reporting, app-data path construction, atomic-copy rollback, and cleanup tests.
4. Run SQLite migration transaction tests against a temporary database, including rerun/idempotency and foreign-key deletion behavior.
5. Commit the database row only after copy success. If database insertion fails after copy, remove or quarantine the orphan safely.
6. Build project creation, list/search, recent ordering, analysis status, delete confirmation, and reopen flows.
7. Add missing-audio recovery by relinking a compatible source or removing the project; never silently change timing.
8. Add cache-version types for peaks and analysis artifacts outside SQLite.

Data flow to verify:

```text
dialog path → Rust validation → atomic managed copy → SQLite transaction
            → repository reload → library card → reopen after process restart
```

### Milestone 3 — Analysis, waveform, and beat correction

1. Decode WAV/MP3 with Symphonia into documented mono PCM (sample rate and sample type explicit).
2. Implement a small versioned Python CLI that reads only the generated PCM and writes JSON to stdout. Put progress events on stderr or a structured side channel so result JSON remains parseable.
3. Add cancellation that terminates only the known child process and cleans temporary PCM/output.
4. Package with PyInstaller as a Tauri sidecar; name binaries according to Tauri target-triple rules.
5. Test generated 60/90/120 fixtures. Keep the target visible: BPM error ≤1 and median nearest-beat error ≤50 ms. Do not relax a failing target to manufacture success.
6. Normalize analyzer warnings for empty detection, suspicious tempo, decode failure, and unstable intervals.
7. Build waveform zoom/seek and editable beat UI: click preview, global offset, downbeat anchor, tap tempo, BPM-guided reanalysis, undo, reset.
8. Validate every corrected map: sorted unique nonnegative beats, legal meter positions, project duration bounds, and version lineage.

### Milestone 4 — Lyrics and synchronization

1. Preserve original pasted text, line breaks, and punctuation.
2. Tokenize whitespace while retaining apostrophes and internal hyphens; keep normalization separate from display text.
3. Add sections and line reorder/edit operations without losing stable IDs or existing timing unnecessarily.
4. Add manual syllable split/merge and explicit unsynced/partially synced states.
5. Implement keyboard-first tap sync using the current media time, automatic token advance, undo, timestamp nudging, selected-range resync, marker dragging, and line preview.
6. Apply the precedence rule: syllable timing overrides word timing when present; unsynced timing is never presented as measured.
7. Save incrementally through repository transactions and prove reopen retains all structure/timing.

### Milestone 5 — Practice workflow and V1 completion

1. Build the hero practice screen with stable lyric lines, current syllable emphasis, quarter/eighth/sixteenth grids, section navigation, speed presets, metronome, and count-in.
2. Implement custom, lyric-line, and section loops with validated boundaries and scheduler rebuild on every restart.
3. Add lightweight practice history and user-marked difficult sections.
4. Add settings, shortcut help, reduced motion, and responsive tablet/mobile-width layouts.
5. Add metadata-only project export/import with full-document validation and schema versions; never bundle audio.
6. Harden recovery for invalid metadata, missing audio, analyzer crash/cancellation, failed import cleanup, cache corruption, and unsupported future migrations.
7. Add CI: fast frontend/Python/Rust checks in suitable environments and Windows Tauri compilation at verified checkpoints.
8. Produce unsigned NSIS artifacts only on milestone tags. Do not present unsigned builds as code-signed.

Deferred after V1: automated progressive-speed training, microphone scoring, pitch grading, cloud features, accounts, downloading, lyric scraping, automatic structure detection, and automatic meter detection.

## 6. Verification matrix

### TypeScript/Vitest

- beat lookup and active subdivisions
- offsets and explicit variable spacing
- empty and single-beat maps
- loop bounds and restart behavior
- speed invariants
- lyric token/syllable activation precedence
- repository serialization and schema rejection
- beat-map correction lineage and reset

### Rust

- extension plus content-header validation
- regular-file checks and app-owned destination construction
- duplicate-safe names
- partial-copy rollback and orphan cleanup
- Symphonia WAV/MP3 decoding to the documented PCM contract
- cache version/read/write/corruption behavior
- fresh migration and sequential upgrades
- transaction rollback and foreign-key behavior
- analyzer process cancellation and cleanup

### Python

- schema-valid JSON for silence, clicks, and invalid input
- 60/90/120 generated fixtures
- BPM error ≤1 BPM
- median nearest-beat error ≤50 ms
- visible warning behavior for empty/unstable detection

### Integration and UI

- import → analyze → save → close → reopen
- cancellation and analyzer failure
- playback/pause/seek/rate/metronome transitions
- loop restart with metronome
- lyric sync, undo, resync, save, reopen
- project deletion and managed-audio cleanup
- missing audio and damaged metadata recovery
- desktop/tablet responsive layout, keyboard-only access, visible focus, reduced motion

Browser mocks may prove frontend contracts only. They are never evidence that native dialogs, filesystem protection, SQLite, sidecars, WebView2 audio, or Windows installers work.

## 7. Important source map

- `src/audio/AudioTransport.ts` — shared media element, canonical snapshot, playback/rate/seek/loop controls.
- `src/audio/MetronomeScheduler.ts` — media-to-Web-Audio click scheduling.
- `src/domain/timing.ts` — beat/subdivision, loop, and syllable timing utilities.
- `src/domain/lyrics.ts` — preservation-oriented lyric tokenization.
- `src/components/Waveform.tsx` — WaveSurfer plus beat, loop, and playhead overlay; loop drag needs correction.
- `src/App.tsx` — temporary synchronization-lab composition, not the final V1 application shell.
- `src-tauri/src/import.rs` — WAV/MP3 validation and atomic managed copying.
- `src-tauri/src/lib.rs` — Tauri plugins, migration registration, and native import command.
- `src-tauri/migrations/0001_v1.sql` — first complete relational schema.
- `scripts/generate-audio-fixtures.mjs` — deterministic legal timing fixtures.
- `PRD.md` — durable product requirements.
- `docs/architecture.md`, `docs/timing.md`, `docs/project-format.md` — technical contracts.
- `docs/audio-qa.md` — manual Windows acceptance checklist.
- `docs/00-project-memory/active-task.md` — current execution/recovery checkpoint.

## 8. Known review points before expansion

- Confirm exact Tauri plugin capabilities generated by the locked dependency versions; do not broaden permissions to silence an error.
- Ensure the native import command cannot overwrite existing files and that cleanup is covered for every failure boundary.
- Decide the correct rollback when copy succeeds but SQLite insertion fails; implement and test it explicitly.
- Replace viewport-based loop drag calculations.
- Make scheduled metronome nodes trackable if tests show stale clicks after seek/loop within the lookahead horizon.
- Keep high-frequency transport state out of a global Zustand store to avoid rendering the full app every animation frame.
- Verify Python 3.14 support before selecting analyzer dependencies; a separate pinned sidecar Python version is acceptable and likely safer.
- Never claim MP3 decoding until Symphonia tests use a legal generated/encoded MP3 fixture.
- Never claim pitch-preserving slowdown or drift quality until Windows listening QA passes.

## 9. Recommended commits

Keep each milestone portfolio-quality and independently reviewable. Suggested outcomes:

1. `Establish media-clock synchronization spike`
2. `Add safe local song import and project persistence`
3. `Integrate versioned beat analysis and correction tools`
4. `Add lyric and syllable synchronization workflow`
5. `Complete focused practice workflow and Windows release checks`

Each commit or pull request should state what changed, why it matters to the singer, and exactly how it was verified. Do not push generated audio, private songs, databases, caches, analyzer builds, or secrets.

## 10. First prompt for the receiving agent

Use this as the first task message after opening the repository:

> Continue Rhythm Song Trainer V1 from the repository state. Read `AGENTS.md`, `CHIPAGENTS_HANDOFF.md`, and the PMM hot-path files first. Preserve all existing work. Start by completing Milestone 1 verification: install/confirm the platform prerequisites, run Rust formatting/tests/checks, inspect and fix only evidenced Tauri/config failures, correct waveform loop-coordinate handling, add focused transport/metronome tests, and verify the synchronization lab. Do not build Milestone 2 screens until the shared-clock spike passes. Record truthful evidence and remaining Windows-only QA in the project state.
