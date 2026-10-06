# The Dog Who Saved A Town (standalone true story)

Overnight run 2026-10-06 (user: keep making story videos until 6am, no script approval needed; never post). In 1925
diphtheria broke out in Nome, Alaska; ships couldn't get through the ice and planes couldn't fly in the cold, so twenty
sled-dog teams relayed the antitoxin nearly 700 miles. Leonhard Seppala's team, led by twelve-year-old Togo, ran the
hardest leg: 170 miles out to meet it, then back across the frozen Norton Sound in a blizzard (that night the ice blew
out to sea), 261 miles in all. The outbreak was stopped, but the Central Park statue went to Balto, who led the last
53 miles; Togo got his own statue 76 years later. Facts, beats, cast and sources: `source/story.md`.

## State
- 2026-10-06 ~04:15 BST: script v1 (169 words with the CTA, 18 lines) in `script.txt` (used as written: no approval
  needed tonight). Post copy: `delivery/post.json`. Ledger entry added (script_approved).
- Narration (George voice C, local Qwen): 18 clips, tightened 49.6 -> 49.0 s, joined at gap 0.5 / beat 1.05: speech
  ends 60.08 s; video 62.1 s (1863 frames) + 0.5 s cover = **62.6 s**. `source/beats.py` maps the transcriber's digits
  (700, 20, 12, 170, 261, 53, 76) back to the script words; only "two" (of "two hundred and sixty-one") is
  interpolated. Sound cues regenerated on the real beats (`source/sound_cues.json`, 68 cues; sfx in `audio/sfx/`).
- Web route drafted (first built on the estimated beats; now on the narration): `web/kit.js` (snowy Nome
  at night with the doctor's house, the sick room, the frozen harbour with the ship in the ice and a frosted biplane,
  the trail through the spruce, the frozen sea with floes that drift out at night and the roadhouse, the New York park
  with the BALTO 1925 and TOGO 2001 plinths, the sled, the SERUM crate) and `web/dog_clip.js` (17 shots: hook, sick,
  ships, planes, dogs, relay, hardest, togo, run, back, ice, night, miles, arrive, statue, wait, cta; seven huskies from
  `animal_collie_parts` recoloured, Balto black, two bronze statues). One low-res frame per shot rendered and looked
  at; the sick room, harbour and run cameras re-framed.

## Preview notes (every 20th frame on the real narration, 05:50 BST)
- Fixed and checked on one frame each (05:52): sick (Skye's face now reads under the card), togo (head in frame,
  muzzle still near the left edge), night (more of the open sea), miles (Max's face below the chart), statue (wider:
  the plinth, Mia waving and Balto), wait/cta (Togo next to his statue); the blizzard haze lightened (not re-checked).
- Hold check (`web/hold_check.js`, 05:54, looked at): passes. The SERUM crate is held up just past Leo's left fist;
  the empty medicine bottle just past his raised right fist. Fit check: not run yet (no accessories, expect 0 pairs).
- Still to look at: the whole clip again every 10th frame; the togo close-up could sit a touch further forward.
- hook, ships, planes, dogs, relay, hardest, run, back, arrive read fine.

## Next
1. Preview every 10th frame on the real narration (`node web/render.mjs --clip projects/the-dog-who-saved-a-town/web/dog_clip.js --out /tmp/p --every 10 --scale 0.3 --samples 1 --workers 4 --skip-fit-check`),
   fix framing and timing; hold check (`web/hold_check.js`: the bottle and the crate); fit check (no accessories:
   `node web/fit_check.mjs --clip ...` then `--reviewed`); cover (`web/cover_clip.js` drafted, looked at once at low
   res: the team running at the camera, THE DOG WHO / SAVED A TOWN / ...AND GOT NO STATUE) at full res into
   `delivery/The_Dog_Who_Saved_A_Town_cover.png|jpg` + `_cover_grid.jpg`; full render; encode
   (`python3 scripts/finish.py projects/the-dog-who-saved-a-town --encode --frames projects/the-dog-who-saved-a-town/renders/web`);
   blank-frame check; review. Never post without the user's approval.
