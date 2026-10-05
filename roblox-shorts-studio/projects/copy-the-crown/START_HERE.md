# Copy the Crown: resume notes

Standalone story (one part). In this game, every player copies whoever wears the crown, and whoever has it when the
timer ends wins a million coins. Leo grabs it off the Noob and walks Max off the edge into the lava, walks backwards so
Max can never catch him, and makes the whole server spin and dance. Mia flatters him into a bow, so she bows too, their
heads bonk and the crown is hers. With three seconds left she takes one step back, and so do Leo and Max, who have been
walking backwards all game: splash, splash.

## State
- 2026-10-05: script v1 (`script.txt`, 150 words) **approved** ("approved, make the video").
- Narration: George voice C (1.7B, cloud, `scripts/qwen_cloud_george_c.py --take take-01`), tightened, joined with
  `narrate.py --beat 0.5` = **59.4 s speech**; the transcript matches the script word for word. Video 61.5 s + 0.5 s
  cover = **62.0 s** (61-65 s rule).
- Web route: `web/crown_clip.js`, set in `web/kit.js` (round studded arena r = 13 over a lava sea, spawn pad on the +Z
  rim, coin board over the lava past +X, rule board past -Z). Beats: `source/beats.py` -> `web/beats.js`.
- **The copy rule is simulated:** `COPY` lists the crown holder's moves (arm, step, jump, 3 steps, 9.75 studs backwards,
  2 spins, dance, proud, bow, 1 step back, wave) and every other living player makes the same move along their own
  facing. Start spots (`START`) are solved so the same moves put only Max off the +X rim (beat 2) and only Leo and Max off
  the -Z / +Z rims at the end; `OFF_CHECK` in the clip verifies it (node web/clip_query.mjs ... OFF_CHECK).
- Fit check: Noob, Leo, Mia + crown_admin, all PASS, sheet reviewed. No held props (no hold check needed).
- Sound: `source/sfx_assets.py` -> `source/sound_cues.py` -> `source/sound_cues.json`.
- Cover: `web/cover_clip.js` -> `delivery/Copy_the_Crown_cover.jpg|png` (3:4 crop checked). Post copy: `delivery/post.json`.
- Full render done 2026-10-05 (`renders/web`, 1845 frames, git-ignored). Review fix: the Leo-spin close-up (`spin1`)
  camera followed his heading, so the world spun round him and the Noob's body crossed the lens (blank-frame scan flagged
  frame 809); now a fixed angle, frames 758-828 re-rendered.
- **Delivered for review:** `delivery/Copy_the_Crown.mp4` (62.0 s incl. the 0.5 s cover, 1860 frames, fully decoded,
  -16.9 LUFS), blank-frame scan clean, contact sheet reviewed; post sheet `delivery/Copy_the_Crown_post.md`.

## Next
1. User review. Post only after approval of this MP4 (TikTok, then YouTube).

## Commands
```
python3 source/beats.py && python3 source/sfx_assets.py && python3 source/sound_cues.py      # from the project dir
node web/render.mjs --clip projects/copy-the-crown/web/crown_clip.js --out projects/copy-the-crown/renders/web --workers 4 --resume
node web/render.mjs --clip projects/copy-the-crown/web/cover_clip.js --out <dir> --frames 1   # cover
python3 scripts/finish.py projects/copy-the-crown --encode --frames projects/copy-the-crown/renders/web
```
