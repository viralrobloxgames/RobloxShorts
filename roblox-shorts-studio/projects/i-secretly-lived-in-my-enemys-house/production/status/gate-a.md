STATUS: WORKING
gate-a: ch01-ch03, seams 1|2, 2|3, 3|4.
- ch01: GATE: FIX (7 musts, 3 shoulds) in production/gate/ch01.md
- ch02: GATE: FIX (7 musts, 3 shoulds) in production/gate/ch02.md
- ch03: GATE: FIX (2 musts, 4 shoulds) in production/gate/ch03.md
- Seams 1|2, 2|3, 3|4 are OK (wardrobe/backpack consistent; each depends on the listed last/first-frame musts).
Next: re-check each chapter's fixes when it re-submits READY_FOR_GATE.
Note for previews: render.mjs frames are 1-based (frame 1 = t 0); frame 0 calls the clip at t<0 and some clips throw.
