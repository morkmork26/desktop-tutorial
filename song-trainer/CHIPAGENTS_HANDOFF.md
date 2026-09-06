# Rhythm Song Trainer V1 — Codex Continuation Handoff

Purpose: Give the next coding agent enough verified context to continue this repository.

## 1. Mission and finish line

Build a private, desktop-first Windows 11 practice application for a singer who struggles with rhythmic phrasing. The V1 workflow:

```text
import WAV/MP3
  → analyze tempo and explicit beats
  → manually correct the beat map
  → paste and synchronize lyric syllables
  → loop a phrase, slow playback, hear a synchronized metronome
  → close and reopen without losing work
```

Repository: `morkmork26/desktop-tutorial/song-trainer`
Target: single-user, local-only, unsigned Windows 11 desktop application
License: MIT for source code; user audio/lyrics are private

No server, login, analytics, telemetry, or network access in V1.

## 2. What is done (all 5 milestones code-complete)

### M1: Foundation and synchronization spike
- React 19, TypeScript (strict), Vite, Vitest, ESLint (zero warnings), CSS Modules
- Deterministic 60/90/120 BPM WAV fixture generator
- Canonical AudioTransport with shared HTMLMediaElement
- Web Audio MetronomeScheduler with lookahead scheduling
- Beat/subdivision utilities with variable spacing
- WaveSurfer waveform with beat markers, loop handles (container-relative), playhead
- BeatGrid pulse visualization (quarter/eighth/sixteenth)
- 9 AudioTransport tests, 7 MetronomeScheduler tests
- Cargo fmt passes

### M2: Local library, import, and persistence
- ProjectRepository interface with SQL (Tauri) and in-memory (browser) implementations
- Zustand app store with library/project view routing
- Import adapter abstraction (browser file picker + Tauri native dialog)
- Library UI with search, import, project cards, delete confirmation
- 7 MemoryProjectRepository tests

### M3: Analysis, waveform, and beat correction
- Browser-based tempo detection via autocorrelation
- Beat correction: global offset, downbeat anchor, tap tempo, validation
- BeatEditor component with all correction tools
- 4 beat correction tests

### M4: Lyrics and synchronization
- Lyric sync domain: synced lines, syllable split/merge, tap sync, nudge, clear
- LyricSync component with keyboard-first tap workflow
- 7 lyric sync tests

### M5: Practice workflow and V1 completion
- Section management with validation and reordering
- Practice session tracking with cumulative stats
- Project export/import with schema validation (rhythm-song-trainer/project v1)
- PracticeView with live syllable highlighting and section navigation
- Settings panel: count-in, default speed, metronome volume, reduced motion
- 3 section tests, 3 practice session tests, 3 export/import tests

### Rust backend (existing from initial checkpoint)
- Safe WAV/MP3 import: validation, atomic copy, rollback, duplicate-safe naming
- SQLite V1 migration with full relational schema
- Tauri 2 host with restricted capabilities
- 3 Rust import tests
- Source formatted with cargo fmt

### Verification summary
- 49 Vitest tests across 10 files, all passing
- Strict TypeScript (noUncheckedIndexedAccess, exactOptionalPropertyTypes)
- ESLint zero warnings (recommendedTypeChecked + react-hooks + react-refresh)
- Vite production build passes
- Cargo fmt check passes
- GitHub Actions CI configured (frontend + Rust + Windows build on tags)

## 3. What remains

### Must do before V1 release
1. **Cargo test and cargo check** - SSL cert issue on dev machine; set `CARGO_HTTP_CAINFO` to a valid CA bundle, then run `cargo test --all-targets && cargo check`
2. **Wire BeatEditor, LyricSync, PracticeView, and Settings into the main App** - Components exist but App.tsx currently only shows LibraryView and SyncLab; needs project-level view with tabs/panels for all editors
3. **Connect analysis engine to import flow** - BrowserAnalysisEngine exists but is not called after import; need to analyze on import, store results, update project status
4. **Python/librosa sidecar** - Browser stub works; Tauri needs PyInstaller-packaged sidecar for production analysis
5. **Windows audio QA** - Run checklist in `docs/audio-qa.md` on Windows 11

### Should do
6. **Keyboard shortcuts** - Transport controls (Space=play/pause, Left/Right=seek, etc.)
7. **Count-in metronome** - Use settings store countInBeats before playback starts
8. **Metadata export/import UI** - Domain logic exists, needs file save/load buttons
9. **Missing audio recovery** - Detect missing audio file on project open, offer relink
10. **Responsive tablet/mobile layout** - Base CSS exists, needs testing and polish

### Nice to have
11. **Undo/redo for beat corrections** - Version tracking exists in schema, needs UI
12. **Practice history charts** - Stats computed, could visualize
13. **Accessible focus indicators** - Some exist, audit needed

## 4. Architecture rules (do not break)

- `HTMLMediaElement.currentTime` is the ONLY canonical playback position
- All saved timing is integer milliseconds in original-media time
- Playback speed never rewrites stored timestamps
- Detector beat maps are immutable; corrections create new versions
- WAV and MP3 only until Windows QA proves otherwise
- No accounts, telemetry, scraping, downloading, or network access
- Imported audio is private app data, never committed or exported

## 5. Source map

```
src/
  App.tsx                          - Main app shell (library + sync lab routing)
  audio/
    AudioTransport.ts              - Shared media element, canonical snapshot
    AudioTransport.test.ts         - 9 tests
    MetronomeScheduler.ts          - Web Audio click scheduling
    MetronomeScheduler.test.ts     - 7 tests
    useTransport.ts                - React hook via useSyncExternalStore
  adapters/
    importAdapter.ts               - Browser/Tauri import abstraction
  analysis/
    types.ts                       - AnalysisEngine interface, BeatMapVersion
    BrowserAnalysisEngine.ts       - Tempo detection via autocorrelation
  components/
    BeatGrid.tsx                   - Beat pulse visualization
    BeatEditor.tsx                 - Offset, downbeat, tap tempo correction
    Waveform.tsx                   - WaveSurfer + beat/loop/playhead overlay
    LyricSync.tsx                  - Paste lyrics, tap sync, syllable editing
    PracticeView.tsx               - Live lyrics, section nav, stats
    Settings.tsx                   - App preferences panel
    library/
      LibraryView.tsx              - Project list, search, import
      ProjectCard.tsx              - Individual project card
  domain/
    types.ts                       - Beat, LoopRange, TimedSyllable, AnalysisResult
    timing.ts + test               - Beat lookup, subdivision, loop validation (5 tests)
    lyrics.ts + test               - Tokenization preserving punctuation (1 test)
    lyricSync.ts + test            - Synced lines, split/merge, tap sync (7 tests)
    beatCorrection.ts + test       - Offset, downbeat, tap tempo, validation (4 tests)
    sections.ts + test             - Section CRUD, validation, reorder (3 tests)
    practiceSession.ts + test      - Session stats, time formatting (3 tests)
    projectExport.ts + test        - Schema export/import validation (3 tests)
  repositories/
    types.ts                       - ProjectRepository interface
    SqlProjectRepository.ts        - Tauri SQL plugin implementation
    MemoryProjectRepository.ts     - Browser/test in-memory implementation
    MemoryProjectRepository.test   - 7 tests
  stores/
    useAppStore.ts                 - Zustand: view, projects, active project
    useSettingsStore.ts            - Zustand: count-in, speed, volume, motion
src-tauri/
  src/lib.rs                       - Tauri plugins, migration, import command
  src/import.rs                    - WAV/MP3 validation, atomic copy (3 tests)
  src/main.rs                      - Entry point
  migrations/0001_v1.sql           - Full relational schema
  capabilities/default.json        - Restricted permissions
```

## 6. Baseline commands

```bash
npm install
npm run fixtures
npm run typecheck    # strict TS
npm run lint         # zero warnings
npm test             # 49 tests
npm run build        # production bundle

# Rust (needs CARGO_HTTP_CAINFO if corporate proxy)
cd src-tauri
cargo fmt --all -- --check
cargo test --all-targets
cargo check
```

## 7. First prompt for the receiving agent

> Continue Rhythm Song Trainer V1. Read AGENTS.md and CHIPAGENTS_HANDOFF.md first.
> All 5 milestones are code-complete with 49 passing tests.
> Priority tasks:
> 1. Wire BeatEditor, LyricSync, PracticeView, and Settings into the project view (components exist, just need integration into App.tsx)
> 2. Connect BrowserAnalysisEngine to the import flow
> 3. Add keyboard shortcuts for transport controls
> 4. Run cargo test and cargo check (set CARGO_HTTP_CAINFO if needed)
> 5. Do not break existing tests or architecture rules
