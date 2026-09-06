# Project Format

Room-managed private SQLite is the source of truth for metadata. Room migrations are versioned, transactional, and tested on Android. Domain records use UUID text identifiers, ISO-8601 timestamps, and integer original-media milliseconds.

Metadata exports use `rhythm-song-trainer/project` schema version 1 and omit the copied audio file. They contain project metadata plus immutable analysis runs, versioned beat maps, lyric line/token/syllable structure, sections, loops, and settings. Imports validate the complete document before writing anything.

Waveform peaks and analyzer intermediates live under Android `cacheDir` with explicit cache versions. Cache loss is recoverable by decoding or analyzing again. Imported audio lives under private `filesDir/audio`, uses UUID names, and is excluded from source control and metadata exports. JavaScript receives record identifiers and validated DTOs, never arbitrary device paths or SQL.
