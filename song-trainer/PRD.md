# Rhythm Song Trainer — V1 Product Requirements

## Product intent

Rhythm Song Trainer is a private, local-first Windows 11 practice application for singers who know a song but struggle to place syllables rhythmically. V1 succeeds when a user can import WAV or MP3 audio, correct its beat map, synchronize lyric syllables, loop a difficult phrase, slow playback, enable a synchronized metronome, and reopen the project without losing work.

The source code is MIT licensed. User-imported songs and lyrics are private data and are not covered by that license.

## Non-negotiable behavior

- `HTMLMediaElement.currentTime` is the canonical song position. Waveform, beats, lyrics, sections, playhead, and loop decisions derive from it.
- Web Audio schedules clicks against `AudioContext.currentTime` with short lookahead, translating from current media position and playback rate.
- All saved timing is integer milliseconds in original-media time. Changing speed never rewrites timestamps.
- Native playback rate requests pitch preservation; it is described as verified only after Windows WebView2 listening tests.
- Imported audio is validated and atomically copied into app-managed storage before SQLite is updated.
- V1 claims WAV and MP3 only. M4A/AAC stays unsupported until Windows testing proves otherwise.
- Automatic analysis is an editable starting point, not truth. V1 defaults to 4/4, requires a user-confirmed downbeat, allows nullable confidence, and preserves detector output.
- The application has no server, account, telemetry, downloading, lyric scraping, or general network access.

## Main workflows

1. Import a supported song and safely copy it into the private library.
2. Analyze decoded mono PCM for BPM and explicit beat timestamps.
3. Review the waveform, correct offset/downbeat/BPM, and preserve corrections as versions.
4. Paste lyrics, retain line breaks and punctuation, split or merge syllables, then tap/drag timestamps.
5. Practice with stable lyric positioning, beat subdivisions, speed presets, metronome, count-in, and custom/line/section loops.
6. Save automatically, reopen safely, record lightweight practice history, and export/import metadata without audio.

## Data and recovery

Projects, versioned analysis, beat maps, lyric structures, sections, loops, settings, and sessions live in SQLite. Decoded peaks and analysis artifacts are versioned files outside the database. Records use UUIDs, ISO timestamps, and schema versions. Missing audio, invalid metadata, interrupted imports, analyzer failure, and migration failure must have visible recovery paths.

## V1 completion evidence

- Frontend unit/component tests, strict type checking, lint, and production build.
- Rust tests for validation, path boundaries, atomic-copy rollback, decoding/cache behavior, and migrations.
- Python tests using generated 60/90/120 BPM fixtures, targeting BPM error within 1 BPM and median nearest-beat error at most 50 ms.
- Browser-compatible integration tests use explicit native adapters and do not masquerade as native verification.
- Manual Windows audio QA checks headphones and speakers for two-minute drift, seek recovery, loops, and 50/75/100% playback.
- GitHub Actions compiles Windows checkpoints; unsigned installers are produced only for milestone tags.

## Out of scope

Automated progressive-speed training, microphone scoring, pitch grading, cloud sync, accounts, song downloading, lyric scraping, automatic meter detection, and automatic song-structure detection.
