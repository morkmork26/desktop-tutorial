---
pmm_schema: pmm.task/v1
task_id: rhythm-song-trainer-v1
parent_task_id: none
task_kind: primary
execution_status: active
verification_status: pending
delivery_status: not-requested
owner: root
branch: main
base_sha: HEAD
none
revision: 3
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-09-06T12:27:31Z
---

# Active Task

Purpose: Single primary task contract, verifier, retry state, and integration checkpoint.
Read when: Starting, executing, verifying, integrating, or recovering this task.
Skip when: The task is unrelated to the current execution context.

## Status

- Title: Build Rhythm Song Trainer V1
- Runtime Profile: Sprint
- Risk Level: normal
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: required behavior is verified or a concrete blocker is recorded.

## Task

- Objective: Build Rhythm Song Trainer V1
- Scope: Full repository implementation and documentation; no deployment or external publication
- Allowed Files or Areas: Full repository implementation and documentation; no deployment or external publication
- Forbidden Actions: unrelated edits, destructive operations, publication, and production writes without explicit authorization.
- Source Artifacts: project instructions, current source, and task request.

## Harness

- Agent Mode: solo
- Owner: root
- Branch: main
- Parent Task: none
- Tools: project-local tools and pmm lifecycle helpers.
- Environment Notes: one writer owns this task file and branch.

## Verifier

- Required Checks: Frontend lint, typecheck, unit tests, production build; Rust and Python tests when toolchains are available; browser smoke and PMM doctor
- Manual Acceptance: task-specific acceptance remains explicit.
- Evidence Needed: fresh command output bound to the current HEAD and source hash.

## Critic

- Pass/Fail: pending
- Missing Evidence: required checks have not completed.
- False-Pass Risk: stale or unrelated evidence must not count.
- Next Action: execute the first unverified acceptance step.

## Repair

- Last Failure: none
- Failure Class: none
- Attempted Fix: none
- Next Concrete Action: ChipAgents takeover: read AGENTS.md and CHIPAGENTS_HANDOFF.md; install rustfmt plus official Tauri native prerequisites; complete Milestone 1 Cargo checks, loop-coordinate fix, focused transport/metronome tests, and synchronization QA before Milestone 2.

## Record

- Verification Evidence: pending after checkpoint
- Delivery Status: not-requested
- Delivery Evidence: pending
- Docs Updated: pending
- Remaining Risk: pending verification.
- Memory Promotion Decision: pending
- Last Updated: 2026-09-06T04:49:12Z
