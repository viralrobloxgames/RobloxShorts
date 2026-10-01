# ViralRoblox News #1: Roblox without the app (resume notes)

First episode of the daily news series (`references/news-series.md`). Topic: the Roblox web player (Chrome, no app, by
the end of 2026) and offline play (mid-2027), from RDC 2026 (2026-09-11).

## Done
- Research and fact check: `source/script.md` (shot plan, fact-check table, description draft), `source/sources.json`.
- Narration script `script.txt`: 166 words, 928 ElevenLabs characters.
- Evidence screenshots in `source/evidence/` (taken with `web/news_shot.mjs`, cookie banners hidden, the quoted
  paragraph outlined in yellow):
  - `01_newsroom_header.png`: the RDC 2026 Newsroom post title, author and date
  - `02_newsroom_browser.png`: the "Play on the web" paragraph
  - `03_devforum_post.png`: the DevForum RDC26 post
  - `04_newsroom_offline.png`: the "Play offline" paragraph
  - `wall_rdc26.png`: the RDC26 art cropped to 16:9 (not used on the set: it is blue)
  - `wall_story_card.png`: pink "PLAY IN YOUR BROWSER" story card for the TOP STORY panel (rbxassetid://86820019915207)
- Booth built in Studio (`Workspace.ViralNews.Booth`, built by `assets/roblox_pack/tools/luau/build_news_booth.luau`)
  with this episode's story card (set v2, pink).

## Next
1. The user approves or edits the script.
2. Narration with Brittney (`kPzsL2i3teMYv0FxEYQ6`), then word timings into `audio/alignment/`.
3. Filming method in Studio: per-shot camera marks (`Booth.Cameras`), face swaps on the word timings, and capture at
   9:16. The Studio viewport is landscape, so a centre crop is only 364x648 px. This needs a portrait viewport or a
   higher-resolution capture before the pilot.
4. Overlay layer (BREAKING bar, ticker, captions, FOLLOW pop-up), the cover, then review. Nothing is posted without
   the user's OK.
