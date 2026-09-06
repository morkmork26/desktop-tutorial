# Decisions

## D-001 — Canonical media clock

Use the shared media element position for every persisted-timing view. Web Audio is a scheduling clock only. This prevents independent timers from drifting and keeps seek/rate/loop behavior centralized.

## D-002 — Explicit beats over BPM-only grids

Persist individual beat timestamps. A single BPM cannot represent live tempo variation, corrections, or user-anchored downbeats.

## D-003 — Private copied imports

Copy validated WAV/MP3 inputs into app-owned storage before database insertion. Projects remain reopenable if the original file moves, and a failed copy cannot leave a false library entry.

## D-004 — Analysis is advisory

Librosa provides tempo and beats, not authoritative meter/downbeat/confidence. Keep immutable detector runs and make corrections versioned and reversible.
