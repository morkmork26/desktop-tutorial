# Rhythm Song Trainer

A private, desktop-first practice tool for singers who want to make rhythmic phrasing visible and repeatable.

## Current checkpoint

The repository begins with the synchronization lab: a deterministic 120 BPM fixture, explicit beat markers, media-clock playhead, 50/75/100% speed controls, phrase looping, subdivision display, and Web Audio metronome scheduling. This checkpoint intentionally proves timing before the library and editor grow around it.

## Run the synchronization lab

```bash
npm install
npm run fixtures
npm run dev
```

Open `http://localhost:1420`. Press **Play fixture**, enable the metronome, seek, change speed, and toggle the loop. The fixture begins with two seconds of silence; its first beat is accented.

Quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The desktop host additionally needs the Rust toolchain and Windows Tauri prerequisites. The current Linux workspace did not initially contain Rust; see [status](docs/status.md) for verified versus pending checks.

## Privacy

The intended V1 is entirely local. Imported audio is copied into app-owned data, excluded from Git, and omitted from metadata exports. No feature needs an account, analytics, telemetry, or internet access.

## Documentation

- [Product requirements](PRD.md)
- [Architecture](docs/architecture.md)
- [Timing model](docs/timing.md)
- [Project format](docs/project-format.md)
- [Audio QA](docs/audio-qa.md)
- [Current status](docs/status.md)
- [Decisions](docs/decisions.md)
- [ChipAgents continuation handoff](CHIPAGENTS_HANDOFF.md)
