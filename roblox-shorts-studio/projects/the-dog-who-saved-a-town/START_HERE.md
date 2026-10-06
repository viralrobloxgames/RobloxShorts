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
- Not built yet. Narration waits for the CPU (She Raced Around The World is rendering).

## Next
1. `python3 scripts/qwen_cloud_george_c.py projects/the-dog-who-saved-a-town --take take-01`, then
   `python3 scripts/tighten_clips.py projects/the-dog-who-saved-a-town --voice george_c --take take-01`, then
   `QWEN_TTS_DIR=<empty dir> python3 scripts/narrate.py projects/the-dog-who-saved-a-town --voice george_c --take take-01 --beat 0.9 --gap 0.4`
   (adjust the join so speech end + 2.5 s is 61-65 s), `source/beats.py` (word anchors; map the transcriber's digits
   back to the script words as in She Raced Around The World), set `seconds` in `source/project.json`.
2. Web route: `web/kit.js` (snowy Nome at night, the doctor's room with a kid in bed, a ship frozen in the ice, a
   frosted biplane, the trail and the frozen sea with a whiteout, a roadhouse, the Central Park statue, Seward Park),
   huskies from `animal_collie_parts` recoloured (Togo grey with a grey muzzle; Balto black), a sled and harness line,
   a medicine box; `web/dog_clip.js` per the beats in `source/story.md`; preview every 10th frame, hold check, fit
   check, sound cues, cover, full render, encode, blank-frame check, review. Never post without the user's approval.
