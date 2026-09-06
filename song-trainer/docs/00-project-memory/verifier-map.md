# Verifier Map

Purpose: Project-specific map from task types to required checks and evidence.
Read when: Defining or reviewing the verifier for an active task.
Skip when: The active task already has a complete verifier.

## Default Checks

- Code: focused unit tests, strict typecheck, lint, and production build after final changes.
- Frontend: domain/component tests, compact/medium/expanded inspection, TalkBack semantics, font scaling, keyboard, and reduced-motion checks.
- Backend/API: Kotlin/JVM and instrumented tests, Media3 playback/seek/rate/loop/click behavior, safe import cleanup, Room migration/rollback, and process recreation.
- Docs/skills: file/link presence, status accuracy, PMM Doctor, and no secrets/private audio.
- Recovery: exact active task, clean ownership, next action, dirty-file inventory, and fresh evidence state.
- Release: Gradle lint/test, debug APK, release AAB, repository-root CI, Android physical-device audio QA, and rollback/recovery notes.
- Security/high risk: narrow Capacitor commands, private path enforcement, no internet/broad storage/microphone permission, and complete DTO/metadata validation.

## Required Evidence

- Command output summary: include check name, pass/fail, and focused failure cause.
- Manual inspection: record device/environment and exact flow exercised.
- Screenshot or artifact: useful for phone/tablet/foldable UI and APK/AAB checkpoints; never substitutes for interaction or physical audio testing.
- Remaining risk: list skipped platform checks and distinguish planned/source-present/verified behavior.

## False-Pass Guards

- Do not report skipped checks as passed.
- Do not delete or weaken failing checks without recording why.
- Do not treat mocks as real integration evidence.
- Do not mark high-risk tasks done without confirmation and rollback notes.
