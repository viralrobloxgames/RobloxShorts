# recheck-ch09

## Re-check @ 4bdb7dbe
Automated: clip_check 0 high, 1 medium (Skye L forearm at the near flap 25.3-25.5 s, depth 0.25, a brush), lows = Lily's
legs resting on the chair seat (contact). Sightings = Lily sees Skye while they talk (nobody hides in ch09). cam_check: 0/0/0.
Visual: 0.5-scale previews, every 15th frame + must ranges every 4-10 frames (2x2 sheets).

| must | verdict |
|---|---|
| #2 "He spelled friends wrong" (f907-957) | fixed: drawing in both hands at chest, in frame, arms in front |
| #3 "He kept it" (f1057-1107) | fixed: drawing held at chest the whole CU, sad look |
| #4 Lily's teddy every shot | fixed in every shot seen (1, 400, 1060-1150 hug, 1180-1246, 1546, 1650-1790); see new #N2 for the put-back medium |
| #5 put-back (f1474-1510) | **not fixed**: f1480 the drawing is in her hands above the box; f1484 it is standing against the box's far wall while both her hands are back at her chest; f1488-1496 it lies at the near-left corner, then the near edge (it jumps position every few frames, no hand on it). The level inserts at 1508-1516 are good. |
| #8 no T-pose on the walk (f716-730) | **not fixed**: from behind, f720-730 both upper arms are out to the sides at shoulder height with forearms up (a two-arms-up "hands up" shape) |
| #9 seated two-shot (f1-160, 400-520) | Lily fixed (hips on the seat, shins down, teddy in lap). **Skye not fixed**: her lap is still a white rigid box with square corners (f121 crop) under a thin grey plane; her blue jeans/legs are not visible at all |
| #10 "Step one" MCU (f181-340) | scissors now in the R palm at the lap: fixed in that respect; R forearm still a big diagonal foreground block (should). **New must** on the L arm, see N1 |
| #15 last shot (f1647-1792) | **not fixed**: both upper arms out horizontally at shoulder height (wide T-ish frame) for 4.8 s, hands at/outside the sheet's top corners, eye holes at chest, not face height; the sheet is still a rigid flat panel |
| critic-6 R3 (9:03, f~830-850) | fixed: drawing at chest, elbows bent, no spread |

New issues:
- N1 frames 265-340, Skye's L arm sticks straight out horizontally at shoulder height toward camera-right holding the
  glow-stick bundle for ~2.5 s (robotic one-arm point, the user's "arms straight out"). Fix: bundle raised to chest/chin
  in front of her, elbow bent and down. **must**
- N2 frames 1476-1504, put-back medium: Lily at the right edge stands in the sun shaft and her body/legs are blown out to
  glowing pink-white (identity/colour change); no teddy visible. Fix: move her out of the shaft or cheat the shaft off
  her; teddy visible in her hand. **must**
- N3 frames 925-1105 (Skye CUs): Lily's yellow shoulder blob still in the bottom-left corner (#16 claimed fixed). **should**
- N4 frames 191-340: R forearm still a large foreground block across the lower left. **should**

## Re-check @ 34d5f66f
Automated: clip_check 6 high + 1 medium, all Skye's arms vs MAX - OLD STUFF at 25.1-25.2 s and 49.7-50.0 s. Looked at
f748-760 and f1487-1502: forearms pass over the wall top into the open box; agree these are AABB false positives of the
rotated box. cam_check 0/0/0. Sightings = talk (nobody hides).

| must | verdict |
|---|---|
| #5 put-back | fixed: kneels, drawing in both hands (f1487), hands into the box (1493-1496), drawing lying art-up on the contents as she lifts out (1502), level insert (1508-1516) |
| #8 walk f716-730 | **not fixed**: from behind, f716-728 the camera-right upper arm is still horizontal out to the side at shoulder height, the other raised beside her head (two-arms-up shape, ~0.4 s) |
| #9 Skye seated | fixed: sheet flat on the blankets in front, crossed legs read |
| #15 last shot f1647-1792 | fixed: narrower sheet, hands on the top corners at chin height, eye holes at collar |
| N1 glow sticks f265-340 | fixed: bundle in front at the lap/chest, arm bent inward |
| N2 Lily in the sun shaft | fixed: medium is tighter, Lily and the shaft out of frame |

New:
- N5 frames 1576-1646 ("Yes." CU and the wider two-shot before the last shot): Skye holds the sheet at waist with both
  arms spread horizontally to the sides at shoulder height (f1606-1636 reads as a T-pose with a sheet). Fix: same grip as
  the last shot (hands on the corners, elbows down, sheet at chest), or the bunched sheet in one hand until the open.
  **must**
Shoulds left: rim glow on Skye's raised R arm f556-661; Lily's shoulder sliver in Skye's box CUs.

## Re-check @ 91b328d1
Automated: same 6 high + 1 medium at MAX - OLD STUFF (rotated-box AABB false positives, accepted at 34d5f66f); cam_check 0/0/0.
Visual: f690-758 every 4th, f1560-1698 every 6th, whole chapter every 30th (plus every 15th at the earlier rounds).

| must | verdict |
|---|---|
| #8 walk | fixed: front walk f698-714 with a natural arm swing, then side-on f718-758, arms down/forward into the box |
| N5 sheet arms f1576-1646 | fixed: arms low, bunched sheet held off-frame low in the R hand, opened on the cut to the last shot (f1650); no spread arms |

All earlier musts stay fixed (drawing in hand at chest through 781-1471, teddy in Lily's hands throughout, put-back,
seated two-shot, glow sticks, last shot). No new musts. Remaining shoulds (not blocking): sheet not visible in the "Yes."
CU; rim glow on Skye's raised arm f556-661.

**RECHECK: OK @ 91b328d1**

## Final pass (lean, per orchestrator 19:25Z)
- Commit: final-ch09-a (1-806) and final-ch09-b (807-1792) status files both DONE @ 91b328d1 (the OK sha); both mp4 .json
  carry code 1ffb255a8f6c, 806 + 986 = 1792 frames, 1920x1080 30 fps, 15 + 20 captions.
- Seam (a last 6 frames -> b first 4): mean |f - f-1| at 270p 0.38-0.62 inside A, 0.69 across the split, 0.50-0.71 inside B:
  no pop; same shot and pose continue.
- 1 fps contact sheets of both mp4s: matches the passed 91b328d1 previews (drawing at chest in hands, teddy with Lily,
  put-back, sheet bunched then opened on the cut, last shot); captions present and in speaker colours.
- The anti-snap kit filter was cancelled (requests.md 15:50Z), so no separate snap check was run.

**FINAL: PASS**
