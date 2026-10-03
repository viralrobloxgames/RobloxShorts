# The Server Says One (After Hours horror, pilot 1): resume notes

First horror short, pilot 1 of `references/horror-series.md`. 61.9 s (1,857 frames). Web route, Roblox R6 pack + the
After Hours horror kit (Unlisted entity, lobby, door, corridor, horror audio), George voice C narration
(Qwen3-TTS 1.7B, cloud), comment question + follow-for-part-2 call to action at the end.

## The story rule (keep it consistent in later episodes)
The Unlisted is Max's **mirror image, half a second late** (`D = 0.5` in `web/timeline.js`). Facing him, it copies sideways
moves in the same direction and moves along the line between them the opposite way; every copy brings it a step closer
(the mirror plane creeps towards Max). It can only copy what it has seen: when Max sprints for the door the copy sprints
the other way, and once he's through it has nothing left to copy, so it freezes, its head turns, and it charges the door
too late. Recurring clue: the player list; at the end it reads 2 (Max, Max) and a copy of Max with the cyan chest light
stands at the far end of the corridor. Then the lights go out, and two identical Maxes stand side by side, no longer
late. Comment CTA: "Which Max is real? Left or right?" + follow for part 2. **Canon for part 2 (don't reveal before it):
the real Max is on the LEFT; the copy is a mirror image (`mirror: true`, hoodie star on the wrong side).**

## Done
- Script approved (user asked for ~62 s and tension throughout); narration take-01, 61.3 s of speech with 1.2 s beats
  (blank lines in `script.txt`), every word present.
- `web/timeline.js`: all story logic in game time; the chase is shot as overlapping slow-motion windows (`CHASE`,
  speed-ramped), shared with `source/sound_cues.py`. `web/server_clip.js`: cameras, lights, player list, CTA card.
- Sound: 69 cues from the horror kit (motif, footsteps, door, latch, heartbeat, reveal hits) over `horror/night_bed`.
- Fit check: no accessories (0 pairs), reviewed. Cover `delivery/The_Server_Says_One_cover.{png,jpg}`; `post.json`.

## Delivered
- `delivery/The_Server_Says_One.mp4` (65.5 s, 1080x1920, validated), cover, captions, `post.json`.

## Next
- Post only after the user approves this MP4 (TikTok, then YouTube). Then plan Part 2: reveal which Max is real (LEFT).

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/the-server-says-one/source/beats.py && python3 projects/the-server-says-one/source/sound_cues.py
python3 scripts/finish.py projects/the-server-says-one
node web/fit_check.mjs --clip projects/the-server-says-one/web/server_clip.js        # then --reviewed
node web/render.mjs --clip projects/the-server-says-one/web/server_clip.js --out projects/the-server-says-one/renders/web --workers 3 --resume
python3 scripts/finish.py projects/the-server-says-one --encode --frames projects/the-server-says-one/renders/web
node web/render.mjs --clip projects/the-server-says-one/web/cover_clip.js --out /tmp/cover --frames 1 --workers 1
```
