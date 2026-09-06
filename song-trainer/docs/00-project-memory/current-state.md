# Current State

Purpose: Current project phase, stable facts, blockers, and next recommended actions.
Read when: Starting or resuming project work.
Skip when: Only reading historical decisions or one-off command output.

## Phase

V1 code-complete. All five milestones implemented. Awaiting native compilation and Windows QA.

## Current Top Objective

Resolve native build prerequisites, run Cargo tests, and perform Windows audio QA.

## Stable Facts

- Product is a private, local-only Windows 11 Tauri application for rhythmic vocal phrasing practice.
- `HTMLMediaElement.currentTime` is the canonical media position; persisted timing uses integer original-media milliseconds.
- WAV and MP3 are the only intended V1 import claims.
- Detector beat maps remain immutable; corrections create versions.
- 49 tests pass across all domain, audio, and repository modules.

## What Exists

- Full V1 feature implementation across all five milestones.
- Product and architecture documentation plus CHIPAGENTS_HANDOFF.md.
- React/TypeScript/Vite frontend with library, sync lab, beat editor, lyric sync, practice, and settings views.
- Zustand stores for app state and settings.
- Repository layer with SQL and in-memory implementations.
- Import adapter abstraction for browser and Tauri environments.
- Browser-based analysis engine with tempo detection.
- Generated 60/90/120 BPM fixture script.
- Tauri 2 host with restricted capabilities, safe-copy import command, and V1 SQLite migration.

## What Works

- All 49 Vitest tests pass.
- Strict TypeScript, ESLint (zero warnings), and Vite production build pass.
- Cargo fmt passes.

## Known Issues

- None in frontend code.

## Current Blockers

- Linux native compilation requires system dev headers (sudo access needed).
- Windows WebView2 audio QA requires a Windows environment.

## Next Recommended Actions

1. Install native build prerequisites (pkg-config, libglib2.0-dev, libgtk-3-dev, libwebkit2gtk-4.1-dev, gcc).
2. Run cargo test and cargo check.
3. Set up GitHub Actions CI for frontend checks and Windows Tauri compilation.
4. Perform Windows audio QA per docs/audio-qa.md checklist.

## Last Updated

2026-09-06
