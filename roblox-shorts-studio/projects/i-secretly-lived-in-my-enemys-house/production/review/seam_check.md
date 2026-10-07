# Seam check: frames that render differently after a cold start

`web/seam_check.mjs`, run on all 22 final segments as they were rendered: `--workers 4`, each segment at its render sha (from `status/final-chNN-x.md`; ch08 B at bfdc9f04 per recheck-ch08; ch09 B at ch09 A's sha; ch02 at 2d6fc591, the last render sha, although ch02 has been reopened). A render worker starts cold at the segment start and at each chunk start (contiguous chunks of ceil(n/4)). For each cold start, every frame of its chunk is fingerprinted twice: on a fresh page (cold, as rendered) and on a page posed from frame 1 in order (the state of one sequential render). Listed frames differ from the sequential render.

**Cause** (ch08 B f1265, measured): kit-cast `posture(..., { reset: true })` resets bone rotations but not bone positions, so a position offset from an earlier pose (gait / sit / hug code) persists, and a page that starts cold does not have it. Lily's arm and leg pivots and her hugged teddy (on the Torso) end up elsewhere. It does not converge. **Fix:** posture's reset should restore every bone's rest position (kit-cast, cast.js), making every pose history-free. Meanwhile `render.mjs` (b698dc7e) pre-rolls from frame 1 before each worker's first frame, so new renders match a sequential render.

**What to re-render:** the frames listed per affected segment, after the kit-cast fix or with the new render.mjs (pre-roll), e.g. `--frames a-b,c-d --workers 4`, then re-encode the segment. Clean segments need nothing.

| Segment | sha | range | cold starts | differing frames (by cold start) |
|---|---|---|---|---|
| ch01_a | 1a727048 | 1-860 | 4 | **start 431: 431-645 (215 f); start 646: 646-759 (114 f)** |
| ch01_b | 5fc54214 | 861-1911 | 4 | clean |
| ch02_a | 2d6fc591 | 1-903 | 4 | **start 453: 453-678 (226 f); start 679: 679-903 (225 f)** |
| ch02_b | 2d6fc591 | 904-2006 | 4 | **start 904: 904-1179 (276 f); start 1180: 1180-1303 (124 f); start 1456: 1456-1731 (276 f); start 1732: 1732-2006 (275 f)** |
| ch03_a | 726592de | 1-906 | 4 | **start 228: 228-325 445-454 (108 f); start 455: 455-658 (204 f); start 682: 749-906 (158 f)** |
| ch03_b | 726592de | 907-2013 | 4 | **start 907: 907-944 981-1183 (241 f); start 1184: 1184-1460 (277 f); start 1461: 1461-1576 1609-1737 (245 f); start 1738: 1738-2013 (276 f)** |
| ch04_a | 80a98e8b | 1-825 | 4 | **start 208: 208-414 (207 f); start 415: 415-621 (207 f); start 622: 622-825 (204 f)** |
| ch04_b | 80a98e8b | 826-1833 | 4 | **start 826: 826-1077 (252 f); start 1078: 1078-1329 (252 f); start 1330: 1330-1581 (252 f); start 1582: 1582-1663 (82 f)** |
| ch05_a | 3830bc67 | 1-909 | 4 | clean |
| ch05_b | 3830bc67 | 910-2019 | 4 | **start 910: 910-1187 (278 f); start 1188: 1188-1465 (278 f); start 1466: 1466-1743 (278 f); start 1744: 1744-2019 (276 f)** |
| ch06_a | 8537ebc6 | 1-780 | 4 | clean |
| ch06_b | 8537ebc6 | 781-1733 | 4 | clean |
| ch07_a | de6e40d9 | 1-992 | 4 | clean |
| ch07_b | de6e40d9 | 993-2204 | 4 | **start 1599: 1599-1689 (91 f); start 1902: 1902-1940 (39 f)** |
| ch08_a | bfdc9f04 | 1-784 | 4 | clean |
| ch08_b | bfdc9f04 | 785-1742 | 4 | **start 785: 785-1024 (240 f); start 1025: 1025-1264 (240 f); start 1265: 1265-1504 (240 f); start 1505: 1505-1742 (238 f)** |
| ch09_a | 91b328d1 | 1-806 | 4 | clean |
| ch09_b | 91b328d1 | 807-1792 | 4 | clean |
| ch10_a | 1a5199f3 | 1-880 | 4 | clean |
| ch10_b | 1a5199f3 | 881-1956 | 4 | clean |
| ch11_a | 50e434a3 | 1-943 | 4 | clean |
| ch11_b | 50e434a3 | 944-2095 | 4 | **start 1232: 1232-1519 (288 f); start 1520: 1520-1807 (288 f); start 1808: 1808-2095 (288 f)** |

11 of 22 segments have frames that differ. Per-segment JSON: `seam_check/chNN_x.json`. Re-check after a fix: `node web/seam_check.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js --range a-b --workers 4`.
