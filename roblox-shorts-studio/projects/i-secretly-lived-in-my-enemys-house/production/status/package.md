STATUS: DONE

role: package (YouTube thumbnail, title, description, post hand-off). Nothing posted; no publish script run.

Done (on main):
- Thumbnail: `web/thumbnail.js` (kit-built still, META 1280x720, frames 1-3 = variants A/B/C; Max's bedroom at night:
  Skye 'shocked' peeking out from behind the louvred closet door, Max in pyjamas looking the other way with his
  flashlight beam going off frame right). Rendered at 12 samples:
  `node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/thumbnail.js --out <dir> --frames 1-3 --skip-fit-check`
  - pick = A "HE NEVER KNEW": `delivery/I_Secretly_Lived_In_My_Enemys_House_thumbnail.jpg` (128 KB) + `.png`
  - `delivery/thumbnail_variants/`: A_he_never_knew, B_7_days_hiding (closer on Skye), C_he_never_knew_circle (red circle on Skye)
  - phone-size check (320x180, all three readable): `production/previews/package/thumbnail_320x180_check.jpg`
- `delivery/post.json` (youtube only: title, description with chapters, tags, Gaming, public, made_for_kids false,
  contains_synthetic_media false; title alternatives) and `delivery/I_Secretly_Lived_In_My_Enemys_House_post.md`
  (written by hand: scripts/post_md.py needs the MP4 and is Shorts/TikTok-shaped).
- Chapters: DRAFT in `delivery/youtube_chapters_draft.txt` and in the description (measured narration for ch01-05,
  07-09, 11 plus 0.75 s each; estimates for ch06 (64 s) and ch10 (70.7 s)). Total ~12:07 with the end screen.

Next: after `scripts/stitch_longform.py` writes `delivery/youtube_chapters.txt`, swap it into post.json's description
and regenerate the post .md (I'm available for this; or the orchestrator can do it).

Note: kit-pipeline also pushed `web/thumbnail.js`, `delivery/thumbnail.jpg` and `delivery/youtube.md` (commit 9a81f20)
in parallel. I kept package's thumbnail.js (per the package brief) and saved theirs as `web/thumbnail_kitpipeline.js`.
Their thumbnail.jpg / youtube.md are left untouched; the hand-off files are the ones above (see requests.md).
