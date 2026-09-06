# Android UI/UX Direction

## Product character

The app should feel like a musician's practice tool: calm, precise, immediate, and physically usable while singing. Keep the existing warm dark palette—charcoal, cream, amber focus, mint confirmation—but rebuild the composition for touch. Visual personality comes from excellent typography, rhythmic spacing, a legible waveform, and deliberate state changes, not decoration.

## Research baseline

- Android recommends adaptive layouts that switch navigation and pane structure by window size instead of stretching phone UI across tablets: <https://developer.android.com/develop/adaptive-apps/guides/adaptive-dos-and-donts>
- Android's content guidance uses 16 dp compact margins, consistent alignment, clear containment, and a limited number of actions per view: <https://developer.android.com/design/ui/mobile/guides/layout-and-content/content-structure>
- Interactive targets must be at least 48 × 48 dp: <https://developer.android.com/develop/ui/compose/accessibility/api-defaults>
- Edge-to-edge backgrounds are appropriate, but controls must avoid system bars, cutouts, and gesture insets: <https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge>
- Moises validates the practice-tool combination of waveform, precise loop selection, speed control, lyrics, count-in, and synchronized metronome; this app narrows that workflow specifically to vocal rhythm: <https://moises.ai/products/moises-app/>

These are behavioral references, not a license to copy branding, assets, or exact layouts.

## Information architecture

### Library

- Small top app bar: product name, search action, overflow for import/export/settings.
- Recent projects are full-width rows on phones, not decorative cards. Each row shows title, optional artist, duration, analysis state, and last practiced date.
- A single extended “Import song” action anchors the lower reachable area when the library is empty; after projects exist it becomes a regular top-level action.
- Analysis progress stays attached to the imported row so the user can leave and return without a blocking fake loading screen.

### Project

Use four destinations: Practice, Beats, Lyrics, More.

- Compact: bottom navigation; persistent mini transport sits directly above it.
- Medium/expanded: navigation rail plus two panes. Practice uses lyrics/waveform as the main pane and transport/loop tools as the supporting pane.
- Android back returns editor → project practice → library; it never exits from a deep screen without traversing this hierarchy.

### Practice screen

Top to bottom on a phone:

1. compact song identity and section name;
2. two stable lyric lines (previous/current/next transition without vertical jumping);
3. waveform with beat/downbeat ticks and draggable A/B loop handles;
4. current beat/subdivision strip;
5. large centered play/pause with seek-back and seek-forward;
6. one-row speed chips (50/75/100), metronome toggle, and loop toggle;
7. bottom navigation.

The mini transport becomes the full transport on Practice, avoiding duplicated controls. Metronome and loop state use text plus icon/color. A short haptic confirms loop points; repeated beat haptics are off by default.

### Beat and lyric editors

Editors are explicit modes, never hidden gestures in Practice.

- Beats: waveform dominates; bottom sheet contains offset, tap tempo, downbeat, undo, and reset. Every destructive reset names the preserved detector version.
- Lyrics: lyrics occupy the main scroll area; a sticky sync bar contains play/pause, current timestamp, undo, and large Tap button. The keyboard is used only for text editing; touch remains complete.
- Unsynced, estimated, and manually confirmed timing have distinct labels and marker shapes, not color alone.

## Anti-slop rules

- No gradient hero banners, glassmorphism, floating blobs, arbitrary shadows, fake charts, fake testimonials, “AI magic” copy, or excessive rounded cards.
- No oversized marketing headline inside the installed app.
- No icon-only control when its meaning is unfamiliar; transport icons still require accessibility labels.
- No modal for routine actions that can be an inline panel or bottom sheet.
- No disabled-looking low-contrast text for secondary information.
- No animation that moves the lyric baseline while the singer is reading.
- No fabricated album art. Use a restrained waveform/project monogram when artwork is unavailable.
- No hiding core practice controls in overflow menus.

## Visual system

- 4 dp spacing base; primary rhythm 8/12/16/24/32 dp.
- Compact horizontal content margin: 16 dp; expanded panes: 24–32 dp.
- Minimum target: 48 dp; primary play control: 64–72 dp.
- Body text at least 16 sp; active lyric 24–32 sp depending on width; timing labels use tabular numerals.
- One surface hierarchy plus hairline dividers. Cards are used only when containment clarifies a distinct object.
- Motion: 120–220 ms for state transitions; honor reduced motion; waveform/playhead motion is functional and remains.

## UX verification

- Test 360 × 800, 412 × 915, 600 × 960, 800 × 1280, landscape, split-screen, font scale 1.0/1.3/2.0, dark theme, TalkBack, switch access, and keyboard connected.
- Verify every core task with one hand and without relying on long press.
- Run a five-person hallway usability pass: import, create a four-second loop, set 75%, enable click, sync one lyric line, and reopen the project without coaching.
- Treat screenshots as evidence only when backed by the real app state and real native adapters.
