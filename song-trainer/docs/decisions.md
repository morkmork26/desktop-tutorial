# Decisions

## D-001 — Canonical native player clock (superseded 2026-09-07)

The earlier HTMLMediaElement/Web Audio decision applied to the abandoned Windows build. Android V1 uses Media3 ExoPlayer's position for every persisted-timing view. React never invents playback time.

## D-002 — Explicit beats over BPM-only grids

Persist individual beat timestamps. A single BPM cannot represent live tempo variation, corrections, or user-anchored downbeats.

## D-003 — Private copied imports

Copy validated WAV/MP3 inputs into app-owned storage before database insertion. Projects remain reopenable if the original file moves, and a failed copy cannot leave a false library entry.

## D-004 — Analysis is advisory

Librosa provides tempo and beats, not authoritative meter/downbeat/confidence. Keep immutable detector runs and make corrections versioned and reversible.

Librosa is no longer the runtime implementation, but the advisory-result rule remains.

## D-005 — Android only

Stop Windows/Tauri delivery and target Android 10+ only. This prevents two native platforms from competing for scarce audio QA and lets V1 optimize for the device used during practice.

## D-006 — Capacitor plus focused Kotlin native layer

Keep React/TypeScript because the existing domain logic, tests, and views are reusable. Use Capacitor 8 for the shell and bridge. Kotlin owns capabilities where WebView behavior is not sufficient: file import, Media3 playback, click mixing, decoding/analysis, Room storage, and lifecycle recovery.

## D-007 — Metronome in the native PCM path

Mix clicks from explicit beat timestamps using a custom Media3 AudioProcessor before Sonic speed adjustment. Do not schedule clicks with JavaScript timers or a second player. The audio spike can reject this design if physical-device tests show drift or discontinuities.

## D-008 — Room is the persistence authority

Use Room instead of a JavaScript SQLite plugin. Room provides Android-native transactions and migration tests. Exchange validated DTOs over the bridge; never expose arbitrary SQL.

## D-009 — App-owned Kotlin analysis

Remove the Python/librosa sidecar plan. Decode WAV/MP3 through Android media APIs and implement a deterministic onset/tempo/phase analyzer with fixture thresholds and visible failure states. This avoids packaging an unsupported interpreter and keeps the APK offline.

## D-010 — Research-led, non-generic mobile UI

Follow Android adaptive, edge-to-edge, accessibility, and content-structure guidance. Use established music-practice behavior as workflow inspiration without copying product identity. Reject generic generated-dashboard aesthetics and decorative features without a user task.
