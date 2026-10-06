# He Flew The Wrong Way: resume notes

Standalone true story (one part) for the overnight run of 2026-10-05 (story named by the user, script approval waived
for the run; posting still needs approval of the finished MP4). Wrong Way Corrigan, 17-18 July 1938: refused permission
to fly the Atlantic, Douglas Corrigan files a flight plan to California, takes off from Floyd Bennett Field at dawn,
keeps flying east into the clouds (no radio, a 20-year-old compass, fuel leaking into the cockpit, a screwdriver
through the floor), lands at Baldonnel near Dublin 28 hours later ("Just got in from New York. Where am I?"), blames his
compass, gets a 600-word telegram of broken rules, a suspension that ends the day his ship gets home, and a ticker-tape
parade bigger than Lindbergh's; he never admitted a thing. Max plays Corrigan, Mia the official (officer_cap), Leo the
Irish officer (officer_cap), Skye/Noob/extras crew and crowd. Facts, beats and sources: `source/story.md`.

## State
- Script v1 (156 words), `script.txt`.
- Narration: George voice C (cloud, `scripts/qwen_cloud_george_c.py --take take-01`; lines 9 and 11 redone with
  `--redo 9,11` after deleting their `clips_raw` copies, because `tighten_clips.py` always rebuilds from `clips_raw`),
  `tighten_clips.py`, `narrate.py --voice george_c` = **59.3 s** (words end 59.12 s). Video = words end + 2.5 s end
  card = 61.63 s, + 0.5 s cover = **62.1 s**. Captions: "Twenty-eight", "twenty-year-old", "600-word" merged in
  `audio/alignment/captions.json` / `.srt`; word_fixes in `source/project.json`.
- Web route: `web/wrongway_clip.js` (21 shots), `web/kit.js` (Curtiss Robin with patches and a hinged door, Floyd
  Bennett Field with a CALIFORNIA signpost, Baldonnel with a tricolour, the Bureau of Air Commerce office, sky with a
  cloud bank over the sea, cockpit with the old compass/empty radio slot/fuel line drip/puddle/hole, telegram strip,
  ocean liner with the crated plane, Broadway with ticker tape and a parade car).
- Overlays: date pill, FLIGHT PLAN: CALIFORNIA, IRELAND?!, CAN I FLY THE ATLANTIC?, DENIED / APPROVED stamps, TOO OLD /
  TOO PATCHED UP, route card CALIFORNIA - NEW YORK - IRELAND + EAST!, NO RADIO, 20-YEAR-OLD COMPASS, FUEL LEAK!, A HOLE
  IN THE FLOOR, WHERE AM I? bubble, spinning compass + "MY COMPASS!", n WORDS counter + RULES BROKEN, NO FLYING stamp +
  DAY n OF 14 + PUNISHMENT OVER!, TICKER-TAPE PARADE, BIGGER THAN LINDBERGH'S, "WRONG WAY" CORRIGAN, DID YOU MEAN TO?,
  HE NEVER ADMITTED IT, CTA card.

## Commands
```
python3 source/beats.py                                                                   # from the project dir
node web/fit_check.mjs --clip projects/he-flew-the-wrong-way/web/wrongway_clip.js            # then --reviewed
node web/render.mjs --clip projects/he-flew-the-wrong-way/web/wrongway_clip.js --out projects/he-flew-the-wrong-way/renders/web --workers 4 --resume
python3 scripts/finish.py projects/he-flew-the-wrong-way --encode --frames projects/he-flew-the-wrong-way/renders/web
python3 scripts/review/blank_frames.py projects/he-flew-the-wrong-way/delivery/He_Flew_The_Wrong_Way.mp4
python3 scripts/post_md.py projects/he-flew-the-wrong-way
```

## Next
1. Previews on the real timings, motion pass, hold check, fit check, full render, sound cues, cover, encode, review,
   post copy. Post only after the user approves the MP4.
