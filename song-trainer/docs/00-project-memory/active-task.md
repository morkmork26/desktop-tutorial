---
pmm_schema: pmm.task/v1
task_id: rhythm-song-trainer-v1
parent_task_id: none
task_kind: primary
execution_status: active
verification_status: blocked
delivery_status: not-requested
owner: root
branch: main
base_sha: HEAD
revision: 7
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-09-06T21:06:04Z
---

# Active Task

Purpose: Single primary task contract, verifier, retry state, and integration checkpoint.

## Status

- Title: Build Rhythm Song Trainer Android V1
- Runtime Profile: Sprint
- Risk Level: high
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: Android A1–A5 gates pass with physical-device audio evidence, or a concrete blocker is recorded.

## Task

- Objective: Migrate the reusable prototype into a verified Android-only Rhythm Song Trainer V1.
- Scope: Full repository implementation and documentation
- Allowed Files or Areas: Full repository
- Forbidden Actions: unrelated edits, destructive operations, publication without authorization

## Harness

- Agent Mode: solo
- Owner: morkmork26
- Branch: main
- Parent Task: none

## Verifier

- Required Checks: Frontend lint, typecheck, unit tests, production build; Gradle unit/lint/build; Android instrumented integration; physical-device audio QA
- Manual Acceptance: Android physical QA started; seek-forward/seek-back failed and possible extra metronome beat needs reproduction
- Evidence Needed: fresh command output bound to current HEAD

## Critic

- Pass/Fail: partial-pass
- Missing Evidence: Capacitor shell, Gradle checks, Android integration, and physical-device audio QA
- False-Pass Risk: reusable browser/domain tests do not prove native audio, Room, file import, or Android lifecycle behavior
- Next Action: Repair native seek recovery and reproduce the possible extra metronome beat before A2

## Record

- Verification Evidence: CI A1 passed; physical-device report is a failed/partial gate
- Delivery Status: not-requested
- Docs Updated: status.md, current-state.md, active-task.md refreshed
- Remaining Risk: Native seek behavior is broken on the tested device; device/output details are not yet recorded; lifecycle, pitch, storage, and analysis remain unverified
- Last Updated: 2026-09-06
- Next Concrete Action: Record device model/API/output, reproduce the seek reset and possible extra click, repair the native pipeline, then rerun the full A1 checklist; do not proceed to A2 until it passes.
