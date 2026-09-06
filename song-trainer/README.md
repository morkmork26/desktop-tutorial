# Rhythm Song Trainer

A private, desktop-first practice tool for singers who want to make rhythmic phrasing visible and repeatable.

## V1 Feature Set

- **Library**: import WAV/MP3 songs, search, manage projects
- **Analysis**: automatic tempo detection and beat generation
- **Beat Correction**: global offset, downbeat anchor, tap tempo, undo/reset
- **Lyrics**: paste text, syllable split/merge, keyboard-first tap sync
- **Practice**: live syllable highlighting, section navigation, speed control, metronome, loop
- **Persistence**: SQLite storage, project export/import with schema validation
- **Settings**: count-in, default speed, metronome volume, reduced motion

## Run locally

```bash
npm install
npm run fixtures
npm run dev
```

Open `http://localhost:1420`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Tauri desktop build

Requires Rust toolchain and platform prerequisites:

```bash
# Linux/WSL
sudo apt install pkg-config libglib2.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev libssl-dev gcc

# Then
cd src-tauri
cargo fmt --all -- --check
cargo test --all-targets
cargo check

# Full desktop build
npm run tauri build
```

## Privacy

Entirely local. Imported audio is copied into app-owned data, excluded from Git, and omitted from metadata exports. No accounts, analytics, telemetry, or internet access.

## Documentation

- [Product requirements](PRD.md)
- [Architecture](docs/architecture.md)
- [Timing model](docs/timing.md)
- [Project format](docs/project-format.md)
- [Audio QA](docs/audio-qa.md)
- [Current status](docs/status.md)
- [Decisions](docs/decisions.md)
- [Development handoff](CHIPAGENTS_HANDOFF.md)
