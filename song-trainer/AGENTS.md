# Project Instructions

Purpose: Canonical project entrypoint and hot-path instructions for future agents.
Read when: Entering the project, starting a task, resuming work, or checking safety boundaries.
Skip when: Never skip during project work.

<!-- pmm-runtime:start -->
## PMM Runtime

- Managed runtime version: `0.5.1`.
- Before non-trivial task writes, run the installed `pmm-task.sh upgrade --project . --auto --owner <agent-id>` Upgrade Gate.
- Treat `docs/00-project-memory/runtime-state.md` as project runtime state; compatibility readers are for migration, recovery, rollback, and ambiguity review only.
- Keep exactly one primary task in `active-task.md`; concurrent writers use isolated branches/worktrees and work-item files.
<!-- pmm-runtime:end -->

## Project Identity

- Name: Rhythm Song Trainer
- One-sentence positioning: A private, offline Android app for practicing rhythmic vocal phrasing against editable beat and lyric timing.
- Project type: Android-only Capacitor 8 application with a React/TypeScript UI, Kotlin native plugin, Media3 audio, Room persistence, and local PCM analysis.
- Current phase: Android rebaseline and native synchronization spike.
- Current top objective: Prove Media3 playback, click mixing, looping, speed, and React display share one reliable native timeline before migrating editors.

## Runtime Profile

Default profile: Project

Use:
- Pulse for tiny edits or known-file lookups
- Sprint for normal implementation
- Project for new project or major requirements work
- Recovery for interrupted or failed-retryable work
- Audit for release, security, production, auth, payment, or compatibility risk

## Mandatory Reading Order

1. `AGENTS.md`
2. `CHIPAGENTS_HANDOFF.md` when taking over V1 development
3. `docs/00-project-memory/active-task.md` for non-trivial task start/resume
4. Relevant sections of `current-state.md` only when project facts are needed
5. Relevant sections of `verifier-map.md` only when the task lacks complete checks
6. Task-specific source docs only when needed

Reuse content already present in the current context; do not reopen an unchanged file unless a required section was not loaded.

## Task Reading Map

- Product/features: `PRD.md` by default; split product docs only when needed
- Cross-agent takeover: `CHIPAGENTS_HANDOFF.md`, then the active task and current state
- UI/design: `docs/design.md`, then `src/` CSS Modules
- Frontend: `src/`, especially `src/audio/` and `src/domain/`
- Backend/API/database: `android/` after scaffolding, Kotlin plugin/Room code, and `src/repositories/`
- Auth/payment/permissions:
- PRD/requirements/source review: `PRD.md` plus concrete source artifacts
- Deployment/operations: `README.md`, `docs/status.md`, and `.github/workflows/`
- Testing/bug fixing: `docs/00-project-memory/verifier-map.md`, then colocated tests
- Recovery: `docs/00-project-memory/current-state.md` and the active task
- Audit/release: `docs/audio-qa.md`, `docs/architecture.md`, and repository-root Android workflow files

## Project Rules

- Media3 ExoPlayer position is the only canonical playback position. React may poll native snapshots for drawing but never invents media time.
- Persist timing as integer milliseconds in original-media time. Playback speed must never rewrite saved timing.
- Preserve detector results. User corrections create new beat-map versions and can reset to the immutable detector map.
- Support WAV and MP3 only until Android device QA proves additional formats.
- Keep the application local-only: no accounts, telemetry, scraping, downloading, or network access.
- Imported audio is private app data. Never commit it or include it in metadata exports.

## Execution Rules

- Keep project state in project docs, not in agent-global memory.
- Keep an ephemeral in-session read set; do not write it into project memory.
- Inspect size and headings before reading text files over 200 lines or 32 KiB, then load only relevant ranges.
- Do not create standalone plan, handoff, or evidence files that duplicate the owned task and target source.
- Batch durable task/doc updates at real state transitions; do not persist commentary or raw command transcripts.
- Run the Workspace Gate before the Subagent Gate: inspect the primary task, branch/worktree, owner, allowed scope, and existing work items.
- Reuse a matching current-branch PMM claim; continue or resume it instead of creating or switching worktrees. A default `start` from another active, checked-out worktree may auto-route to a child work item.
- Keep exactly one primary task in `active-task.md`; never append a second task contract.
- Use `docs/00-project-memory/work-items/<task-id>.md` only for branch/worktree-isolated child work.
- Put queued, paused, confirmation-gated, deployment, and release work in an optional task queue instead of the active hot path.
- Update the owned task file before broad, risky, or long-running work.
- Define Task, Harness, Verifier, Critic, Repair, and Stop Condition for substantial tasks.
- Choose Agent Mode before broad work: `solo`, `assisted`, `parallel`, or `review-only`.
- Use specialized skills or subagents only when they add value, ownership is clear, and the parent agent keeps final verification.
- Never allow two active writers to share one branch/worktree; overlapping scopes execute sequentially.
- Keep one non-idle primary claim across local worktrees, including paused/blocked tasks; require each non-idle task file to match its complete owner/branch/parent/kind claim, and never reuse an archived task ID.
- Use the lifecycle CLI for whole-file task transactions; interrupted writes must leave neither partial task state nor orphan temporary files/claims, and an interrupted takeover must restore the owner matching the durable task file.
- Treat any source-touching commit after verification as stale evidence even when a later commit reverts it.
- Keep a verified child claim at `ready-to-integrate` until its commit is merged and the primary owner runs `pmm-task.sh integrate`; then reverify the primary task.
- Do not copy full project rules into agent-specific adapters.

## Safety Boundaries

Existing explicit authorization remains valid within its scope. Do not request it again for authorized local implementation; ask for missing authorization or material scope changes. Respect platform-enforced approvals.

- Do not store secrets in files, docs, logs, or chat.
- Do not delete, migrate, overwrite, publish, charge, message, or change production data without confirmation.
- Do not modify payment, user, order, permission, billing, credential, or external publication behavior without confirmation.
- Do not use mock data as proof of real integration.

## Definition Of Done

- Requested behavior implemented or blocker recorded.
- Verifier run after the final change and evidence still matches the current HEAD/source hash, or limitation recorded.
- Critic checked false-pass risk.
- `active-task.md`, `current-state.md`, `change-log.md`, and source docs updated only when durable state changed.
- Remaining risk is explicit.
- Every child work item is merged, explicitly integrated, and followed by fresh primary-task verification.
