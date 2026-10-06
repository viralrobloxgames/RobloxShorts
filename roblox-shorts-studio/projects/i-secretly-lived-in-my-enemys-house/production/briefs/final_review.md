# Final review brief (fresh session; you made none of the video)

The whole video is stitched: `delivery/I_Secretly_Lived_In_My_Enemys_House.mp4` (or its parts, see `delivery/README.md`).
Role `review-N` covers {RANGE}; review-4 also owns the global checks. Read `source/story.md`, `source/boundary_sheet.md`,
`script.txt`, SKILL.md's hard rules. **Challenge it like a demanding YouTube editor**: the user asked for a reviewer that
challenges any section that needs tweaks. Status file `production/status/review-N.md`.

1. Watch your range properly: extract frames at 2-4 fps for your range (`ffmpeg -ss ... -t ... -vf fps=3,scale=640:-1`),
   contact sheets of every shot, and listen to the audio (loudness per line with `ebur128`, gaps, clicks, music level under
   speech, voices consistent between chapters, effects for whisper/ghost/phone/offscreen right).
2. Challenge: does each scene land (the hook in the first 10 s, the jokes' timing, the twist set-up and payoff), is anything
   confusing, slow, repetitive or flat, are faces readable, does the camera follow who speaks, do the seams between chapters
   feel like one film, captions readable and in the right colours, no blank or blocked frames
   (`python3 scripts/review/blank_frames.py`), continuity (props, wardrobe, persistent things), pacing per chapter.
   review-4 also: the whole soundtrack (-14 LUFS, true peak, music bed, no gaps at seams), the YouTube chapter list, the
   end screen, total length, title/description/thumbnail drafts.
3. Write `production/review/review-N.md`: a numbered list of challenges, each with the timestamp (mm:ss), chapter, what's
   wrong and why it matters, the concrete fix, and severity (must / should / could). Musts are anything a viewer would
   notice or that weakens the story. Push it, set STATUS: DONE.
4. After the fixes land (the orchestrator will message you), re-watch the changed timestamps and confirm or re-challenge.
