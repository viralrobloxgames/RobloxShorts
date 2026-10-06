STATUS: WORKING
gate-a: ch01-ch03, seams 1|2, 2|3, 3|4.
- ch01: GATE: PASS (round 2, commit 0645a2e)
- ch02: GATE: FIX round 2 (commit b627925): only #11 open (Lily's head in the caption band in Dad's MS)
- ch03: GATE: PASS (round 2, commit 180443c)
- Seams 1|2, 2|3, 3|4 are OK (wardrobe/backpack consistent; each depends on the listed last/first-frame musts).
Next: re-check each chapter's fixes when it re-submits READY_FOR_GATE.
Note for previews: render.mjs frames are 1-based (frame 1 = t 0); frame 0 calls the clip at t<0 and some clips throw.
