# He Sold The Eiffel Tower: resume notes

Standalone true story (one part), started in the overnight run (user, 2026-10-05 23:45 UK: keep making new story
videos until 06:00 UK; no script approval needed tonight; never post without approval). Paris, 1925: the papers say
the Eiffel Tower is rusting and costly to fix, so con man Victor Lustig fakes government letters, invites scrap dealers
to a fancy hotel and whispers that the tower is secretly for sale. Andre Poisson pays, plus a bribe; Lustig takes the
train out of the country, and Poisson is too embarrassed to tell anyone, so Lustig comes back and tries again. This
time a dealer calls the police; he flees to America, tricks Al Capone, is caught making fake money, escapes down a
rope and is caught again. His death certificate: apprentice salesman and counterfeiter. Facts, beats and sources:
`source/story.md` (the script says "tries it again", not "sold it twice").

## State
- Script v1 (157 words) written (no approval needed tonight). Ledger: script_approved.
- Narration: George voice C, take-01 (`scripts/qwen_cloud_george_c.py`, `tighten_clips.py`, `narrate.py --voice
  george_c`): 61.5 s of speech (words end 61.52 s). Video = speech + 2.0 s end card = 63.5 s (1906 frames), + 0.5 s
  cover = **64.0 s**. Captions: "Poison" fixed to "Poisson" in `audio/alignment/captions.json` / `.srt` (and a
  POISON -> POISSON word fix in `source/project.json`).
- Web route: `web/eiffel_clip.js` (19 shots) on the real word timings (`source/beats.py` -> `web/beats.js`),
  `web/kit.js` (procedural Eiffel Tower with a rust tint, Paris avenue, hotel suite, office / counterfeit room /
  certificate desk, station and steam train, dock and steamship, gangster's office, prison wall at night with the
  sheet rope). Every shot previewed on the real timings and reframed where needed. Seated dealers use SIT_Y 0.7
  (hips 2 above the root), legs under the table; walk 12 / run 16 studs/s.
- Fit check (top_hat on Max, officer_cap on Noob) passed and reviewed. Hold check (`web/hold_check.js`: bill of sale,
  newspaper, stamp, bribe bag, cash bag, phone earpiece, briefcase, reward) looked at.
- Sound: `source/make_sfx.py` (copies plus synthesized train whistle and police whistle), `source/sound_cues.py` (81
  cues). Cover: `delivery/He_Sold_The_Eiffel_Tower_cover.png/.jpg` + 3:4 grid crop (HE SOLD THE / EIFFEL TOWER /
  TRUE STORY · 1925 over the tower, Max and Leo shaking on the bill of sale). Post copy: `delivery/post.json`.
- Full render handed to a separate cloud session (session_01QjVpJDa6PsFp3oEozzRadh, branch claude/eiffel-render)
  so it runs alongside The Postman's Palace render; it encodes, checks and pushes the MP4 to main. If that session
  didn't finish, run the full render and finish commands below. Post only after the user approves the MP4.

## Commands
```
python3 source/beats.py                                                                    # from the project dir
node web/fit_check.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js         # then --reviewed
node web/render.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js --out /tmp/prev --every 30 --scale 0.4 --skip-fit-check
node web/render.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js --out projects/he-sold-the-eiffel-tower/renders/web --workers 4 --resume
python3 scripts/finish.py projects/he-sold-the-eiffel-tower --encode --frames projects/he-sold-the-eiffel-tower/renders/web
```
