# Project Format

SQLite is the source of truth for metadata. Schema migrations are versioned and transactional. Domain records use UUID text identifiers, ISO-8601 timestamps, and integer original-media milliseconds.

Metadata exports use `rhythm-song-trainer/project` schema version 1 and omit the copied audio file. They contain project metadata plus immutable analysis runs, versioned beat maps, lyric line/token/syllable structure, sections, loops, and settings. Imports validate the complete document before writing anything.

Waveform peaks and analyzer intermediates live in app cache files with explicit cache versions. Cache loss is recoverable by decoding or analyzing again. Imported audio lives in app-owned storage and is excluded from source control and metadata exports.
