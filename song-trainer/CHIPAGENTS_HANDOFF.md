# Rhythm Song Trainer — Android-Only Development Handoff

## Read this first

On 2026-09-07 the product target changed from Windows desktop to Android only. Do not continue the Tauri, Rust, Python sidecar, WebView2, NSIS, or Windows QA plan. The current source is a useful prototype, not a finished Android application.

Repository location: `morkmork26/desktop-tutorial/song-trainer`

Read in order: `AGENTS.md`, this handoff, `PRD.md`, `docs/architecture.md`, `docs/design.md`, then `docs/00-project-memory/active-task.md`.

## Copy-paste takeover prompt for the next Codex

Use this prompt when opening the project from another device:

> Continue Rhythm Song Trainer from the repository state documented in `song-trainer/CHIPAGENTS_HANDOFF.md`. The target is Android only; do not resume the retired Tauri/Windows plan. First read the project `AGENTS.md`, this handoff, `docs/status.md`, `docs/00-project-memory/current-state.md`, and `docs/00-project-memory/active-task.md`. The current source checkpoint is commit `dbbca5c` on `main`. A1 (Capacitor shell plus Media3 native synchronization spike) compiles and passed GitHub Actions run `34060062249`; the debug APK artifact was produced by run `34059849771`. The next required action is physical-device A1 audio QA using `docs/audio-qa.md`. Do not start A2 or redesign the UI until that gate passes. If hardware QA passes, implement A2 (Android WAV/MP3 import, private atomic copy, Room persistence, and library reopen/delete/missing-file flows), preserving the existing contracts and verification gates. If hardware QA fails, repair the native audio pipeline first. Keep all claims tied to fresh tests or recorded device evidence.

### Exact takeover checkpoint

- Repository: `morkmork26/desktop-tutorial`
- Product directory: `song-trainer/`
- Branch: `main`
- Current commit: `dbbca5c` (`Record verified Android A1 checkpoint`)
- Working tree at handoff: clean
- Latest successful workflow: `34060062249` on the current commit
- APK/AAB artifact run: `34059849771` on the preceding code-equivalent checkpoint
- Current completion estimate: approximately 20–25% of the full Android V1; A0 is complete, A1 is code/CI complete but hardware-gated, and A2–A5 remain.

## Product finish line

```text
pick local WAV/MP3 on Android
  → copy it into private app storage
  → analyze explicit beats and waveform offline
  → correct beat map
  → paste and sync lyric syllables
  → practice with native playback, pitch-preserving speed, click, and A/B loop
  → kill/relaunch app and recover all saved work
```

Android 10/API 29 is the minimum. Target API 36. Produce an APK for testing and an AAB for future Play distribution. The app has no server, login, telemetry, scraping, download feature, or broad storage permission.

## Architecture to implement

- Preserve React 19, strict TypeScript, Vite, Vitest, CSS Modules, and Zustand.
- Add Capacitor 8 with Android only.
- Build one typed Kotlin Capacitor plugin that owns Storage Access Framework import, private file copying, Media3 transport, PCM click mixing, MediaCodec decoding/analysis, waveform cache, Room persistence, and lifecycle recovery.
- Make Media3 ExoPlayer position the only canonical playback position.
- Mix metronome clicks with a custom Media3 AudioProcessor before Sonic speed adjustment; do not use JavaScript scheduling.
- Use Room as the SQLite authority and validate all schema-versioned DTOs at the native boundary.
- Replace WaveSurfer with a React canvas/SVG waveform fed by native cached peaks.
- Keep all persisted timings as integer original-media milliseconds.

Full rationale and bridge contract: `docs/architecture.md`.

## Existing code: retain, refactor, remove

Retain:

- `src/domain/`: timing, lyrics, lyric sync, beat correction, sections, practice sessions, export rules.
- `src/analysis/types.ts`: result and beat-map contracts, after DTO validation is added.
- React editor/practice/library components as behavioral starting points.
- CSS design tokens and Vitest suites.
- deterministic legal fixture generator.
- repository interface concepts and immutable detector/versioned correction rules.

Refactor:

- `src/audio/AudioTransport.ts` → `AudioTransport` interface plus `BrowserFixtureTransport` and `CapacitorAudioTransport`.
- `src/repositories/SqlProjectRepository.ts` → `CapacitorProjectRepository`; Room executes native transactions.
- `src/adapters/importAdapter.ts` → native plugin call.
- `src/components/Waveform.tsx` → peak-data renderer with no media element.
- `App.tsx` → Android navigation and an integrated saved workspace.
- desktop CSS → compact/medium/expanded adaptive layouts with 48 dp targets and safe-area insets.

Remove after the audio spike passes:

- `src-tauri/`, all `@tauri-apps/*` dependencies, nested Windows workflow, WaveSurfer dependency, browser tempo analyzer from production, and Windows/Python instructions.

Do not delete Tauri first: keep it until Capacitor can build and the Android audio spike has passed, so working reference behavior remains available.

## Known prototype defects already found

- Main `App.tsx` only connects Library and a synthetic SyncLab; editors exist but are not a persisted end-to-end workflow.
- Browser analysis exists but is not connected and creates a BPM grid from 0 rather than detecting intro phase.
- Original SQL repository used the Tauri plugin instance with the wrong call signature; the working tree contains an uncommitted correction and expanded workspace methods.
- Original Zustand selectors created new functions and could trigger unstable renders; the working tree contains corrections.
- Lyric nudge treated 0 ms as absent; working-tree test/fix exists.
- Downbeat anchoring was destroyed by timestamp sorting; working-tree model/test fix stores `downbeatTimeMs` separately.
- The GitHub workflow is nested under `song-trainer/.github`, so GitHub never detects it at the parent repository root.
- Older documentation falsely called all milestones complete. Treat this handoff and current status as authoritative.

Before migration, inspect the diff and preserve the platform-neutral corrections. Do not blindly commit Tauri-specific work.

## Implementation plan

### A0 — Rebaseline and protect reusable behavior

Acceptance:

- Android-only requirements, architecture, design, timing, QA, and status agree.
- Current TypeScript/domain tests pass before migration.
- Platform-neutral working-tree fixes are separated from obsolete desktop changes.
- Root CI path and Android workflow requirements are documented.

### A1 — Android shell and native audio synchronization spike

Work:

- Add Capacitor 8 Android project; app ID `com.morkmork26.rhythmsongtrainer`.
- Set min SDK 29 and target/compile SDK 36.
- Implement typed plugin registration and fixture-copy command.
- Implement Media3 load/play/pause/seek/speed/loop snapshots.
- Implement custom click AudioProcessor using the explicit 120 BPM fixture map.
- Add generation IDs and process/lifecycle recovery.
- Build a minimal React spike screen using native transport only.

Gate:

- Debug APK builds.
- On a physical device, 120 BPM fixture shows/hears no perceptible drift for two minutes.
- Pause/resume, forward/back seek, 4-second loop, and 50/75/100% speed recover immediately without doubled/stale clicks.
- If this fails, stop and change the audio pipeline before any editor migration.

### A2 — Android import, Room, and library

Work:

- Use the system picker with MIME plus extension/header checks.
- Stream into private internal storage through `.part`, fsync, atomic rename, rollback.
- Build Room entities/DAOs/migrations for the existing normalized schema.
- Implement schema-versioned native DTOs and Capacitor repository adapter.
- Connect library search/recent order/status/delete/missing-file recovery.

Gate:

- Instrumented tests cover valid WAV/MP3, spoofed headers, cancellation, duplicate names, partial-copy cleanup, path isolation, Room migration, delete, process relaunch, and missing audio.

### A3 — Native analysis and beat correction

Work:

- Decode WAV/MP3 via MediaExtractor/MediaCodec to mono PCM.
- Produce versioned waveform peaks outside Room.
- Implement onset envelope, autocorrelation tempo candidates, beat phase, progress/cancel, warnings, nullable confidence.
- Connect waveform, beat/downbeat markers, offset, tap tempo, anchor, undo, and detector reset.

Gate:

- 60/90/120 BPM fixture BPM error ≤1 and median nearest-beat error ≤50 ms, including two-second intro phase.
- Empty/unstable/suspicious audio produces a visible warning or failure, never fabricated success.
- Detector map stays immutable and every accepted correction adds a version.

### A4 — Lyrics and practice workflow

Work:

- Integrate paste/edit/reorder, syllable split/merge, tap sync, undo, ±25 ms nudge, range resync, and autosave.
- Integrate stable practice lyrics, subdivisions, section navigation, A/B custom/line/section loops, speed chips, click, count-in, and sessions.
- Implement metadata export/import through Android's document UI.
- Restore state after rotation, background/foreground, and process recreation.

Gate:

- Complete import → analysis → correction → lyric sync → practice → force-stop/relaunch flow passes.
- Timing remains invariant at every playback speed.

### A5 — Mobile UX, accessibility, CI, release

Work:

- Implement the layouts in `docs/design.md`: bottom navigation/mini transport on compact windows; rail and supporting panes on wider windows.
- Honor edge-to-edge insets, keyboard, predictive back, font scaling, reduced motion, TalkBack, landscape, split-screen, tablets, and foldables.
- Put GitHub Actions at repository-root `.github/workflows/`; run Node gates, Gradle unit/lint, emulator instrumented smoke, debug APK, and release AAB lanes.
- Record device QA and generate unsigned local artifacts unless signing is explicitly approved later.

Gate:

- No touch target under 48 dp and no core task depends on color, hover, long press, or an unlabeled icon.
- Phone/tablet screenshots show real states, not mock data.
- All automated gates pass and physical-device audio QA is recorded.

## Design standard

Follow `docs/design.md`. The key rule is utility before decoration. Avoid generic generated dashboards, gradient hero copy, glass cards, arbitrary rounded containers, fake charts, fabricated album art, unexplained icons, and hidden core controls. Reference Android's official adaptive/accessibility guidance and successful music-practice interaction patterns, but do not clone another app.

## Verification commands after Capacitor exists

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx cap sync android
cd android
./gradlew test lint assembleDebug bundleRelease
./gradlew connectedDebugAndroidTest   # emulator/device lane
```

Run all relevant checks again after the final source change. Browser tests prove shared domain behavior only; they do not prove native file, Room, lifecycle, pitch, click, or latency behavior.

## Current checkpoint and immediate next action

A0 is complete. A1 compiles and passes Android lint/build in GitHub Actions run 34059849771; the workflow uploaded a debug APK and release AAB under artifact name `rhythm-song-trainer-android`.

Do the physical-device portion of A1 next. Install the debug APK, run the two-minute/seek/loop/50–100% checklist in `docs/audio-qa.md`, and record device/output results. Do not start A2 or polished screens until that gate passes. A compiler success does not prove audible synchronization.
