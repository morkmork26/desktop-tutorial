# Timing Model

All persisted timestamps are integer milliseconds measured against the original media. At runtime, the Media3 player's current position determines the active beat, subdivision, syllable, section, and loop boundary.

On Android, the click mixer compares decoded PCM presentation timestamps with explicit beat timestamps:

```text
beat falls in buffer
  when beat media timestamp is within the PCM buffer's presentation-time range
click sample offset
  = beat timestamp − buffer start timestamp
```

The click is inserted before Media3's speed processor, so song and click are time-stretched together. Pause, seek, discontinuity, speed change, and loop restart reset the processor cursor from the player's new media position. Generation IDs prevent stale React snapshots from an earlier operation.

Variable beat spacing remains supported because subdivisions use the interval from each explicit beat to the next rather than a single global BPM. Empty and one-beat maps have defined behavior. Playback speed never mutates beat, lyric, section, or loop timestamps.
