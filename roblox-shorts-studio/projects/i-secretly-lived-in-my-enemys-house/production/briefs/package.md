# Package brief: YouTube thumbnail, title, description, post hand-off (never post)

Role `package`, status file `production/status/package.md`. Read `production/WORKERS.md`, `source/story.md`, `script.txt`,
SKILL.md's hand-off rules and `references/publishing.md` (the Shorts cover spec and TikTok don't apply: this is a 16:9
long-form for YouTube only). The video is still being rendered by other sessions; you work in parallel.

1. **Thumbnail** 1280x720 (YouTube long-form), JPG under 2 MB + PNG: a kit-built still, not a video frame. Make
   `web/thumbnail.js` with the kit (`web/kit/`, see `web/kit/README.md`; sets, cast, props are on main), with its own META
   1280x720, and render it with `node web/render.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/thumbnail.js
   --out <dir> --frames 1-3 --skip-fit-check` (one frame per variant). Make 3 variants of the core image: Skye (pink hair,
   hoodie) hiding in Max's closet / behind his door, wide-eyed, while Max in pyjamas with a flashlight looks the other
   way; big readable text (2-4 words, e.g. "HE NEVER KNEW" / "7 DAYS HIDING"), faces large and expressive, high contrast,
   readable at phone size (check a 320x180 downscale). No "Part" anything, no fake UI, no real brands.
   Save `delivery/I_Secretly_Lived_In_My_Enemys_House_thumbnail.jpg` (+ `.png`, the pick) and `delivery/thumbnail_variants/`.
2. **Title**: "I Secretly Lived In My Enemy's House For A Week" (keep it unless you have a clearly better one; put
   alternatives in the post file).
3. **Description**: a 2-3 line hook in Skye's voice, the chapter list (YouTube chapters `0:00 The Dare` ...; draft from the
   script's chapter headers with estimated starts now; `scripts/stitch_longform.py` later writes the measured list to
   `delivery/youtube_chapters.txt` and you or the orchestrator swap it in), a short call to subscribe, 3-5 hashtags,
   and tags. Fiction: no "true story" claims.
4. **Post hand-off**: `delivery/post.json` + `delivery/I_Secretly_Lived_In_My_Enemys_House_post.md` (copy boxes: YouTube
   title, description, tags, settings: not made for kids unless the content rules say otherwise, category, chapters on);
   use `scripts/post_md.py` if it handles a YouTube-only long-form, else write the .md by hand in the same format.
   **Never post anything** and never run the publish scripts.
5. Push, set STATUS: DONE, and stay available: after the stitch you may be asked to update the chapter list.
