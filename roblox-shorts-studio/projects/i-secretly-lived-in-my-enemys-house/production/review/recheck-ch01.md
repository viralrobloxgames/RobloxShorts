# recheck-ch01

## Re-check @ 36ced560
Done independently: clip_check (sight skye:max,dad,lily) gives 1 high (7.6-8.1 s, hair-lock insert, intended) and 42 medium hits. cam_check: 0 glides, 0 inside, 0 at a head. I rendered the whole chapter at every 15th frame and every must range at every 5th-6th frame (0.5x), plus single frames 462-473. Frame numbers are ch01 render frames.

| must | status | note |
|---|---|---|
| c1 #1 hook, Skye in plain view | **not fixed** | f1-307: Skye stands in the *open* left half of the closet; the closed right leaf is beside her, not between her and Max. sight_check: Max sees her torso/head 0.0-10.2 s with nothing solid in between. In the CU (f55-200) Max's face is about 4 studs away, right next to hers, looking into the closet. |
| c1 #2 Max 0.5 m away, facing her | **not fixed** | same frames: about 4 studs, facing the gap she stands in (f119-215 sight hits) |
| c1 #3 backpack through the closed door | partly fixed | nothing crosses the door plane now, but see N1: through the louvres she is in full view |
| c1 #6 chair back through Max | fixed | he stands in the aisle |
| c1 #7 walk through chair/desk | fixed | |
| c1 #8 180° flip | **not fixed** | f462-468 back of Max's head, f469 side, f470 facing camera, all in the same setup (it moved, it didn't go away) |
| c1 #9 walk through desks | fixed | no Max/desk hits; the wide reads clean |
| c1 #10 spider with no hand | fixed | |
| c1 #11 Spider! T-pose | fixed | one arm, the spider on her hand |
| c1 #12 fist in her face | fixed | spider at her shoulder, fist clear of her head |
| c1 #13 floating lunchbox | fixed | on the desk top |
| c1 #14 desk through both | fixed | |
| c1 #17 ghosting through the back door | fixed | door opens inward, she steps through |
| c1 #19 / c6 I1, I7 night identity | fixed | Max peach and brown-haired in bed; Skye's closet face peach, hair pink |
| c1 #20 Lily's line over Max | fixed | Max turns to the wall (off-screen voice) |
| c6 R1 zombie arms | **not fixed** | N4 |
| user list | 0:00 hook **not fixed**; 0:15, 0:25, 0:34, 0:45, 0:57 fixed | |

New issues:
- **N1** frames 300-325 (0:10.0-10.8), staging: Max shuts the doors and turns away, but Skye (pink hair, purple backpack, white hoodie) is plainly readable through the open louvre slats from 1 m (crop of f307/f313). Fix: louvres that read solid (overlapping, angled-down slats, or no light inside the closet so she is at most a dark shape), or put her behind the hoodie rack / the solid stile. **must**
- **N2** frames 1570-1600 (0:52.3-53.3), staging: same louvre problem. She is fully readable through the slats while Max is awake in the room (sight_check: Max sees her torso at 52.3-52.9 s). Same fix. **must**
- **N3** frames 1843-1851 (1:01.4-1:01.7), interpenetration: as the left leaf opens, Skye's arms pass through its slats (clip_check medium: Arm.L/R in the 0.3x0.2x2.6 slat boxes and the closet box). Fix: her hand on the leaf's edge/knob, pushing it, the arm clear of the slats. **must**
- **N4** frames ~1105-1300 (0:36.8-43.3), pose (R1): in Max's classroom CUs his right arm is held straight forward at shoulder height across the frame for about 6 s. Fix: arm down (or a short gesture, returned within 1.5 s). **must**
- N5 frames 211-217, Max's flashlight arm dead straight out (c1 #5). **should**
- N6 frames 235-250, the pink hair-lock insert still reads as a fleshy tentacle against the coloured panels (c1 #4). **should**
- N7 frames 1105-1300, a white out-of-focus blob (Skye's shoulder) at the left edge of Max's CUs (c1 #15). **should**

Verdict: **MUSTS** (c1 #1, #2, #8; N1-N4).

## Re-check @ 65f9fd9e
clip_check: sight hits now only at 7.6-8.1 s (the pink-lock insert: Max sees her torso at 6 studs, read as a white hoodie next to "Just hoodies"; accepted, should) and in the classroom (no hiding). 2 high: 7.6 s pink lock (intended) and 61.5 s Skye's Leg.L in wall_left for one sample (she is behind the closet front, not visible in f1843-1849). cam_check: 0/0/0. I rendered the whole chapter at every 15th frame, plus single frames 462-472, 1120-1290 and 1840-1911.

| must | status | note |
|---|---|---|
| c1 #1/#2 hook sight line | fixed | Skye is in the walk-in corner with the wall between them; sight check clean |
| N1 louvres f300-325 | fixed | |
| N2 louvres f1570-1600 | fixed | she is in the corner, out of view |
| N3 arms through the leaf f1843-1851 | fixed | clip hits now ~0-2% cover; Max is asleep (should only) |
| c1 #8 180° spin | **not fixed** | f462-468 back of the head, f469 side, f470 facing, same setup. Cut at 469, or start the shot on the facing pose. **must** |
| N4 / c6 R1 arm straight forward | **not fixed** | f1120-1290: Max's right arm still straight forward at shoulder height across the frame for about 6 s. Arm down. **must** |
| others from the first re-check | still fixed | |
Shoulds left: flashlight arm straight (f211-260), white blob at the left edge of the Max CUs (f1105-1300).

Verdict: **MUSTS** (c1 #8, N4).

## Re-check @ 5fc54214
Diff from 65f9fd9e: 5 lines of ch01.js (the aisle walk on the wide, Max's arms on his long line). clip_check is the same as at 65f9fd9e (sight hits only on the pink-lock insert, accepted, and in the classroom; the same 2 high, both explained there); no new Max/desk hits. cam_check: 0/0/0. I rendered frames 440-480 and 1100-1320 (and the rest at 65f9fd9e, unchanged).

| must | status | note |
|---|---|---|
| c1 #8 180° spin | fixed | the wide carries the walk up the aisle; the single opens on him already facing (f470+) |
| N4 / c6 R1 arm forward | fixed | f1120-1300 arms down |
| all earlier musts | fixed | |
Shoulds left: flashlight arm straight (f211-260), white blob at the left edge of the Max CUs.

Verdict: **OK**.

## Re-check @ 1a727048
Diff from 5fc54214: only the spider's offset on Skye's hand (ch01.js, 2 lines). clip_check and cam_check are unchanged from 5fc54214 (same 2 explained highs, 0/0/0). I rendered frames 730-840: the spider goes from Max's hand onto her hand and sits on top of it, not sunk in. Every must is still fixed.

Verdict: **OK** (supersedes OK @ 5fc54214).
Also rendered f740-850 every 5th frame at 0.5 scale on the orchestrator's request: the spider drops from Max's hand, then sits on top of Skye's hand through the shriek and Max picks it back up. No clipping; still OK.

## Re-check @ 8e1f87e8 (reopened: Max in bed, 0:51-1:00)
Diff from 1a727048: ch01.js night2 / bed shots only. cam_check 0/0/0. The sight hits are unchanged (pink-lock insert, classroom). clip_check: 5 **new** highs, all Max in the bed (54.2-57.3 s and 61.3 s): legs inside the duvet box (86-100% cover), head and arms inside the pillow/headboard box (57%). I rendered f1520-1850 every 6th frame, f1626-1668 every 3rd, and the chapter at every 15th frame; outside the bed range nothing changed. Viewer test applied.

| must | status | note |
|---|---|---|
| user: Max in bed reads as standing inside the bed | **not fixed** (new problems) | see B1-B3 |
| all earlier musts | still fixed | |

- **B1** frames 1626-1700 (0:54.2-56.7), props/clipping: the "duvet" is a separate red roll lying beside Max's legs. It doesn't cover him and doesn't move with him. His plaid PJ legs lie on top of the bed next to it and poke out through its side (f1626, f1641-1668; clip_check legs 86-100% inside the duvet box). It reads as a red bolster, not a duvet over his legs. Fix: one duvet surface that covers him from the waist down (a shaped top over his legs, or hide the legs and raise the duvet top over them), turned back at the waist when he sits up. **must**
- **B2** frames 1626-1635 (0:54.2-54.5), clipping/pop: as he starts to lift, his head sinks into the pillow (f1629: only a hair tuft shows; the head is gone for a frame between f1626 and f1632) and his arms go into the headboard/pillow (clip_check 57%). Fix: start the lift from a head height that clears the pillow, no dip. **must**
- **B3** frames 1638-1650, pose: on the sit-up both arms swing out flat at his sides (robot), and his torso pivots stiffly at the mattress line. Fix: push up on the elbows/hands, arms close to his body. **should** (must if it still reads robotic after B1)
- Sitting against the headboard (f1660-1800): reads as sitting up, with pillow and headboard in frame. Fine once B1 fixes the legs/duvet.

Verdict: **MUSTS** (B1, B2).

## Re-check @ 6b008a0d (bed)
Diff from 8e1f87e8: ch01.js night/bed only (12 lines). cam_check 0/0/0; sight unchanged. clip_check bed highs are down to 54.2-54.6 s: Max's torso under the duvet top, his head on the pillow and an arm on the duvet edge while lying. In the renders this reads as lying in bed, nothing poking through. I rendered f1620-1680 every 3rd frame plus 1700-1911; viewer test applied.

| must | status | note |
|---|---|---|
| B1 duvet beside his legs | fixed | legs hidden; the duvet's leg ridge reads as his legs under it, lying and sitting |
| B2 head dips into the pillow | fixed | head lifts straight off the pillow |
| B3 arms out on the sit-up | fixed | arms close in |
| user 0:51-1:00 "standing inside the bed" | fixed | lying with his head on the pillow, then sitting up against the pillow/headboard with the duvet over his legs |
| all earlier musts | still fixed | |
- should: f1845, a white pillow block stands against the wall behind the bed foot in the closet shot, reading slightly as floating. Drop it to the bed or crop it.

Verdict: **OK**.

## Final pass (delivery/chapters/ch01_a.mp4 + ch01_b.mp4 @ 6b008a0d)
- Files: a = 860 frames, b = 1051 frames (sum 1911 = FRAMES), both 1920x1080 at 30 fps.
- I looked at the whole chapter at 2 fps (a+b joined) in 4x4 sheets. It matches the clip I passed at 6b008a0d: the hook with Skye in the walk-in corner, no spin into the classroom single, the spider on her hand, Max's arms relaxed, the back door, the bed (lying, then sitting up against the pillow and headboard under the duvet), Max turning to the wall for Lily, and the end beat. Captions are present and inside frame.
- Full-res stills (hook CU f41, classroom single f471, shriek f791, sitting in bed b f790): clean, no artefacts. Faces are peach and hair keeps its colour at night.
- Seam (a f858-860 / b f1-4, "It's rubber. Skye. Wow."): continuous, no pop.
- Shoulds left (not blocking): flashlight arm straight; the pillow block against the wall at f1845.

FINAL: PASS

## Final pass, gesture-snap scan (added to the brief after the PASS above; supersedes it)
Method: a+b joined, 320x180 gray, `tblend=difference` mean per frame. A spike is a frame above 3x the median of the ±6 frames around it. I left out cuts (diff >30) and caption-only changes, and looked at every remaining spike as a before/after pair. Frame numbers are chapter frames, snap between f-1 and f.

| # | frames | what | fix | |
|---|---|---|---|---|
| G1 | 425-426 | Max goes from standing idle to a full walk stride in one frame (classroom wide, "That's Max") | ease the walk in over ~6 frames (step-off) | must |
| G2 | 514-515 | Max CU: the foreground white block (Skye's arm) disappears and her open lunchbox with the sandwich appears in one frame | ease the arm out / don't pop the lunchbox state | must |
| G3 | 529-530 | "You cut the crusts": Max's arm snaps from down to straight forward in one frame | ease over ~6 frames | must |
| G4 | 577-578 | the same arm snaps back down in one frame | ease | must |
| G5 | 702-703 | "gym socks": Skye's arm snaps from down to raised forward in one frame | ease | must |
| G6 | 747-748 | top-down insert: the spider jumps from Max's fingers to beside Skye's elbow in one frame | let it fall/crawl over ~6 frames | must |
| G7 | 821-822 | the spider leaves Skye's hand and Max's arm snaps up holding it at her face in one frame | ease the reach/hand-off | must |
| G8 | 898-899 | Max's arm with the spider drops in one frame | ease | must |
| G9 | 1036-1037 | 2-shot: Skye's left arm swings from down to out in one frame | ease | must |
| G10 | 1843-1844 | last shot: Max's shoulder at the right frame edge vanishes in one frame | ease or keep it | must |
| — | 1571-1590 | louvre shot: a small periodic flicker every ~4 frames (diff ~5.7), not visible at pair scale | look; likely Skye stepping behind the slats | should |

FINAL: MUSTS (G1-G10). Everything else in the final pass above stands.
