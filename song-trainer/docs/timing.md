# Timing Model

All persisted timestamps are integer milliseconds measured against the original media. At runtime, `media.currentTime × 1000` determines the active beat, subdivision, syllable, section, and loop boundary.

The metronome bridges two clocks only when scheduling a click:

```text
scheduled AudioContext time
  = AudioContext.currentTime
  + (future beat media time − current media time) / playbackRate
```

A 150 ms media-time lookahead is rescanned every 25 ms. Pause, resume, seek, speed change, and loop restart discard the scheduler cursor and build a fresh window. Already-created Web Audio sources cannot be unscheduled, so the deliberately short window limits stale clicks.

Variable beat spacing is supported because subdivisions use the interval from each explicit beat to the next rather than a single global BPM. Empty and one-beat maps have defined behavior. Playback speed does not mutate beat, lyric, section, or loop timestamps.
