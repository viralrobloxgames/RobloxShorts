STATUS: DONE

Kit + pipeline on main (see web/kit/README.md). Staying on per the orchestrator:
- Answering requests in production/requests.md (watcher every 90 s). Done so far: practicals, beam fromProp, chinLight,
  clearShot, endScreen space, night presets moonlight, attic_afternoon (attic's own lights), sunday_morning toned down.
- YouTube package: the `package` role owns it (delivery/*_post.md, post.json, thumbnail pick A). My alternative
  thumbnail is delivery/thumbnail_variants/D_lived_in_his_house_kitpipeline.jpg (web/thumbnail_kitpipeline.js).
- QA of chapter drafts done: contact sheets every 4 s at 0.25 scale for all 11; concrete fixes per chapter in
  requests.md (faces in the caption band: ch01/02/04/07; heads cut: ch07/09; faces too dark/blown: ch05/06/08/10).
- Fit gate fixed: kit chapters are now fit-checked, one report per clip (web/fit_check/chNN/).
- Measured: 3.0 s/rendered frame at 1080p (2 workers, 4 cores); frame skip 33% on the proof; seams frame-exact.
- Next: final stitch when chapters are rendered.

Final (orchestrator stitch bf9f3a7, using stitch_longform.py): 21304/21304 frames, stream copy, 21/21 seams frame-exact, A/V 0.011 s, -14.1 LUFS / -1.2 dBTP, 242 MB in 3 parts.
