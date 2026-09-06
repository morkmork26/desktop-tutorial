# Rhythm Song Trainer

A private, offline Android practice tool that helps singers see and rehearse rhythmic phrasing.

> Status: Android migration is beginning. The checked-in Tauri desktop code is an earlier prototype retained temporarily as a behavioral reference; it is not the release target.

## Android V1

- Import local WAV/MP3 audio through Android's document picker.
- Analyze tempo and explicit beats locally, then correct offset/downbeat/tempo.
- Paste lyrics and synchronize syllables by tapping or nudging timestamps.
- Practice with native pitch-preserving speed, synchronized click, count-in, sections, and A/B loops.
- Save projects privately with Room and reopen without losing work.
- No account, server, telemetry, scraping, downloading, or internet permission.

## Technology

React 19, strict TypeScript, Vite, Capacitor 8, Kotlin, Jetpack Media3, Room/SQLite, CSS Modules, Vitest, JUnit, and Android instrumented tests.

The native Android shell has not yet been scaffolded. The implementation sequence and exact native bridge are documented in [the Android handoff](CHIPAGENTS_HANDOFF.md) and [architecture](docs/architecture.md).

## Current reusable checks

```bash
npm install
npm run fixtures
npm run typecheck
npm run lint
npm test
npm run build
```

Planned Android checks after A1:

```bash
npx cap sync android
cd android
./gradlew test lint assembleDebug bundleRelease
./gradlew connectedDebugAndroidTest
```

## Documentation

- [Android product requirements](PRD.md)
- [Architecture](docs/architecture.md)
- [Research-led UI/UX direction](docs/design.md)
- [Implementation handoff and milestones](CHIPAGENTS_HANDOFF.md)
- [Timing model](docs/timing.md)
- [Project format](docs/project-format.md)
- [Android audio QA](docs/audio-qa.md)
- [Current status](docs/status.md)
- [Decisions](docs/decisions.md)

## License and privacy

Source code is MIT licensed. Imported songs and lyrics belong to the user, remain in Android private app storage, and are omitted from metadata exports.
