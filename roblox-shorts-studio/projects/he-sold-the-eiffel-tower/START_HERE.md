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
- Narration: George voice C started (`scripts/qwen_cloud_george_c.py --take take-01`); paused while The Postman's
  Palace renders (it shares the CPU). Then `tighten_clips.py` + `narrate.py --voice george_c`, then
  `python3 source/beats.py` (anchors in it) to put the clip on the real word timings.
- Web route: `web/kit.js` (procedural Eiffel Tower: four lattice legs merging at the second platform, a shaft to the
  top, arches, platforms, a rust tint for the "rusting" beat; Paris avenue with clipped trees, lamp posts, Paris
  blocks; hotel suite with chandelier and long table; office with typewriter and stamp (also the counterfeit room and
  the certificate desk); station with the steam train; dock with the steamship; gangster's office; the prison wall at
  night with the knotted-sheet rope) and `web/eiffel_clip.js` (19 shots, written on the estimated timings; not yet
  previewed). Cast: Max = Lustig (top_hat, dark suit shell), Leo = Poisson (brown suit), Mia and Skye = dealers (Mia
  calls the police), Noob = dealer / Capone (pinstripes) / policeman (officer_cap, uniform).
- To do: narration -> beats, preview every shot (fix framing, sitting height SIT_Y, holds), hold check, fit check
  (top_hat on Max, officer_cap on Noob), sound (`source/make_sfx.py`, `source/sound_cues.py`), cover, post copy,
  full render, encode, review. Post only after the user approves the MP4.

## Commands
```
python3 source/beats.py                                                                    # from the project dir
node web/fit_check.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js         # then --reviewed
node web/render.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js --out /tmp/prev --every 30 --scale 0.4 --skip-fit-check
node web/render.mjs --clip projects/he-sold-the-eiffel-tower/web/eiffel_clip.js --out projects/he-sold-the-eiffel-tower/renders/web --workers 4 --resume
python3 scripts/finish.py projects/he-sold-the-eiffel-tower --encode --frames projects/he-sold-the-eiffel-tower/renders/web
```
