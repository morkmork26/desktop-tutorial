---
pmm_schema: pmm.task/v1
task_id: rhythm-song-trainer-v1
parent_task_id: none
task_kind: primary
execution_status: active
verification_status: partial
delivery_status: not-requested
owner: morkmork26
branch: main
base_sha: HEAD
revision: 4
verification_head: none
verification_source_hash: none
verified_at: none
updated_at: 2026-09-06T21:17:00Z
---

# Active Task

Purpose: Single primary task contract, verifier, retry state, and integration checkpoint.

## Status

- Title: Build Rhythm Song Trainer V1
- Runtime Profile: Sprint
- Risk Level: normal
- Loop Budget: 3
- Current Attempt: 1
- Stop Condition: All milestones code-complete and verified, or concrete blocker recorded.

## Task

- Objective: Build Rhythm Song Trainer V1
- Scope: Full repository implementation and documentation
- Allowed Files or Areas: Full repository
- Forbidden Actions: unrelated edits, destructive operations, publication without authorization

## Harness

- Agent Mode: solo
- Owner: morkmork26
- Branch: main
- Parent Task: none

## Verifier

- Required Checks: Frontend lint, typecheck, unit tests, production build; Rust format/test/check; browser smoke; Windows QA
- Manual Acceptance: Windows audio QA pending
- Evidence Needed: fresh command output bound to current HEAD

## Critic

- Pass/Fail: partial-pass
- Missing Evidence: Cargo test/check (blocked by system deps), Windows audio QA
- False-Pass Risk: browser tests do not prove native behavior
- Next Action: Install system dev headers, run Cargo checks, set up CI, Windows QA

## Record

- Verification Evidence: 49/49 Vitest pass, typecheck clean, lint clean, build clean, cargo fmt clean
- Delivery Status: not-requested
- Docs Updated: status.md, current-state.md, active-task.md refreshed
- Remaining Risk: Native compilation and Windows audio QA unverified
- Last Updated: 2026-09-06
