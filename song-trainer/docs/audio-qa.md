# Android Audio QA

Run after the native synchronization spike, analysis/correction, and release candidate. Record device model, Android/API version, output route, app commit/build, and pass/fail notes.

## Device matrix

- At least one Android 10–12 device (API 29–32).
- At least one Android 13–16 device (API 33–36).
- Built-in speaker plus wired/USB output when available.
- Bluetooth is tested separately and its route latency is documented; stable song/click alignment matters more than absolute acoustic delay.

## Synchronization

- Repeat the 120 BPM accented fixture for two minutes; click, downbeat accent, and marker show no perceptible drift.
- Pause five seconds and resume; no catch-up burst or doubled click.
- Seek forward/back while playing; the first valid beat after the seek aligns.
- Loop a four-second phrase for at least 20 restarts; no click duplication, gap growth, or stale pre-loop click.
- Switch 50% → 75% → 100% while playing; clicks remain aligned and saved timestamps remain unchanged.
- Confirm speech/music pitch remains musically stable at all three rates.

## Android lifecycle

- Rotate during paused and playing states; saved edits survive and transport state is coherent.
- Background/foreground the app, lock/unlock, and interrupt with another audio app or call simulation.
- Connect/disconnect Bluetooth or wired output; surface errors and recover through play/pause or reload.
- Force-stop after autosave, relaunch, reopen the project, and confirm beat/lyric/loop state.
- Exercise split-screen and resize on a tablet/foldable.

## Analysis and UX

- Analyze legal 60/90/120 fixtures with the two-second intro and record BPM/beat error.
- Cancel analysis midway and verify no false completed run or leftover temporary PCM.
- Test silence, a corrupted file, a spoofed extension, unstable rhythm, and missing private audio.
- With TalkBack, reach play, seek, speed, metronome, loop points, current lyric, and editor actions in logical order.

Automated TypeScript and emulator tests do not prove physical audio latency, pitch quality, Bluetooth behavior, or OEM lifecycle behavior.
