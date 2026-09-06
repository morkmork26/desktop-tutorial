# Change Log

Purpose: Chronological record of durable project behavior, requirement, implementation, and operation changes.
Read when: You need recent durable changes or must record a state-changing task.
Skip when: You only need the active task or current state.

## 2026-09-07

- Requirement change: Retargeted Rhythm Song Trainer from Windows desktop to Android only.
- Architecture: Selected Capacitor 8 + React/TypeScript with a Kotlin plugin owning Media3 transport/click mixing, Android file import and decoding, Room persistence, and local analysis.
- UX: Rebased design on official Android adaptive, edge-to-edge, content, and accessibility guidance plus focused music-practice workflows; prohibited generic generated-dashboard styling.
- Reuse: Retain tested domain/UI logic and platform-neutral defect fixes; retire Tauri/Rust, Python sidecar, Web Audio production metronome, WaveSurfer media ownership, NSIS, and Windows QA after the Android spike passes.
- Evidence: Documentation rebaseline only; native Android implementation and physical-device verification remain pending.

## 2026-09-06

- Change: Established the documented synchronization-spike foundation and prepared a complete cross-agent V1 handoff.
- Evidence: frontend typecheck/lint/6 unit tests/production build passed; Cargo resolved dependencies but Linux native build stopped at missing `pkg-config`/GLib prerequisites.
- Remaining risk: native/runtime audio behavior and planned milestones 2–5 remain unverified and incomplete.
