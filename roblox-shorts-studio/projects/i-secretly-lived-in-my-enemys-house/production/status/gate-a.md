STATUS: DONE
gate-a: ch01-ch03, seams 1|2, 2|3, 3|4. All pass.
- ch01: GATE: PASS (round 2, commit 0645a2e)
- ch02: GATE: PASS (round 3, commit 62fb0c4)
- ch03: GATE: PASS (round 2, commit 180443c)
- Seams 1|2, 2|3, 3|4 OK (wardrobe and backpack consistent; first/last frames per the boundary sheet).
Free for a render job.
Note for previews: render.mjs frames are 1-based (frame 1 = t 0); frame 0 calls the clip at t<0 and some clips throw.
