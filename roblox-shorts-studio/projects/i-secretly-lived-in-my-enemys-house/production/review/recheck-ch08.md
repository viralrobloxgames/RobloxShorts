# recheck-ch08

## Re-check @ 90468d1e
clip_check (871 frames): 0 ranges, 0 high. sight: Lily sees Skye 20.9-24.8 s (attic, intended, she is not hiding from Lily). cam_check: 0 glides, 0 inside scenery, 0 at a head.
Previews: whole chapter every 15th frame, dense (every 4th) over 290-338, 520-560, 630-720, 1636-1742; full-res 391, 1100, 1705.

| must | verdict |
|---|---|
| C8-1 faces | **not fixed**: base faces are right, but the lip-sync still drops in the smile mouth on sad lines (see M1) |
| C8-2 note | fixed: folded "MAX" note in her hand in the WS/MCU, at the lit gap, crumpled in her fist on the back-away, fist with the ball on her knee in the attic |
| 2 reading note not in frame | fixed |
| 3 arm in door / knob in head | fixed (hand at the gap, clear of the door face and knob) |
| 4 Max's phone | fixed (black phone at his ear, f391) |
| 7 back-away | fixed (no door contact; feet out of frame, the move reads as backing off) |
| 10 Lily continuity | fixed (in the hatch in WS, CU, WS; then climbs out and walks over) |
| 12 see-through arm | fixed (no transparency; the moonlit arm glow remains, see shoulds) |
| 13 leg in skeleton / girls overlapping | fixed (gap between the girls, no skeleton contact); box knees remain (should) |
| 17 eye wipe / face pop | crying from the first word: fixed; face still pops smile/O (M1); wipe reads weakly (should) |
| I5 Max hair | ok |
| I9 Skye head glow | not fixed (should): the top of her hair is blown out lilac in every attic MCU, f751-1636 |
| R4 Max arm over head | ok (elbow out, hand at the ear, reads as a phone call now) |

New / remaining:
- **M1** frames 616 (Skye smirk on "The worst. Right. Got it."), 946 + 991 (smile on "Nothing. I left..."), 1651-1713 (smile/O alternating every ~4 frames while crying on "It's dusty"), Lily 781 ("He said that?"), 916 ("What came after?"), 1501 ("You don't really want to do that."): open/curved smile mouths during lip-sync. Fix: on sad/scared/crying/neutral lines never use the smile viseme (map it to flat/open/frown-open). **must**
- **M2** frames 631-720 (WS) and 1021-1742 (two-shot, ~25 s): both girls hold their arms splayed rigidly out from the body ~35-45 deg (Skye like a seated A-pose, Lily's arms out like flippers either side of the teddy). Robotic pose the user rejected. Fix: Skye's elbows in, left hand on/around her knees beside the note fist; Lily's arms bent, hands holding the teddy in her lap. **must**
- frames 1651-1705: the "eye wipe" is the fist held static half a head-width beside her face, note facing the lens; reads as showing the note. Fix: fist to the eye, small rub, down. should
- frames 1021-1742: Skye's knees still read as two grey boxes with blue tops. Fix: rotate the two-shot 20-30 deg. should
- frames 301-329: Skye smiles and looks into the lens while sliding the note. Fix: sad/neutral, eyes on the gap. should
- frames 521-533: shocked CU crops the top of her head. should
- frames 781-916, 1501-1606: Lily MCU still has the purple forearm block bottom-left and a glowing white Skye arm at the right edge. should

## Re-check @ 986b476f
ch08.js and the kit's character/speak code are byte-identical to 90468d1e (only kit/sets/kitchen.js changed, not used by ch08), so the frames are the same: M1 (smile visemes on sad lines) and M2 (splayed arms in the attic WS/two-shot) remain **not fixed**; shoulds as above.

## Re-check @ bfdc9f04
clip_check: 0 ranges (sight: Lily sees Skye in the attic, intended). cam_check: 0 glides, 0 inside scenery, 0 at a head.
Previews: whole chapter every 15th frame; every 4th over 600-630, 931-1001, 1491-1511, 1636-1720; full-res 1100.

| must | verdict |
|---|---|
| M1 / C8-1 smile visemes on sad lines | fixed: f601-625, 949-993, 781/796, 1493-1505, 1653-1713 alternate the sad/flat base mouth with "o", no smile frames |
| M2 splayed arms in the attic | fixed: Skye's hands meet on her knees beside the note fist; Lily's arms come forward to her lap round the teddy (f1036-1742) |
| all earlier musts (C8-2, 2, 3, 4, 7, 10, 12, 13, 17) | still fixed |

No new musts. Shoulds left (not blocking): eye wipe is a static fist beside her face (1651-1705); box knees in the two-shot; smile + lens look while sliding the note (301-329); I9 head-top glow in attic MCUs; foreground arm blocks in Lily's MCU.

## Final pass
delivery/chapters/ch08_a.mp4 (784 f, frames 1-784, rendered @ bfdc9f04) + ch08_b.mp4 (958 f, 785-1742, rendered @ bfdc9f04): 1742 frames total, 1920x1080, 30 fps. Whole chapter viewed at 2 fps in 2x2 sheets; it matches the approved bfdc9f04 previews (faces, note, door, phone, attic arms, eye-wipe beat, captions OK).

- **MUST, seam pop (782-787, Lily MCU "He said that?").** In one continuous shot, Lily's teddy jumps between a's last frame (784) and b's first frame (785). In a it sits high at her right with the bunny on her shirt visible; in b it sits low and centred, covering the bunny. The clip itself has no change there. The render is stateful: a cold render of the clip starting at 780 gives b's position, while a's warm sequential render (and the every-15 preview from frame 1) gives a's. Fix: re-render b with a pre-roll (start at the shot's first frame, ~766, and drop the frames before 785) so its state matches a, or make the teddy/arm hold deterministic per frame and re-render both. Then re-check 782-788.

### Final pass, ch08_b re-rendered (pre-roll render.mjs, sha256 fbda89d8...)
- Seam 782-787: **fixed**. The teddy and arms hold their position across a's 784 and b's 785, with no pop.
- Whole of b (785-1742) at 2 fps: matches the approved clip. Faces, crumpled note fist, hands in on the knees, Lily's arms round the teddy, eye-wipe beat and captions all OK. No new issues; the smile on "watch Max scream" is the scheming line, as planned.
- seam_check over 785-1742 (4 workers): cold starts differ on every chunk start, so any render without the full pre-roll would pop. A pre-roll of 300 still differs at 1265 and 1505, so only `--preroll all` (render.mjs's new default) is safe for ch08. ch08_a's seam_check over 1-784 (1/2/4 workers) shows 0 differences.
- final-ch08-a is re-rendering (RENDERING). The pass is pending its DONE; then I'll re-check a at 2 fps and the seam again.
- Gesture-snap scan of b (per-frame mean |f - f-1| at 480 px, 786-1742): the spikes over 30 are the cuts (800, 888, 930, 1024, 1216, 1491, 1551, 1583, 1610, 1637). The 1-3 bumps sit 3 frames after cuts or on caption changes (1379). The eye wipe up (1647-1655) and down (1703-1711) is eased over ~8 frames. The isolated 5.6 at 1400 is a uniform whole-frame luma shift, with no limb, head or prop moving (30 fps strip 1397-1402). **No gesture snaps in b.**

### Final pass, ch08_a re-rendered (pre-roll render.mjs, sha256 7726e1e1...)
- 784 frames, seam_check 1-784 (1/2/4 workers): 0 cold/warm differences. Seam 782-787 with the new b: **no pop**.
- Gesture-snap scan of a: the cuts are 163, 300, 330, 487, 517, 535, 556, 629, 657, 703, 745 and 768. Gradual ramps: the opening camera move 23-149, the kneel 302-313 and the back-away 536-555. The 56 bump is the "FRIDAY 9:30 PM" card fading. Two in-shot spikes are real:
  - **MUST frames 545-546** (back-away MCU, "Skye is the worst..." aftermath): Skye's right arm with the crumpled note snaps in one frame from forearm-forward/fist at the door to hanging straight at her side. Fix: ease the arm change over ~6 frames (or keep the fist forward until the cut at 556).
  - **MUST frames 746-748** (attic MCU of Skye on "Worse. Your brother thinks I'm the worst.", the first 3 frames after the cut at 745): a glowing white/lilac block (Lily passing the lens) flashes across the left edge, then vanishes. Fix: start the MCU after she clears the frame (cut at ~749), or keep her out of this camera's frustum.
- Rest of a at 2 fps: matches the approved clip.

**FINAL: MUSTS**: 545-546 arm snap, 746-748 foreground flash. Both are clip fixes and need a re-render of a (range 536-784 at least); b is final.

## Re-check @ a76617f1 (the two segment-A musts from the final pass)
Diff vs bfdc9f04: ch08.js only, 2 lines (skye_worse cut +0.2 s; the note fist eased down from the rise). Per-frame fingerprints vs bfdc9f04: only **535-545 and 745-750** change; **nothing at or after 785**, so ch08_b stays final.
| must | verdict |
|---|---|
| 545-546 arm snap | fixed: the fist lowers gradually over 540-548 (30 fps strip), no one-frame jump |
| 746-748 foreground flash | fixed: the MCU now starts at 751 after the WS of Lily crossing; 751-756 clean |
No new issues in 532-558 / 742-756.

### Final pass, ch08_a @ a76617f1 (sha256 e64342eb...)
- 784 frames. Frame-difference profile is identical to the 7726e1e1 render except at the two fixes: the 746-748 spikes are gone (the cut is now at 751) and 545-546 is an eased step. The rest of segment A is unchanged from the render already viewed at 2 fps.
- 542-547: the note fist lowers gradually, no snap. 748-753: WS, then the MCU from 751, no foreground flash.
- Seam 782-787 (a|b): continuous, no pop.
- ch08_b (fbda89d8...) unchanged and final.

**FINAL: PASS**
