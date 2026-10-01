# ViralRoblox News (series plan)

A daily Roblox news Short with one fixed, branded format: the same presenter, the same news booth, the same thumbnail layout and the same call to action every episode. A viewer should know it's a ViralRoblox News video from the profile grid, from frame 1 and from the first second of audio.

Status: **plan agreed 2026-10-01, nothing built yet; decisions recorded at the bottom.** First drafted in the TikTok monetisation review (2026-10-01). The build order is at the bottom.

## Why this format

- 60-second Roblox news and drama is the account's proven winner: four of the top nine TikToks are that format (1.4M, 1.2M, 564K, 352K views), and they earned the most Creator Rewards.
- Competitors grow with one repeatable template: RobloxNewsTV has 378K followers from 100 videos with a fixed news-anchor set; Robloxianews uses a "BREAKING NEWS" roleplay template with up to 6M views.
- 92% of current TikTok traffic is Search, so news plus "[game] codes" and how-to side videos feed what already works.

## Series identity

- **Name:** ViralRoblox News (confirmed), numbered: "ViralRoblox News #N". The number goes on the desk screen, the cover and the description.
- **Brand colours:** midnight navy and cyan, matching the YouTube banner ("ROBLOX NEWS • STORIES"), with **red only for BREAKING**. Font: Luckiest Guy for headlines, as on the story covers.
- **Logo:** "ViralRoblox NEWS" wordmark with the channel mascot (grey block raccoon in black sunglasses). Never the official Roblox logo or wordmark.
- **Title pattern:** `ROBLOX NEWS: <headline as a question or shock statement>` plus an emoji, e.g. "ROBLOX NEWS: Roblox is DELETING this?! 😱".
- **Fixed hashtags:** `#robloxnews #roblox #viralrobloxgames` first, then 4 to 8 topic tags.
- **Playlist:** every episode goes in the "Roblox News" playlist (YouTube) and the matching TikTok playlist.

## The presenter (recurring character)

A dedicated news anchor who appears in **every** episode and **only** in news, so she becomes the face of the series. Leo, Max, Mia and the Noob stay in the story Shorts and can appear as "reporters in the field" or in clips.

- **Look (chosen 2026-10-01: "pink waves"):** a pretty, glamorous TV-anchor Roblox girl that viewers recognise instantly.
  - **Hair:** long, glossy, wavy **pink** hair (her signature; no other character has pink hair).
  - **Outfit:** fitted **navy blazer** with cyan piping and a "VR NEWS" pin over a **white top**. Not the teal/cyan blazer from the sketch: the user didn't like that colour. Small gold hoop earrings.
  - **Face:** big bright eyes with lashes, soft blush, a glossy friendly smile. A few fixed expressions: smile, shocked, wink, serious.
  - **Mic:** handheld mic with a navy "VR NEWS" mic flag.
  - Attractive and polished like a real presenter, kept age-appropriate for a young audience: no revealing outfits.
- **Build it like the rest of the cast:** R6 character in `assets/roblox_pack/characters/Skye/`, hair from free Roblox-made accessories placed with `wear()`/`fitAccessory()`, original shirt and pants templates from `tools/make_clothing.py`, faces in `faces/`. Pass `node web/fit_check.mjs --all` before any clip uses her. Add her to `CREDITS.md`.
- **Fixed poses for the set and covers:** sitting at the desk, pointing at the screen, hands-on-desk "breaking" lean, shocked (hands up), wave goodbye. Using the same poses every time is part of the recognisability.
- **Voice: Brittney - Social Media Voice - Fun, Youthful & Informative** (ElevenLabs voice library, voice ID `kPzsL2i3teMYv0FxEYQ6`; added to the account's My Voices on 2026-10-01). Different from George (the story narrator), so the series is also recognisable by ear. Use the same voice, model and settings every episode. Pick the model and settings on the pilot, then record them in `references/voice-and-audio.md`.
- **Name: Skye** (chosen 2026-10-01). She says it in the sign-off: "I'm Skye, this has been ViralRoblox News."
- **Merch tie-in (later):** the "ViralRoblox News Crew" PRESS jacket from the planned group clothing store can be the outfit she wears.

## The news booth (fixed set)

Built once as a reusable web-route template (`web/lib/newsDesk.js` plus props in `assets/roblox_pack/props/` and `map/`), then reused by every episode. Only the story content changes.

- **Desk:** curved block-style anchor desk with the ViralRoblox NEWS logo on the front panel, a branded mug and a tablet prop.
- **Backdrop:** a big video wall behind her that shows the story image (screenshot, game thumbnail or our own Studio recreation), plus a block-city skyline in navy/cyan like the banner.
- **Lighting:** the same studio lighting preset every episode (key light, cyan rim light, slight bloom).
- **Cameras:** three fixed angles: wide (desk and wall), medium (her and the screen), close-up (reactions). Cutting between fixed angles keeps the pace up without new set work.
- **On-screen graphics (overlay layer, same every episode):**
  - red **BREAKING** bar with the headline (2 to 6 words)
  - bottom ticker scrolling other headlines **and "FOLLOW @viralrobloxgames FOR DAILY ROBLOX NEWS"**
  - top-left logo bug with "LIVE" dot and episode number
  - date stamp
  - no on-screen source labels (the user finds them too busy); sources go at the end of the description instead (see Sources and credits)
  - word-highlight captions as on the story Shorts, placed above the ticker and inside the TikTok UI safe area
- **Evidence shots:** real full-screen screenshots or clips with the anchor in a corner picture-in-picture, so she stays on screen the whole time.

## Script template (65 to 75 s, 150 to 170 words)

| Time | Beat | Notes |
|---|---|---|
| 0 to 2 s | Hook question or shock line | "Roblox is DELETING this?!" Frame 1 already shows her at the desk, the BREAKING bar and the topic on the wall. No intro card. |
| 2 to 4 s | Signature open | "This is ViralRoblox News." (one second, always identical) |
| 4 to 45 s | Three facts | One fact per evidence shot (real screenshot or game image). |
| 45 to 55 s | "What this means for you" | The practical takeaway. |
| ~55 s | **Follow CTA (spoken)** | "Follow ViralRobloxGames so you never miss Roblox news!" with a FOLLOW button pop-up. |
| 55 to 65 s | Comment prompt plus optional game plug | "Would you keep playing? Comment below 👇" and, on suitable topics, "Play Hunt For Eggs, link in bio". |
| last 2 s | **Sign-off plus loop** | Fixed catchphrase: "I'm Skye, this has been ViralRoblox News. Follow for more!" The final line leads back into the hook so the loop feels seamless. |

The calls to action are fixed and on every episode, in the same style as the story Shorts' "Who would YOU…? 👇":

1. spoken follow line ("Follow ViralRobloxGames for more…") and on-screen FOLLOW pop-up
2. ticker line "FOLLOW @viralrobloxgames FOR DAILY ROBLOX NEWS"
3. description starts with the hook, ends with "👉 Follow @viralrobloxgames for daily Roblox news" and the comment question
4. Hunt For Eggs plug ("link in bio") only where it fits, never more than one game plug per video

Length: over 60 s for TikTok Creator Rewards (aim for 65 s or more; exactly 1:00 doesn't qualify).

## Thumbnails / covers (one fixed layout)

Rendered from the booth scene with a `cover_clip.js` per episode, as for the story Shorts. The layout never changes, so a grid of covers reads as one series:

- **Top band:** red "ROBLOX NEWS" label with the ViralRoblox logo and a white episode badge "#N".
- **Left:** the presenter in one of the fixed cover poses (shocked, pointing at the screen, or wink), large and cut out with a cyan rim.
- **Right:** the topic image inside a TV-screen frame (the same frame every time).
- **Bottom:** 2 to 4 word headline in Luckiest Guy, white with yellow highlight word, dark outline.
- **Background:** navy/cyan studio blur, never a different colour scheme.
- **Safe areas:** keep the headline, the episode badge and her face inside the centre 1080x1440 (the TikTok profile grid crops 9:16 to 3:4) and above the bottom 300 px (TikTok UI).
- **Frame 1 must match the cover**, so the YouTube Shorts frame picker and the TikTok first frame both show the same branded look.
- Story Shorts keep their current, different look, so the two series are never confused.

## Daily research and production pipeline

**Morning scheduled task** (no posting, no paid generation):

1. **Collect** from: Roblox DevForum announcements, the Roblox Newsroom, live player counts for trending games (with day-on-day jumps), r/roblox hot posts, recent uploads from Roblox news channels, TikTok Creative Center trending gaming hashtags, status.roblox.com (outages go viral), and game code and event calendars.
2. **Score** each topic on how new it is, how fast it's growing, search interest, whether we've covered it before (`ideas/news-ledger.json`), and closeness to past hits (updates, removals, bans, "everyone deleting").
3. **Fact-check:** at least two independent sources per topic, or the script calls it a rumour ("reportedly", "leaks say"). Accuracy is the biggest risk for automated news.
4. **Digest to the user:** top 5 topics, each with a draft script in the template above.

**After the user approves a topic:** narration (her voice), web render in the booth template, captions, encode and review, as in `references/workflow.md`. Publishing follows `references/publishing.md`: nothing is posted without the user's OK, and each upload is labelled as AI-generated where the platform asks.

**Side output:** "[game] codes" and how-to videos for trending games, in the same booth, for search traffic.

## Cadence and budget

- One news episode a day, posted 5 to 7 pm UK time, plus one story Short when possible.
- Never post the same video twice (TikTok treats it as duplicate content and can flag the account as unoriginal).
- Narration is about 1,000 ElevenLabs characters per episode, about 30K a month at one a day. Decision (2026-10-01): plan for daily and ignore the current 10K limit for now; revisit the ElevenLabs plan before launch.
- Rendering is the web route: no GarageFarm cost.

## Build order

1. **Presenter:** build Skye (pink waves, navy blazer) in the R6 pack, render previews for the user to approve, and pass the fit check.
2. **Booth:** desk, video wall, lighting, three camera angles and the overlay layer, as a reusable template.
3. **Cover template:** render 3 sample covers side by side to check the grid looks like one series.
4. **Research script and `ideas/news-ledger.json`**, then the morning scheduled task.
5. **Pilot episode #1** end to end, reviewed by the user before anything is posted.

## Sources and credits

- Evidence images are **real screenshots** from official sources: Roblox Newsroom and DevForum posts, game pages and thumbnails, in-game captures, official X/Twitter posts from Roblox or the game's developer.
- **Nothing about sources appears in the video** (no source labels, no RUMOUR tags; the user finds them unnecessary and ugly). Every source goes at the end of the description, after the follow line and hashtags:

  ```
  Sources:
  • Roblox DevForum: <post title> (<short link>)
  • <Game name> by <developer group>: <what was used>
  ```

  Keep the full source list in the episode's `sources.json` too, so any claim can be checked later.
- Use screenshots for commentary only: one image per fact, shown briefly while Skye comments on it. Don't use clips of other creators' videos, which risk Content ID claims and TikTok's "unoriginal content" flag.
- A claim with only one source is called a rumour in the script ("reportedly", "leaks say").

## Decisions (2026-10-01)

- Presenter: **Skye**, look **pink waves with a navy blazer and white top** (not teal), voice **Brittney** (`kPzsL2i3teMYv0FxEYQ6`).
- Series name: **ViralRoblox News**.
- Evidence: **real screenshots**. Sources are credited only at the end of the description, never in the video.
- Cadence: **daily**; ElevenLabs limits not a concern for now.
