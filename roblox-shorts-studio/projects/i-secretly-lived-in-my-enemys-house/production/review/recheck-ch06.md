# recheck-ch06

## Re-check @ f18aca08

Automated: cam_check 0 glides / 0 inside scenery / 0 at a head. clip_check 0 high; 2 medium = Lily's tap on Skye's arm
(f786, one frame, contact); 4 low = Skye's arm at the side-table knob and Lily's arm at the closet jamb (0.2 deep, 11%).
Sight: Lily-sees-Skye ranges are the two of them talking at the door / in the closet (expected). "dad sees skye"
6:02.0 (35.93-36.07 s, f1078-1082, 19 studs): Dad is still off screen on the stairs and the girls are not hiding yet;
from his first shot (f1126) his back is to them. Not visible to a viewer; OK.
Visual: whole chapter every 15th frame; must ranges every 6th; full-res stills f196, 781, 1351, 1366, 1606, 1630, 1726, 1733.

| Must | Frames | Verdict |
|---|---|---|
| c3 #2 orange blob in `mirror_mcu` | 160-331, 481-561 | fixed (wall/shelf on the right) |
| c3 #3 forearms at the lens | 171-231 | **not fixed**: now one arm, but the "hand on neck" forearm still points at the lens, a giant block filling the left third beside his face (f184-235) |
| c3 #4 arm through desk | 341-471 | fixed (gestures clear of the desk) |
| c3 #6 Lily inside Skye / T shock | 760-822 | fixed (Lily ~2 studs off, one-arm hop) |
| c3 #10 hall wide void / Skye missing | 1081-1131 | fixed (shot reworked, girls at Max's door behind Dad, set fills frame) |
| c3 #11 Dad T-pose | 1141-1733 | fixed (broom low/raised one-armed, torch low) |
| c3 #12 dash into closet | 1347-1368 | fixed (wide from closet end, Dad's back turned, Lily leading, no clip) |
| c3 #13 `dad_mcu` void / facing lens | 1369-1449 | fixed |
| c3 #14 `hatch_low` | 1579-1648 | **not fixed**: hatch only a blown-out sliver at the top edge; Dad looks at the lens, not up; the torch in his hand points at the camera while the beam cone rises to the hatch from behind his head (f1606-1648) |
| c3 #15 hidden girls in plain view | 1651-1733 | closet CU (f1651-1710) fixed; **end hold f1711-1733 not fixed**: from this angle the closet door reads wide open, both girls stand head to toe in the doorway with a warm glow beside them, 3 m behind Dad |
| c3 #16 broom through face / slab edge | 1711-1733 | fixed (broom beside his head, frame inside the set) |
| c6 I3 Max identity at the mirror | 160-561 | fixed (brown hair, grey top) |
| c6 I10 / I13 landing faces | 760-1140 | fixed (both faces readable) |
| c6 I15 Dad's robe | 1126-1733 | kept as `dad_robe`, hair reads brown; OK |
| c6 I16 torch whiting out Dad's face | 1141-1733 | fixed |

New / remaining:
- frames 171-235, `mirror_mcu` hand on neck: fix = elbow out to the side and up, forearm behind/beside his head, hand at the back of the neck; nothing between his face and the lens. **must**
- frames 1579-1648, `hatch_low`: fix = Dad's head tilted up to the hatch, torch hand raised and aimed at the hatch so the beam starts at the torch, tilt/lower the camera so the whole hatch (and its ladder line) sits inside the top of frame. **must**
- frames 1711-1733, `linen_end`: fix = from this camera the door must show a crack (~one face width) with only the two faces/eyes in it, no warm light inside; or re-aim so the door edge hides their bodies. **must**
- frames 778-790, Skye's hop: the hand-to-mouth arm is a horizontal block across her face for ~12 frames; fix = forearm angled up, hand at the mouth, elbow down. should
- frames 960-1010, Skye's torch sits on top of her horizontal forearm (not in the hand), and the folded-arms read as one block; should
- frames 1345-1380, dash wide: Dad (back to us) holds both arms forward at shoulder height, a stiff silhouette; arms lower. should
- frames 1363-1400, a glowing yellow floor wedge in the bottom-left foreground of the closet-end wide; should

## Re-check @ 8537ebc6

Diff vs f18aca08 for ch06: only `web/ch06.js` (mirror hand, hatch camera/torch, closet door crack, hop hand, dash torch arm);
the only kit change is `kit/sets/kitchen.js`, which ch06 does not use. cam_check: 0 glides / 0 inside scenery / 0 at a head.
clip_check: 0 high; 2 medium = Lily's tap on Skye's arm (f786, one frame, contact). Sight: only the same off-screen
`dad sees skye` 6:02.0 (f1078-1082, Dad still on the stairs, girls not hiding), and Lily/Skye talking; OK.
Previews: fix ranges every 6th frame, full-res f1627, f1729.

| Must | Frames | Verdict |
|---|---|---|
| `mirror_mcu` hand on neck | 171-235 | fixed: elbow up and out beside his head, face clear |
| `hatch_low` | 1579-1648 | fixed: the whole hatch and pull cord in frame, Dad raises the torch and the beam runs from it to the hatch, head tilted up |
| `linen_end` end hold | 1711-1733 | fixed: door at a crack in the dark, only the two faces peek out, no glow inside, Dad's back to it |
| all earlier musts (see above) | | still fixed |

No new issues. Remaining shoulds (Skye's torch on her forearm at f960-1010, the floor glow wedge in the dash wide) are
not musts.

## Gesture-snap scan @ 8537ebc6 (added to the brief after the OK)

Every frame of the clip at 0.25 scale, `tblend=difference` mean per frame. Spikes above 3x the local median were checked
as 5-frame strips. Cuts and caption fades are skipped. 384-385, 408-411 and 432-435 are Max's gestures moving over 2-4
frames (should, could ease to ~6). 1325-1326 is Dad's broom leaving frame over 2 frames (should). The rest:

- frames 68-70, creep: Skye turns 180 deg from facing the lens to her back in one frame (f69 -> f70). Fix: turn over
  ~8 frames. **must**
- frames 276-278, `mirror_mcu`: Max's hand-on-neck arm drops from beside his head to his side in one frame
  (f277 -> f278). Fix: ease it down over ~6 frames. **must**
- frames 475-477, `mirror_ms`: the facepalm hand leaves his face and hangs at his side in one frame (f476 -> f477).
  Fix: ease over ~6 frames. **must**
- frames 1605-1607, `hatch_low`: in one frame Dad's torch arm jumps from his waist to raised at the hatch (and the beam
  switches on), and his broom arm jumps from upright to pointing (f1606 -> f1607). Fix: raise both over ~6-8 frames,
  with the beam on as the torch comes up (or start the shot with them already raised). **must**

Verdict: RECHECK reverted to MUSTS @ 8537ebc6. The final renders from 8537ebc6 need redoing once these are fixed.

## Re-check @ 2142589b

Changes since 8537ebc6: `web/ch06.js` (the four snaps plus Max's gestures), plus shared kit `cast.js`/`bedroom.js`. So I
diffed every 3rd frame of the whole chapter against the 8537ebc6 render. Outside the fixed ranges, only f1126-1231 and
f1567-1588 changed: Dad's torch now hangs pointing down from his hand instead of glaring at the lens (better). Nothing
regressed. cam_check: 0 glides / 0 inside scenery / 0 at a head. clip_check: 0 high; 2 medium = Lily's one-frame tap
(f786). Sight: same off-screen `dad sees skye` 6:02.0 (f1078-1082), OK.
Snap scan (every frame, 0.25 scale, tblend difference): no single-frame spike inside a shot remains. The fix ranges were
viewed at 30 fps (0.5 scale).

| Must | Frames | Verdict |
|---|---|---|
| Skye's 180 deg snap turn | 68-70 | fixed (turn over ~8 frames) |
| Max's neck arm drop | 276-278 | fixed (eases over ~7) |
| Max's facepalm drop | 475-477 | fixed (eases over ~6; f478 is that motion, no pop) |
| Dad's torch/broom raise at the hatch | 1605-1607 | fixed: a continuous raise with the beam following. The beam sweeps past the lens as a faint warm wash for ~2 frames (f1605-1606), which reads as a torch sweep; OK |
| earlier musts | | still fixed |

Shoulds: Max's point/thumb/facepalm now ease over ~4-6 frames (432-435), fine. No musts.
