# Current State

Purpose: Current project phase, stable facts, blockers, and next recommended actions.
Read when: Starting or resuming project work.
Skip when: Only reading historical decisions or one-off command output.

## Phase

V1 foundation and synchronization spike; implementation is handed off for continuation.

## Current Top Objective

Complete Milestone 1 native and synchronization verification before expanding the local library.

## Stable Facts

- Product is a private, local-only Windows 11 Tauri application for rhythmic vocal phrasing practice.
- `HTMLMediaElement.currentTime` is the canonical media position; persisted timing uses integer original-media milliseconds.
- WAV and MP3 are the only intended V1 import claims.
- Detector beat maps remain immutable; corrections create versions.
- Canonical repository path is `/home/morkmork26/projects/song-trainer`.

## What Exists

- Product and architecture documentation plus `CHIPAGENTS_HANDOFF.md`.
- React/TypeScript/Vite synchronization-lab frontend.
- Generated 60/90/120 BPM fixture script.
- Initial Tauri 2 host, restricted capability file, safe-copy import command, Rust unit tests, and V1 SQLite migration.

## What Works

- Frontend typecheck and lint pass.
- Six Vitest tests pass.
- Vite production build passes.
- Cargo dependency resolution/download works and produced `src-tauri/Cargo.lock`.

## Known Issues

- Waveform loop-handle math currently uses viewport rather than container coordinates.
- Native Tauri behavior, SQLite migration execution, audible synchronization, and pitch preservation are unverified.
- Analyzer, repositories, library, correction, lyrics, and complete practice workflows are not implemented.

## Current Blockers

- Linux native compilation requires `pkg-config` and GLib/Tauri development prerequisites.
- The minimal Rust toolchain lacks the `rustfmt` component.
- Windows WebView2 audio QA requires a Windows environment.

## Next Recommended Actions

1. Follow Section 2 and Milestone 1 in `CHIPAGENTS_HANDOFF.md`.
2. Install native prerequisites and `rustfmt`, then run Cargo formatting/tests/checks.
3. Fix loop-coordinate handling and add transport/metronome transition tests.
4. Complete browser and Windows synchronization QA before Milestone 2.

## Last Updated

2026-09-06
