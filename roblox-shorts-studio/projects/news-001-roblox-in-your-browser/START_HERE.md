# ViralRoblox News #1: Roblox without the app (resume notes)

First episode of the daily news series (`references/news-series.md`). Topic: the Roblox web player (Chrome, no app, by
the end of 2026) and offline play (mid-2027), from RDC 2026 (2026-09-11). 66.0 s (1,980 frames), 1080x1920, 30 fps.

## Done
- **Research and fact check:** `source/script.md` (shot plan, fact-check table, description draft) and `source/sources.json`.
- **Narration:** Brittney (`kPzsL2i3teMYv0FxEYQ6`), `eleven_multilingual_v2`, default settings, generated on the signed-in ElevenLabs site, 927 characters (`audio/narration-source.json`).
  - The raw take is 58.8 s. `source/assemble_narration.py` adds news-style beats after each section, taking it to 64.9 s in `audio/narration.wav`.
  - It also shifts the faster-whisper word timings (raw copy in `audio/alignment/raw_captions.json`) and fixes the split brand words (ViralRoblox, ViralRobloxGames, mid-2027).
- **v2 after review (2026-10-02):** the user found the stills' lip flap and wave unnatural, wanted urgent news music and a non-white countertop. Now:
  - **Animation:** `source/performance.py` makes the lip-sync visemes (9 mouth shapes from the voice's loudness and spectrum), blinks, nods and gestures, and writes `source/perform.luau`. In Studio Edit mode that animates the anchored rig by FK (head sway, breathing, hands lifting, a real wave) at half speed. Each camera (W, M, C) was screen-recorded with ffmpeg `ddagrab` of the viewport (296,252 1160x648) and turned into frames by `source/extract_takes.py`, which also removes the view cube and the viewport's centre line.
  - **Music:** Pixabay "Breaking News" (PaulYudin), ducked under the voice by `source/build_music.py`.
  - **Countertop:** hot pink with a purple strip.
- **v1 Studio stills** (`source/stills/`, still used for the blurred card backdrop): Skye in the pink set (`Workspace.ViralNews.Booth`), captured with the rolled-camera 9:16 trick.
  - Each camera (Wide, Medium, CloseUp) has `talk`, `happy` and `blink` stills; there is also `M_surprised`, plus the wave poses `M_waveA_happy`, `M_waveA_talk` and `M_waveB_happy`.
  - The stills differ only around her face, so swapping them reads as lip flap.
- **Evidence cards** (`source/evidence/cards/`): two to four short lines each, with the key words behind a yellow highlighter.
  - Taken with `web/news_shot.mjs --span ... --mark ... --col 250` (a narrow column means bigger text in the video). The user asked for short, readable cards, because viewers get two or three seconds per card.
  - The header card is cropped from `source/evidence/vertical/01_header.png`.
- **Picture:** `source/compose_frames.py` writes `renders/frames/` (git-ignored). Shots, lip flap, blinks, pop-ups (stamps, chips, FOLLOW, COMMENT, logo sting), the HUD (logo bug, BREAKING bar, ticker) and `source/sound_cues.json` all come from one word-keyed timeline.
- **Sound and captions:** `scripts/finish.py` mixes the voice, the music bed and the cues, then burns in the word captions (`caption_margin_v` 450, so they sit between the BREAKING bar and the ticker).
- **Cover:** `source/make_cover.py` writes `delivery/Roblox_Without_The_App_cover.jpg`, plus `_grid.jpg`, the TikTok 3:4 check.
- **Posting text:** `delivery/post.json`, with sources at the end of the description and no AI label.

## Rebuild
```
cd roblox-shorts-studio/projects/news-001-roblox-in-your-browser
python source/assemble_narration.py
python source/compose_frames.py --only 30,300,600      # review frames -> renders/review/
python source/compose_frames.py --range 1,330          # x6 in parallel (1,330 331,660 ... 1651,1980); resumable
python ../../scripts/finish.py . --encode --frames renders/frames
python source/make_cover.py
```

## Next
- The user reviews `delivery/Roblox_Without_The_App.mp4`. Nothing is posted without their OK; posting follows `references/publishing.md`, including the `_upload.mp4` with the cover as the last frame for YouTube.
