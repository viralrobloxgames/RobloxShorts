# Detective Max Sniffwell: The Vampire Case: resume notes

Standalone case of the Super Nose Detective series (Case 1: `projects/the-super-nose-detective`). Web route,
`detective_noir` narration (designed voice, see references/voice-and-audio.md). Story, beats and what was taken from the
original: `source/story.md`. Script: `script.txt`. Research: `source/research/` (incl. the user's key-frame uploads).

## Done
- Script v5 approved 2026-10-05 with one change ("His sister asked me to stay for dinner"; "then make the video").
  History: v1 The Big Cheese rejected (not standalone); v2 too long, hook made no sense; v3 random elements; v4 the Chief
  again; v5 the gardener.
- Narration take-01 (`scripts/qwen_cloud_clone.py --voice detective_noir`, tightened): 62.0 s of speech, transcript
  matches the script. `source/fix_captions.py` (text only: "20" -> "Twenty", "home grown" -> "homegrown", drops anything
  heard after "more cases"); run it after any re-transcribe, before `beats.py`.
- Outfits: `source/make_outfits.py` -> `web/outfits/` (Vlad on Leo's rig: tailcoat, red waistcoat, pale; his sister on
  Mia's rig: black dress, pale; the gardener on the Noob: green overalls and gloves). Max and the Chief wear Case 1's.
- Sets and props in code: `web/kit.js` (mansion, coffin, candelabras, garlic bread with butter / clove / soil crumb, garden:
  roses, garlic patch, sad tomatoes, straw hat, clippers, cape, fangs, KO stars, bats, burger, pool ring). Case 1's nose,
  sunglasses and handcuffs come from its kit. Title-card fonts: `assets/fonts/AlfaSlabOne-Regular.woff2` and
  `PlayfairDisplay-Bold.woff2` (OFL), registered in `web/runner.html`.
- Scene `web/vampire_clip.js` (28 shots, all word-anchored from `web/beats.js`). The sun comes from behind the house
  (+X/-Z, low) so the mansion's shadow lies across the garden on its -X side. Lock-up title card lower left at ~5.2-8 s
  (`lockup()`, also used by the cover).
- Sound: `source/sound_cues.py` -> `source/sound_cues.json` (library + horror SFX, Case 1's sniff). Music: Case 1's funk bed.
- Cover: `web/cover_clip.js` -> `delivery/The_Vampire_Case_cover.png/.jpg` (both vampires grinning with fangs, Max's nose
  bottom right, the lock-up; 3:4 crop checked). `delivery/post.json` written.
- Fit check: 0 pairs (no pack accessories), reviewed.

## Next
- First cut delivered 2026-10-05. User review: blank frames, hook didn't show the faces, the "nicest vampire" puppy scene
  was random, Max didn't face the Chief for the burger, the gardener didn't hold his tool. Fixed in `web/vampire_clip.js`:
  - blank frames (found with `scripts/review/blank_frames.py`): the sniff camera swept through the set while Max turned
    (now fixed to his end pose), the "homegrown" camera sat inside the coffin (now front-left 3/4), the Chief's jacket
    filled the first sniff frames (he's gone by then), and the run-out showed an empty table (camera at the exit now).
  - hook: the sister one step out of the doorway, both cheated 3/4 to a side camera with a quick push-in.
  - flashback: one shot; a crying kid by a LOST DOG poster (`lostPoster`), Vlad hands her the puppy, she lights up.
  - Max turns to face the Chief (the old lerp turned him away).
  - held props at the palm grip (`gripR/gripL`); two-handed shears posed from both hands every frame (`shears`/`setShears`,
    snipping), dropped to the grass at the cuffs. Every hold checked in close-up: `web/hold_check.js`.
- Re-rendered and delivered 2026-10-05 (second cut): 62.8 s incl. the cover tail, no blank frames
  (`scripts/review/blank_frames.py`), captions x 134-884, -16.9 LUFS. The blank-frame scan caught one more after the
  re-render: the sniff camera sat where the sister stands (her dress crossed the lens when she turned away); moved in
  close on Max's left and re-rendered just those 82 frames with `web/changed_frames.mjs` (6 min).
  `renders/web/frame_hashes.json` holds the fingerprints: further fixes re-render only what they change.
  **Waiting on the user's approval to post** (TikTok, then YouTube).

## Re-render / re-encode
```
cd roblox-shorts-studio
python3 projects/super-nose-case-2/source/fix_captions.py && python3 projects/super-nose-case-2/source/beats.py && python3 projects/super-nose-case-2/source/lipsync.py && python3 projects/super-nose-case-2/source/sound_cues.py
python3 projects/super-nose-case-2/source/make_outfits.py
node web/fit_check.mjs --clip projects/super-nose-case-2/web/vampire_clip.js && node web/fit_check.mjs --clip projects/super-nose-case-2/web/vampire_clip.js --reviewed
node web/render.mjs --clip projects/super-nose-case-2/web/vampire_clip.js --out projects/super-nose-case-2/renders/web --workers 3 --resume
node web/render.mjs --clip projects/super-nose-case-2/web/cover_clip.js --out /tmp/cover --frames 1 --workers 1 --skip-fit-check
python3 scripts/finish.py projects/super-nose-case-2 --encode --frames projects/super-nose-case-2/renders/web
python3 scripts/post_md.py projects/super-nose-case-2
```

## Budget
- Web route: no farm cost. Narration local (free).
