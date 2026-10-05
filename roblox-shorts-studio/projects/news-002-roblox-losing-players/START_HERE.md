# ViralRoblox News #2: Roblox is losing players (resume notes)

Topic: Roblox's daily players fell from 152 million (Q3 2025) to 123 million (Q2 2026), three drops in a row; the stock is
down about 70% from its high and Jefferies cut it to Underperform on 2026-09-28. Research done 2026-10-05. v1 of this
episode (YouTube videos removed from game pages) was replaced at the user's request for a bigger story. Script approved
2026-10-05. **First episode made entirely in a cloud session** (no laptop, no Studio). 64.9 s, 1080x1920, 30 fps.

## Done
- Research, topic pick and fact check: `source/script.md` and `source/sources.json`.
- **Narration:** Brittney cloud clone, `scripts/qwen_cloud_clone.py --voice brittney --take take-01` (Qwen3-TTS 1.7B-Base, CPU,
  ~10 s per second of speech here), line 13 redone, `scripts/tighten_clips.py`, then `scripts/narrate.py --beat 0.5 --gap 0.2`
  (the clone reads ~58 s of speech for 159 words; default gaps made it 67 s). Speech ends at 63.3 s.
  Caption fixes in `audio/alignment/captions.json`: "70 %" -> "70%", "28" -> "28th", "million?" -> "million.".
- **Skye (cloud):** `source/skye2d.py` animates the News #1 Studio stills: her mouth is painted out and her own glam_doll mouth
  textures (closed / small / e / wide / o / happy) are pasted in, placed by matching the texture smile to the rendered smile
  and recoloured to the rendered lip colour; mouth shape follows the voice's loudness per frame, 4-frame blinks every ~3.3 s,
  slow camera drift and push-ins. If `renders/takes/<CAM>/` exists (Studio takes, news-001 route) those are used instead.
- **Evidence cards** (`source/evidence/cards/`, `web/news_shot.mjs`): Music Ally (123M, 152M, +10% YoY, chat limits) and
  Tradingpedia (Jefferies). SEC blocks automated browsers, so the shareholder letter is quoted in the fact check, not shown.
  Our own graphics: the daily-players bar chart and the $142 -> $44 stock card. News #1's browser card for the last fact.
- **Picture:** `source/compose_frames.py` (word-keyed timeline, HUD, pops, sound cues) -> `renders/frames/` (git-ignored).
- **Music:** Kevin MacLeod "News Theme", `source/build_music.py` (credit is in post.json).
- **Cover:** `source/make_cover.py` (Skye surprised, chart in the TV frame, "30 MILLION / GONE?!"), grid check passes.
- **Delivery:** `delivery/Roblox_Is_Losing_Players.mp4` (cover in the last 0.5 s), `_cover.jpg/.png`, `_post.md`, `post.json`.

## Known limits of the cloud cut
- Skye's body doesn't move (stills): only the face, blinks and camera move. The desk is the old white countertop from the v1
  stills (the user had it changed to hot pink in Studio). A Wide still doesn't exist, so M stands in for Wide.
- A fully animated cut needs Studio takes recorded on the laptop (news-001 `perform.luau` + `extract_takes.py`), then just
  re-run compose and finish. Better long-term: record reusable mouthless Skye loops once (see references/news-series.md).

## Rebuild
```
cd roblox-shorts-studio/projects/news-002-roblox-losing-players
python source/build_music.py
python source/compose_frames.py --only 1,300,600          # review frames -> renders/review/
python source/compose_frames.py --range 1,483             # x4 in parallel (484,966 967,1449 1450,1932); resumable
python source/make_cover.py
python ../../scripts/finish.py . --encode --frames renders/frames
```

## Next
- The user reviews `delivery/Roblox_Is_Losing_Players.mp4`. Nothing is posted without their OK; posting follows `references/publishing.md`.
