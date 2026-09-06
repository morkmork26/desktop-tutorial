PRAGMA foreign_keys = ON;

CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  artist TEXT,
  audio_stored_name TEXT NOT NULL UNIQUE,
  audio_original_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'running', 'complete', 'failed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_opened_at TEXT NOT NULL
);

CREATE TABLE analysis_runs (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL,
  engine_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'failed', 'cancelled')),
  bpm REAL,
  meter_beats INTEGER NOT NULL DEFAULT 4,
  confidence REAL,
  result_json TEXT,
  warning_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE beat_maps (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  analysis_run_id TEXT REFERENCES analysis_runs(id) ON DELETE RESTRICT,
  parent_beat_map_id TEXT REFERENCES beat_maps(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('detector', 'correction', 'reset')),
  bpm REAL,
  beats_per_bar INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, version)
);

CREATE TABLE beats (
  id TEXT PRIMARY KEY NOT NULL,
  beat_map_id TEXT NOT NULL REFERENCES beat_maps(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  time_ms INTEGER NOT NULL CHECK (time_ms >= 0),
  beat_in_bar INTEGER NOT NULL CHECK (beat_in_bar >= 1),
  is_downbeat INTEGER NOT NULL CHECK (is_downbeat IN (0, 1)),
  UNIQUE(beat_map_id, ordinal),
  UNIQUE(beat_map_id, time_ms)
);

CREATE TABLE lyric_documents (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE lyric_lines (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES lyric_documents(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  text TEXT NOT NULL,
  UNIQUE(document_id, ordinal)
);

CREATE TABLE lyric_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  line_id TEXT NOT NULL REFERENCES lyric_lines(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  time_ms INTEGER CHECK (time_ms IS NULL OR time_ms >= 0),
  UNIQUE(line_id, ordinal)
);

CREATE TABLE lyric_syllables (
  id TEXT PRIMARY KEY NOT NULL,
  token_id TEXT NOT NULL REFERENCES lyric_tokens(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  text TEXT NOT NULL,
  time_ms INTEGER CHECK (time_ms IS NULL OR time_ms >= 0),
  UNIQUE(token_id, ordinal)
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms > start_ms),
  UNIQUE(project_id, ordinal)
);

CREATE TABLE loops (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('custom', 'line', 'section')),
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms > start_ms),
  created_at TEXT NOT NULL
);

CREATE TABLE practice_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  practiced_ms INTEGER NOT NULL DEFAULT 0 CHECK (practiced_ms >= 0),
  difficult_section_id TEXT REFERENCES sections(id) ON DELETE SET NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX projects_recent_idx ON projects(last_opened_at DESC);
CREATE INDEX analysis_project_idx ON analysis_runs(project_id, created_at DESC);
CREATE INDEX beats_map_time_idx ON beats(beat_map_id, time_ms);
CREATE INDEX sessions_project_idx ON practice_sessions(project_id, started_at DESC);
