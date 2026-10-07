# recheck-ch04

## Re-check @ 73f3ef39

Automated: clip_check 0 high, 3 medium (Skye arms leave the desk as she folds them f151-163; Max arms on his desk top and a desk leg in his legs during the sit-down f1687-1701; both brief and far from the lens), 5 low (the hand-off contact f1653-1656). Sight: n/a (Skye is not hiding in ch04). cam_check: 0 glides, 0 inside scenery, 0 at a head.
Visual: every must range at every 4th frame and the whole chapter at every 15th (0.5 scale), plus full-res f241, 371, 931, 1640-1700 and 1800.

| # | Must | Result |
|---|---|---|
| 11 | f1-10 Max pops up and walks through his desk | fixed (starts standing beside his chair, walks the aisle) |
| 12 | f1653-1677 walk back through his desk, 0.75 s sit | fixed (aisle path, sits from the chair side by about f1700) |
| 13 | reverse f351-680, Max's fist in Skye's shoulder | fixed (hand clear of her sleeve) |
| 14 | f1636-1663 half floats and teleports | fixed (split in both hands f1620, handed R palm to her R hand on contact f1644-1660) |
| 15 | f151-500 cookie glued under the fist, floats in the reverse, no put-down | fixed (in his L hand toward her, set down on her desk f500-512) |
| 16 | two-shots: Max's zombie arm, Skye's arm up off the desk | fixed (Skye's arms folded; Max's offer arm is lowered toward her desk) |
| 17 | f1321-1330 T-pose in the camera push | fixed (hard cut, arms down) |
| 18 | f1653-1833 end shot: Skye's one-arm hold | **NOT FIXED**: see below |
| 19 | two_shot_desk green and blue chair blobs | fixed (cam above the chair backs) |
| 20 | two_shot_close fg forearm and fist blobs | fixed (f931 clean, from mid-chest up) |
| I19 | teal-hoodie boy with spiky hair at 4:12 | fixed (Max at his desk has his own hair, f1700-1833) |
| R1 | zombie talking arms | fixed in ch04 (arms down or folded on the talking lines) |

New / remaining:
- **frames 1660-1833, must (#18 not fixed).** Skye holds the half at the end of an arm held straight out at shoulder height, pointed at the aisle and lens-left, for 6 s with no movement. Her other arm is a large tan and white block filling the bottom-right corner (f1708-1833, full-res f1800). Fix: angle the R arm down so the half sits in front of her chest, about 30-40° forward of hanging (or bring it to her mouth for a bite). Lay the L forearm flat on the desk out of the corner, or reframe so it leaves the frame.
- frames 1381-1501, should. Max's R arm holds the whole sandwich straight out at the left frame edge for 4 s. Lower it to chest height, or add a little sway.
- frames 169-500, should. The cookie offer arm stays locked for about 11 s, and the cookie pokes out of the hand's edge rather than resting on a palm. Readable as an offer; a small sway or lowering between lines would help.

## Re-check @ 80a98e8b
(Relayed by the orchestrator: recheck-ch04's own commit 3d1e74f could not be pushed from its session.)
- #18 **fixed** (34381f27): the end-shot half rests in Skye's palm on the desk, no straight arm; the far arm is out of the corner.
- Every critic-2 ch04 must plus critic-6 I19 and R1: fixed. clip_check: 0 high. cam_check: clean.
- Verdict: **OK @ 80a98e8b**. The two shoulds (Max's held-out sandwich arm f1381-1501, the locked cookie offer f169-500) were addressed in 34381f27 with lowered arms and a sway.

## Gesture-snap scan @ 80a98e8b

Method: segment A is delivery/chapters/ch04_a.mp4 (80a98e8b). Segment B is a fresh render of f826-1833 at scale 0.25 (80a98e8b, current render.mjs). I decoded both at 480 px, took the per-frame mean |f - f-1| and flagged spikes over 3x the local median. I excluded cuts (diff > 45) and inspected every remaining spike as a frame pair. Caption and face-texture changes (f56 title fade, 208, 322, 415, 518, 690, 808, 878) are fine.

New musts:
- **frames 171-172 (0:05.7), must.** Skye's head snaps from looking off-left to facing Max in one frame, as she folds her arms. Fix: ease the head turn over about 6 frames (f167-172).
- **frames 1663-1664 (0:55.4), must.** Max turns about 180° in one frame, from facing camera to his back, mid-step, right after the hand-off. Fix: ease the yaw over about 6-8 frames, turning as he steps off.
- **frames 1704-1705 (0:56.8), must.** In the two-shot just before the end-shot cut, Skye's head swings from away to front and her R arm jumps from hanging to forward with the half in one frame. The half pops into view. Fix: ease the arm and the head over about 6 frames, or place the change on the cut (f1708) so it isn't seen.
- Small spikes at f910 and f1059 are minor arm/face settles, not visible snaps. OK.

**RECHECK: MUSTS @ 80a98e8b (gesture snaps)**

## Early look at the snap fixes @ 827699ba (OK held until the kit anti-snap filter K)

Rendered f30-70, f155-185 and f1640-1740 at scale 0.25 and ran the frame-diff scan on them. The only isolated spikes left are the title fade (f56) and the end-shot cut (f1715).
- f171-172, Skye's head: fixed. The diff is even at about 1.8 per frame over f156-167 (an eased look-up).
- f1663-1664, Max's 180° turn: fixed. It is a continuous turn over f1665-1672, then the walk.
- f1704-1705, Skye's arm and head: fixed. The change is now on the cut at f1715; no in-shot jump.
Pending: snap_check, clip_check --sight, cam_check and the viewer test at a main sha >= K. Then RECHECK: OK.
