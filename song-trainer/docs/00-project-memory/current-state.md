# Current State

## Phase

Android-only architecture rebaseline. The Tauri desktop prototype is retained temporarily as reference but is not the product target.

## Current top objective

Preserve verified platform-neutral logic, scaffold Capacitor Android, and pass the native Media3/metronome synchronization spike before migrating full workflows.

## Stable facts

- Product is private, offline, single-user, and Android-only (minimum API 29, target API 36).
- Media3 player position will be the canonical media position; persisted timing stays integer original-media milliseconds.
- WAV/MP3 are the only V1 format claims.
- Detector beat maps are immutable; corrections create new versions.
- React/TypeScript domain logic and UI concepts are reusable; Kotlin owns audio, import, analysis, Room, and lifecycle behavior.
- Last pre-migration verification: strict types, lint, and 53 Vitest tests passed on 2026-09-07.

## Known issues

- The current app still runs the desktop/browser prototype and does not contain an Android project.
- Main app workflow is not yet integrated or persistently reopenable.
- Desktop-era Tauri, WaveSurfer, HTML audio, browser analyzer, and nested CI remain until the Android spike provides a safe replacement.
- Physical Android synchronization, pitch, lifecycle, and storage behavior are unverified.

## Next actions

1. Re-run the reusable TypeScript baseline and classify working-tree changes.
2. Commit the Android-only requirements/architecture/design rebaseline separately.
3. Add Capacitor 8 and an Android project.
4. Build the Media3 transport plus native click processor spike against the 120 BPM fixture.
5. Stop and reassess if hardware synchronization fails; otherwise proceed through A2–A5 in `CHIPAGENTS_HANDOFF.md`.

Last updated: 2026-09-07
