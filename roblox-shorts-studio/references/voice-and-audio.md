# Narration, timings, music and effects

## Voice

The Roblox series narrator is **George - Warm, Captivating Storyteller** (`JBFqnCBsd6RMkjVDRZzb`), using `eleven_multilingual_v2`. Settings: speed 1.0, stability 0.5, similarity 0.75, style 0, speaker boost on. Use natural pitch and speed with **no PS2 crunch**.

### Route A: connector or signed-in website (default)

Use the connected ElevenLabs tools, or the user's signed-in ElevenLabs site in Brave. Generate from the saved `script.txt` only after approval. Download the finished take (pre-approved) to `audio/narration.mp3`, or to `audio/source/` if you will splice. Record the voice, model, settings, credits and duration in `audio/narration-source.json`. A pending request is never a reason to generate again: check History.

### Route B: API (`scripts/voice.py`)

Set `"elevenlabs_mode": "api"` in settings and store `ELEVENLABS_API_KEY` in the OS keyring (service `roblox-shorts-studio`) or the environment. Then run `python scripts/voice.py generate projects/<slug> --take take-01`. It makes one billed request with timestamps and writes `audio/narration.mp3`, the alignment captions and the source record. Repeating a completed take reuses it. A changed script needs a new take name.

### Credits reference

AFK's full 64 s script took 845 credits, and two insert lines took 56. For TikTok's >60 s rule, generate only the missing lines and splice them (`examples/the-afk-champion/source/assemble_narration.py` finds the quietest window near each cut and crossfades).

## Word timings

Run `python scripts/studio.py transcribe projects/<slug>`, which uses local faster-whisper (CPU, int8). On the original laptop the default CTranslate2 4.8.2 crashes, so set `ctranslate2_compat` to a 4.6.0 copy and `transcription_model` to the cached `faster-whisper-base.en` snapshot. Always compare the transcript with `script.txt`.

## Music

`assets/audio/playful_history_music.wav` is an upbeat instrumental (ElevenLabs music, from the creator's own account; see `assets/audio/PROVENANCE.md`). It is about 32 s long and loops automatically. Default level is `music_gain` 0.065 under `voice_gain` 1.4, with a fade over the last 1.2 s. Set `finish.music` in `project.json` to another WAV path to change it.

## Sound effects

Library: `impact_1-4`, `swish_1-4`, `click`, `drum_hit`. Synthesized tones in cues cover coins, pings, beeps and stings (`{"tone": [988, 1319], "dur": .12}`). Keep effects motivated by visible action and quieter than the voice. More action does not mean more effects. Mastering: `alimiter` 0.95 → `loudnorm` I −16 / TP −1.5 / LRA 9, at 48 kHz.
