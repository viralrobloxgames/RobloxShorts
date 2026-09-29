# Captions and on-screen text

The font is **Luckiest Guy** (`assets/fonts`, OFL). ffmpeg reads it through `fontsdir`, so it doesn't need to be installed. The canvas is 1080 × 1920.

## Word-highlight captions (the `Words` style)

Captions are uppercase phrases of up to 4 words or 25 characters, grouped from measured timings. The current word is highlighted in amber (`&H003DDAFF`) and the rest are white. They have a dark navy outline (6) and a shadow (2), bottom-centre alignment, and font size 76.

Vertical position is `finish.caption_margin_v`:

- **640** (default, from AFK) sits in the upper-middle, clear of TikTok's caption, buttons and progress bar.
- **325** (Free Coin Trap) sits lower. It's fine for YouTube Shorts, but check it against the TikTok UI.

Keep all text out of the **bottom 20 %** and **right 15 %** of the frame.

## `source/project.json` → `finish` options

| key | default | meaning |
|---|---|---|
| `music` | `playful_history_music` | library name or WAV path |
| `voice_gain` / `music_gain` / `sfx_gain` | 1.4 / 0.065 / 0.7 | mix levels before mastering |
| `loudness` | −16 | integrated LUFS target |
| `caption_font_size` | 76 | Words style size |
| `caption_margin_v` | 640 | Words vertical margin |
| `caption_highlight` | `&H003DDAFF` | current-word colour (ASS BGR) |
| `word_fixes` | `{}` | transcript corrections, e.g. `{"BY": "BYE"}` |

## Overlays (`source/overlays.json`)

Extra ASS events are drawn above the captions:

```json
[
  {"start": 0, "end": 15.1, "style": "HUD", "text": "ROUND 1/5   ALIVE 3"},
  {"start": 32.3, "end": 34.1, "style": "Out", "text": "{\\fad(80,200)}MAX ELIMINATED"},
  {"start": 5.72, "end": 7.5, "style": "Title", "text": "{\\fscx170\\fscy170\\t(0,140,\\fscx100\\fscy100)\\fad(0,220)}ROUND 1\\NFLOOD"}
]
```

- `HUD`: top-left box below the For You tabs.
- `Out`: a red elimination line under the HUD.
- `Title`: a big gold pop in the upper-middle. Time it to a sound sting.
