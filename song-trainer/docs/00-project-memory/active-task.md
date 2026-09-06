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
- Manual Acceptance: Android phone/tablet workflow and physical audio QA pending
- Evidence Needed: fresh command output bound to current HEAD

## Critic

- Pass/Fail: partial-pass
- Missing Evidence: Capacitor shell, Gradle checks, Android integration, and physical-device audio QA
- False-Pass Risk: reusable browser/domain tests do not prove native audio, Room, file import, or Android lifecycle behavior
- Next Action: Finish A0 rebaseline, then implement and test only the native synchronization spike

## Record

- Verification Evidence: pending after checkpoint
- Delivery Status: not-requested
- Docs Updated: status.md, current-state.md, active-task.md refreshed
- Remaining Risk: Android architecture has not yet been implemented or proven on hardware
- Last Updated: 2026-09-06
- Next Concrete Action: Install the CI debug APK on physical Android hardware and record A1 synchronization, seek, loop, and 50/75/100 percent playback evidence; proceed to A2 only after the gate passes.
