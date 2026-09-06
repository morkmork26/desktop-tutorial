# Current State

## Phase

Android milestone A1 is implemented and CI-verified. Physical-device audio QA is the active gate. The Tauri prototype is retained temporarily as reference but is not the product target.

## Current top objective

Pass the Media3/metronome synchronization spike on a physical Android device before migrating import, Room, analysis, and full workflows.

## Stable facts

- Product is private, offline, single-user, and Android-only (minimum API 29, target API 36).
- Media3 player position will be the canonical media position; persisted timing stays integer original-media milliseconds.
- WAV/MP3 are the only V1 format claims.
- Detector beat maps are immutable; corrections create new versions.
- React/TypeScript domain logic and UI concepts are reusable; Kotlin owns audio, import, analysis, Room, and lifecycle behavior.
- Last pre-migration verification: strict types, lint, and 53 Vitest tests passed on 2026-09-07.
- GitHub Actions run 34060062249 passed on the current documentation checkpoint; code-equivalent run 34059849771 passed frontend checks, Gradle unit/lint/build, debug APK, release AAB, and artifact upload.

## Known issues

- Android currently opens a fixture-only synchronization screen; it is not the full product workflow.
- Main app workflow is not yet integrated or persistently reopenable.
- Desktop-era Tauri, WaveSurfer, HTML audio, browser analyzer, and nested CI remain until the Android spike provides a safe replacement.
- Physical Android synchronization, pitch, lifecycle, and storage behavior are unverified.

## Next actions

1. Download/install the `rhythm-song-trainer-android` debug APK from CI run 34059849771.
2. Run the 120 BPM physical-device checks in `docs/audio-qa.md` and record device/output evidence.
3. Stop and repair the audio pipeline if hardware synchronization fails.
4. If it passes, implement A2 Android import and Room persistence, then A3–A5 in `CHIPAGENTS_HANDOFF.md`.

Last updated: 2026-09-07

## Cross-device takeover

The authoritative continuation instructions are in `CHIPAGENTS_HANDOFF.md`, including a copy-paste prompt for another Codex device. The source checkpoint is commit `dbbca5c` on `main`; do not infer completion from CI alone because physical Android audio QA is still pending.
