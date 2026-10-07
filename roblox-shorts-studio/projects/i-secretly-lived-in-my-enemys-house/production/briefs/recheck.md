# Re-check + final pass brief (fresh sessions `recheck-chNN`, one per chapter)

The user rejected the film for clipping (bodies through desks, banisters, islands and each other), bad sitting, a
"hidden" Skye in plain view, floating props, robotic poses (arms straight out, T-poses), faces flickering and characters
changing identity under coloured light. Frame critics listed every case; the chapter sessions have fixed them on a frozen
kit. You verify **independently** (you made none of this). The bar: nothing a viewer could notice.

**Usage:** ~40 sessions share one 5-hour usage limit, and every turn re-reads your whole context. Keep your context
small: no polling in the conversation (wait with background commands and end your turn), look only at the images you
need, don't read big files you don't need. Never post or publish anything.

Paths (from `roblox-shorts-studio/`): `P=projects/i-secretly-lived-in-my-enemys-house`, clip `$P/web/chNN.js`, the
chapter status `$P/production/status/chNN.md` (STATUS, COMMIT, FRAMES, SPLIT), yours `$P/production/status/recheck-chNN.md`
(first line `STATUS: WAITING|CHECKING|DONE`, then `RECHECK: OK @ <sha>` or `RECHECK: MUSTS @ <sha>`, later `FINAL: PASS`
or `FINAL: MUSTS`), your report `$P/production/review/recheck-chNN.md`.

**Must lists per chapter** (in `$P/production/review/`): ch01 critic-1.md (ch01) + critic-6 I1, I7, R1 + the user's list
in `briefs/frame_critic.md`; ch02 critic-7.md + the user's list; ch03 critic-2.md (ch03) + critic-6 I2, I8, I15; ch04
critic-2.md (ch04) + critic-6 I19, R1; ch05 critic-3.md (ch05) + critic-6 I12, I14, R2; ch06 critic-3.md (ch06) + critic-6
I3, I10, I13, I15, I16; ch07 critic-4.md (ch07) + critic-6 R2, R3; ch08 critic-4.md (ch08) + critic-6 I5, I9, R4; ch09
critic-5.md (ch09) + critic-6 R3; ch10 critic-5.md (ch10) + critic-6 I4; ch11 critic-6.md (ch11 + its re-check R-a, R-b).

1. **Wait** until the chapter status says `READY_FOR_RECHECK` with a COMMIT you have not checked yet, as a background
   command, then end your turn (you are re-invoked when it exits):
   `until git fetch -q origin main && git show origin/main:$P/production/status/chNN.md | head -1 | grep -q READY_FOR_RECHECK; do sleep 120; done`
2. **Check at that COMMIT** (`git checkout <sha>` or a worktree):
   - Automated: `node web/clip_check.mjs --clip $P/web/chNN.js --sight skye:max,dad,lily --out /tmp/cc.json` and
     `node web/cam_check.mjs --clip $P/web/chNN.js`. Every remaining high clipping hit is explained (resting contact, a
     hug) or a must; no frame where someone can see Skye on a beat where she is hiding; no camera glide or camera inside
     geometry at a cut.
   - Visual: previews with `node web/render.mjs --clip ... --out <scratch> --scale 0.5 --frames a-b` (every must's range
     at 5-10 fps, i.e. every 3rd-6th frame) plus the whole chapter with `--every 15`; view them as 2x2 sheets
     (ffmpeg `tile=2x2`, 960 px wide). For each must: fixed or not. Then anything new, with the checklist in
     `briefs/frame_critic.md` (clipping, sitting, walking, secrets, props in palms, poses, identity, camera, captions).
   - **Viewer test (the user's own bar, after he still found problems the checks passed):** watch each shot as a viewer
     would. Does every pose read as what it should be at a glance (sitting up in bed must look like sitting up in bed,
     with the pillow/headboard and legs under the duvet readable, never like standing inside the bed)? Is every hiding
     place one a real person would choose, where the others plausibly would not look (not crouched behind a counter in
     the open, in front of the stairs the family comes down)? Would anything make a viewer think "they'd see her" or
     "that looks wrong"? If yes, it is a must even when clip_check and the sight check pass.
3. **Verdict**: append `## Re-check @ <sha>` to your report (one row per must: fixed / not fixed, plus new issues as
   `frames a-b, what, fix, must|should`), push to main. Then:
   - OK (no musts left): status `RECHECK: OK @ <sha>`; message the chapter session (roster in `production/ORCHESTRATION.md`):
     "OK at <sha>; please make no further changes to the clip". The final render sessions start from this line.
   - Not OK: status `RECHECK: MUSTS @ <sha>`; message the chapter session the list; go back to 1.
4. **Final pass** once `$P/production/status/final-chNN-a.md` and `final-chNN-b.md` both say `STATUS: DONE` (wait in the
   background the same way): `git pull`, then `delivery/chapters/chNN_a.mp4` + `chNN_b.mp4`: the whole chapter at 2 fps in
   2x2 sheets, full-res stills of every must range, and the seam (SPLIT-3..SPLIT+3, no pop). Append `## Final pass`;
   status `FINAL: PASS` or `FINAL: MUSTS` (+ list), `STATUS: DONE`, push. Message the orchestrator
   (session_01VoEKPTD5XbzGG7bGwCXC91) only on MUSTS or if blocked.
