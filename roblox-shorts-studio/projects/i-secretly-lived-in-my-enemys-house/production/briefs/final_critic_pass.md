# Final critic pass (after the full re-render): sign-off before the film goes to the user

The user rejected the previous cut for clipping, bad sitting, secrets in plain view, floating props, robotic poses and
identity changes. This pass decides whether the re-rendered film is good enough to send. Be as harsh as in your first
review: anything a viewer could notice is a must.

1. **Material**: the final segments `delivery/chapters/chNN_a.mp4` + `chNN_b.mp4` from main (commits after KIT FREEZE;
   check `git log -1 -- <file>`), not previews.
2. **Every must from your critic file**: find the moment and confirm it is fixed in the final video (a still per item).
   Then the whole chapter again at **3 fps in 2x2 sheets at 960 px**, 6-10 fps at every move, sit-down, hand-off or
   contact, looking for anything new (the kit changes touched every pose, face, light and camera cut).
3. **The A/B seam** (frames SPLIT-3..SPLIT+3 at full res): no pose, prop, light or camera pop.
4. **Automated**: `node web/clip_check.mjs` on the chapter at the rendered commit: every remaining high is explained
   (resting contact) or a must. If kit-pipeline's line-of-sight check exists, run it on the hiding scenes.
5. **Output**: append `## Final pass (<date>)` to your critic file: `PASS` or the list of musts (same format as before),
   push, and message the chapter session + the orchestrator (session_01VoEKPTD5XbzGG7bGwCXC91). A chapter goes to the
   user only with a PASS. Never post anything.
