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
