# Final review brief (fresh session; you made none of the video)

The whole video is stitched: `delivery/I_Secretly_Lived_In_My_Enemys_House.mp4` (or its parts, see `delivery/README.md`).
Role `review-N` covers {RANGE}; review-2 also owns the global checks. Read `source/story.md`, `source/boundary_sheet.md`,
`script.txt`, SKILL.md's hard rules. **Challenge it like a demanding YouTube editor**: the user asked for a reviewer that
challenges any section that needs tweaks. Status file `production/status/review-N.md`.

1. Watch your range properly: extract frames at 2-4 fps for your range (`ffmpeg -ss ... -t ... -vf fps=3,scale=640:-1`),
   contact sheets of every shot, and listen to the audio (loudness per line with `ebur128`, gaps, clicks, music level under
   speech, voices consistent between chapters, effects for whisper/ghost/phone/offscreen right).
2. Challenge: does each scene land (the hook in the first 10 s, the jokes' timing, the twist set-up and payoff), is anything
   confusing, slow, repetitive or flat, are faces readable, does the camera follow who speaks, do the seams between chapters
   feel like one film, captions readable and in the right colours, no blank or blocked frames
   (`python3 scripts/review/blank_frames.py`), continuity (props, wardrobe, persistent things), pacing per chapter.
   review-2 also: the whole soundtrack (-14 LUFS, true peak, music bed, no gaps at seams), the YouTube chapter list, the
   end screen, total length, title/description/thumbnail drafts.
3. Write `production/review/review-N.md`: a numbered list of challenges, each with the timestamp (mm:ss), chapter, what's
   wrong and why it matters, the concrete fix, and severity (must / should / could). Musts are anything a viewer would
   notice or that weakens the story. Push it, set STATUS: DONE.
4. After the fixes land (the orchestrator will message you), re-watch the changed timestamps and confirm or re-challenge.

Ranges (usage-lean, 14:50Z): two reviewers. review-1 ch01-ch06. review-2 ch07-ch11, then the global checks on the whole
film once every segment is in (it owns what the brief calls review-4: soundtrack, seams, chapter list, end screen, package).
review-2, package: two thumbnail drafts exist (`delivery/I_Secretly_Lived_In_My_Enemys_House_thumbnail.jpg` "HE NEVER
KNEW" with variants in `delivery/thumbnail_variants/`, and an older `delivery/thumbnail.jpg` "I LIVED IN HIS HOUSE! 7 DAYS"
with `youtube.md`). Pick one and say why. Challenge whether "HE NEVER KNEW" fights the twist (Max knew all along) or sets
it up, whether faces and poses read at phone size, and whether the description's hook and chapter list match the film.

## Pipelined start (orchestrator, 13:55Z)
Reviewers start as soon as every segment of their range is on main (`delivery/chapters/chNN_a.mp4` + `chNN_b.mp4`, status
files DONE), not after the whole film. Build your block yourself (nothing extra is pushed):
`python3 scripts/stitch_longform.py projects/i-secretly-lived-in-my-enemys-house --chapters A-B --no-split`
(from `roblox-shorts-studio/`; it needs the segments and `audio/chapters/chNN/` from main and takes a few minutes) and
review that MP4. review-2 builds the whole film (all 11) when everything is in and owns the seams between blocks.
Be quick and decisive: one complete pass (aim for ~30 min), musts first. Fixes are re-rendered only where frames change.

## Chapter by chapter (orchestrator, 15:05Z)
Don't wait for your whole block: as soon as a chapter's segments are both on main (`chNN_a.mp4` + `chNN_b.mp4`), stitch
that chapter alone (`--chapters N-N --no-split`, a few minutes) and review it; write its section in your review file and
push it at once so fixes can start. When your block is complete, do one flow pass over the stitched block (pacing between
chapters, seams, repetition). Note: `web/changed_frames.mjs --delete` is unreliable for now (see requests.md); fixes are
re-rendered by frame range, so give exact times for every must.
