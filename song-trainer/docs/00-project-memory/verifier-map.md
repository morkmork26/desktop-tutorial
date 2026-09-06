# Verifier Map

Purpose: Project-specific map from task types to required checks and evidence.
Read when: Defining or reviewing the verifier for an active task.
Skip when: The active task already has a complete verifier.

## Default Checks

- Code: focused unit tests, strict typecheck, lint, and production build after final changes.
- Frontend: synchronization-lab playback/seek/rate/loop/metronome behavior, desktop/tablet inspection, keyboard and reduced-motion checks.
- Backend/API: Rust format/test/check, safe import success/failure/cleanup, migration execution/rollback, sidecar lifecycle.
- Docs/skills: file/link presence, status accuracy, PMM Doctor, and no secrets/private audio.
- Recovery: exact active task, clean ownership, next action, dirty-file inventory, and fresh evidence state.
- Release: Windows Tauri compilation, tagged unsigned NSIS artifact, documented manual audio QA, rollback/recovery notes.
- Security/high risk: minimum Tauri capabilities, app-owned path enforcement, no network/shell scope, complete metadata validation.

## Required Evidence

- Command output summary: include check name, pass/fail, and focused failure cause.
- Manual inspection: record device/environment and exact flow exercised.
- Screenshot or artifact: useful for responsive UI and Windows installer checkpoints; never substitutes for interaction testing.
- Remaining risk: list skipped platform checks and distinguish planned/source-present/verified behavior.

## False-Pass Guards

- Do not report skipped checks as passed.
- Do not delete or weaken failing checks without recording why.
- Do not treat mocks as real integration evidence.
- Do not mark high-risk tasks done without confirmation and rollback notes.
