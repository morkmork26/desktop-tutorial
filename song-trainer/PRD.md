# Rhythm Song Trainer — Android V1 Product Requirements

## Product intent

Rhythm Song Trainer is a private, offline Android practice app for singers who know a song but struggle to place syllables rhythmically. V1 succeeds when a user can import a WAV or MP3, review and correct detected beats, synchronize lyric syllables, loop a difficult phrase, slow playback without changing pitch, hear a synchronized metronome, and reopen the project without losing work.

Android is the only supported platform. Windows, desktop installers, iOS, browser distribution, accounts, cloud sync, telemetry, downloads, lyric scraping, microphone scoring, and pitch grading are outside V1.

## Supported devices and delivery

- Phones, tablets, foldables, portrait, landscape, and split-screen.
- Minimum Android 10 (API 29); target Android 16 (API 36).
- Local debug/release APK for testing and an Android App Bundle (AAB) for a future Play submission.
- No broad storage permission. The system document picker grants access to the selected file; the app copies it into private internal storage.
- Source is MIT licensed. User-imported songs and lyrics remain private user data.

## Non-negotiable behavior

- The native Media3 player position is the canonical song position. React displays native snapshots; it never advances music time using its own timer.
- Metronome clicks are mixed in the native audio pipeline against explicit original-media beat timestamps. The same pipeline applies speed adjustment after click placement.
- All saved timing is integer milliseconds in original-media time. Changing speed never rewrites timestamps.
- Media3 playback uses speed with pitch fixed at `1.0`; device QA must confirm acceptable quality at 50%, 75%, and 100%.
- Imported WAV/MP3 audio is header-validated and copied through a temporary file before an atomic rename. Database rows are committed only after the copy succeeds.
- Analysis is advisory: editable 4/4 default, explicit beat timestamps, nullable confidence, user-confirmed downbeat, immutable detector result, and versioned corrections.
- The app is offline after installation and requests no internet, account, microphone, contacts, location, or media-library-wide permission.

## Main workflows

1. Use Android's document picker to select a WAV or MP3 and copy it into the app's private library.
2. Decode mono PCM locally, compute waveform peaks, estimate tempo and explicit beats, and show progress/cancellation.
3. Correct global offset, downbeat, and tempo while preserving every accepted beat-map version.
4. Paste lyrics, retain line breaks and punctuation, split/merge syllables, and tap or nudge timestamps.
5. Practice from a single focused screen: stable lyrics, waveform, beat pulse, section navigation, speed, metronome, count-in, and A/B loop.
6. Autosave to Room/SQLite, reopen safely, record lightweight practice history, and export/import metadata without audio.

## UX acceptance

- The practice screen opens directly to the song and the transport remains reachable with one thumb.
- Play/pause is the strongest action; loop, speed, and metronome are visible without opening settings.
- Editing tools are separated from practice so accidental beat/lyric edits cannot occur during rehearsal.
- Every icon has a text label or accessibility description; every touch target is at least 48 dp.
- Compact layouts use one pane and bottom navigation. Wider layouts use list-detail/supporting panes instead of stretched phone cards.
- System bars, cutouts, gesture areas, keyboard, predictive back, rotation, and process recreation are handled without losing saved work.
- Empty, analyzing, failed, cancelled, missing-file, and damaged-metadata states provide a clear next action.

## Completion evidence

- TypeScript: typecheck, lint, Vitest domain/component tests, production web bundle.
- Kotlin: JVM unit tests for mappings/DSP utilities; instrumented tests for Room migrations, file import rollback, native bridge, and Media3 transitions.
- Android: Gradle lint, debug APK, release AAB, and emulator smoke tests in CI.
- Integration: import → analyze → correct → sync lyrics → loop/practice → close/relaunch → recover state.
- Physical-device audio QA on at least one API 29–32 device and one API 33–36 device, using speaker, wired/USB audio when available, and Bluetooth with latency limitations documented.
- Two-minute no-drift test, immediate seek recovery, clean loop restart, rotation/background-resume recovery, and 50/75/100% pitch-preserving playback.

## V1 exclusions

No Python/librosa runtime, Tauri/Rust host, Windows installer, iOS build, automatic meter or song-structure detection, cloud features, stem separation, song downloading, lyric scraping, automated speed ramping, microphone capture, vocal scoring, or pitch grading.
