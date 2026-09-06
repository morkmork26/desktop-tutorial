# Architecture

## Runtime boundary

```text
user WAV/MP3
  → Rust validates, atomically copies, and decodes mono PCM
  → packaged Python/librosa analyzes PCM and returns versioned JSON
  → Rust validates/normalizes results and commits SQLite rows
  → typed frontend repositories load project state
  → AudioTransport exposes the canonical media clock
  → waveform, beats, lyrics, loops, and metronome render/schedule from that clock
```

The web frontend cannot select arbitrary paths or write app data directly. Native dialogs return a chosen path to Rust; Rust owns extension/header validation, app-directory path construction, temporary-file cleanup, and database transaction ordering.

## Core interfaces

- `AudioTransport` owns the shared `HTMLAudioElement`, exposes current media time and playback events, and rebuilds loops without changing stored timestamps.
- `AnalysisEngine` accepts decoded PCM and returns a schema-versioned result with duration, BPM, meter, explicit timestamps, segments, warnings, and nullable confidence.
- `ProjectRepository` is the only frontend persistence boundary for projects, lyrics, maps, sections, loops, settings, and sessions.
- `BeatMap` retains immutable detector output and creates a new version for every accepted correction.

High-frequency playback values remain inside `AudioTransport`. Durable, low-frequency application state can use a small Zustand store. WaveSurfer receives the transport's media element; it does not create a second playback clock.

## Security and privacy

Tauri capabilities are restricted to the main window, its app database, the native open dialog, and app-owned audio/cache paths. There is no HTTP client, updater, telemetry, shell command, or arbitrary filesystem permission in V1. The Python analyzer receives an app-generated PCM path and returns JSON; it never receives a user-controlled command line and never defines the frontend data model.
