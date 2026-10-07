# recheck-ch03

## Re-check @ f33491e8

Automated: clip_check `--sight skye:max,dad,lily` finds 0 sightings. It finds 1 high hit, Dad's Leg.R on the bottom tread at frame 1533. That is a foot resting on the step as he walks off the stairs, so it is explained. cam_check finds 0 glides, 0 cameras inside scenery and 0 cameras at a head.
Visual: the whole chapter at `--every 15`, every must range at 5-10 fps, and full-res crops of 1341-1349 and 1528-1542.

| # | must | verdict |
|---|---|---|
| 1 | Skye visible through the pantry louvres (379-1267) | fixed: the louvres are opaque/black behind Max, Skye's peeks are inserts from inside, sight check 0 |
| 2 | Skye ducks in Dad's view (1487-1547) | fixed: she crouches at the near end of the island, below the counter as seen from Dad on the stairs; sight check 0 |
| 3 | Max/Dad walk outside the stairs and through the banister (301-313, 1507-1547) | fixed: both walk on the treads; Dad steps off the bottom tread onto the floor at 1532-1540 |
| 4 | Skye runs through the louvred door (290-301) | fixed: the door opens first and she goes through the gap |
| 5 | Max's forearm sunk into the fridge (505-558) | fixed: arm by his side, no contact |
| 6 | sandwich teleports to Skye / rigid arm (1333-1477) | **not fixed**, see N1 |
| 7 | butter knife with no hand / floating (1117-1147) | fixed: the knife is in Max's hand over the bread; no floating |
| 8 | ham through the flashlight (977-1267) | fixed: the props are apart |
| 9 | Max's huge head in the fg (1277-1290) | fixed: wide shot, Max behind the island |
| 10 | Skye's dark face, sandwich stuck to her forearm (1807-2013) | fixed: face lit, sandwich held in her R hand at chest height |
| I2 | Max dark-faced, black-haired in the fridge light | fixed: brown hair, lit face, grey top |
| I8 | dark face / purple hair at 3:15 | fixed |
| I15 | Dad's robe not on the sheet, plum hair | fixed: `dad_robe` is a kit wardrobe; his hair reads brown |

New / remaining:
- **N1** frames 1341-1487 (2:55.2-2:59.8): the sandwich disappears from the plate between 1343 and 1345, and her hand never visibly touches it. It is then not seen in Skye's hand for the rest of the close-up, because the hand stays below the island's top edge. It reads as the sandwich vanishing. Fix: in this shot, the hand should visibly reach the plate on the grab frame and lift the sandwich into view at chest height (raise the hold or the camera). **must**
- **N2** frames 1812-1838 (3:11.0-3:11.9), Skye close-up in front of the open fridge: a brown hair tuft (Dad's head, directly behind hers) sticks up over Skye's pink hair and reads as a brown bun on Skye. Fix: move the camera or Dad so his head is not behind hers. **must**
- **N3** frames 1801-1896 (3:10.6-3:13.7), Dad at the open fridge: his R arm sticks straight forward at the lens with a closed fist for about 3 s, and the held item is cropped below frame. This is the "arm straight out" pose the user rejected. Fix: a relaxed bent-elbow hold with the ham visible at waist or chest height, or lower the arm. **must**

## Re-check @ 726592de

Automated: clip_check `--sight skye:max,dad,lily` finds 0 sightings. Its only high hit is the same one-frame foot on the bottom tread (1533), which is resting contact. cam_check finds 0 glides, 0 cameras inside scenery and 0 cameras at a head.
Visual: the whole chapter at `--every 15`. Also 1335-1490 at every 5th frame, 1795-1900 at every 6th, and spot checks of 285-316, 1117-1153 and 1527-1545.

| # | item | verdict |
|---|---|---|
| N1 (must 6) | sandwich vanishes from the plate | fixed: her R hand reaches the plate (1340-1345) and lifts the sandwich to chest height, where it stays in view through 1487 |
| N2 | Dad's hair behind Skye's head | fixed: the close-up is re-angled, and Dad is well clear of her head, top right behind the island |
| N3 | Dad's arm straight at the lens | fixed: a bent-elbow hold with the ham visible at chest height (1786-1897) |
| 1-5, 7-10, I2, I8, I15 | as @ f33491e8 | still fixed; no regressions seen in the whole-chapter pass |

New issues: none.

## Gesture-snap scan @ 726592de (segment B, delivery ch03_b.mp4 907-2013)

Method: decode at 480 px and take the per-frame mean |f - f-1|. Every spike that is not a cut was viewed as a frame pair or a 9-frame strip. The cuts (936, 945, 981, 1117, 1154, 1273, 1330, 1489, 1577, 1615, 1628, 1765, 1808, 1841, 1897) and the caption changes (1225, 1235, 1360) are fine. The knife stroke (1121-1126) moves fast but continuously. The fridge door closing at 921-924 and 1885-1888 is a quick 3-frame shut, which reads as a slam. All of these are OK.

Snaps (each a **must**, fixed by easing over ~6 frames or starting the shot on the settled pose):
- **S1** frames 1154-1156 (2:49.1): the shot opens with Max's hands resting on the island (plate and torch). At 1156 both arms drop to his sides in one frame. Fix: start the shot on the arms-down pose, or ease the drop.
- **S2** frames 1330-1332 (2:54.9): the shot opens with Skye's arms held out from her body for 2 frames. At 1332 they snap down. Fix: start the shot on the settled pose.
- **S3** frames 1691-1692 (3:06.9), Dad CU: his head turns from 3/4 (looking right) to frontal in one frame. Fix: ease the turn over ~6 frames.
- **S4** frames 1762-1763 (3:09.3): the fridge door goes from nearly closed to wide open in one frame, and the fridge light floods in, 2 frames before the cut at 1765. Fix: ease the opening over ~6 frames, or open it after the cut.

Segment A (1-906, rendered at --scale 0.25 @ 726592de, same method): the cuts (143, 211, 272, 326, 380, 452, 659, 749, 896), the caption fade at 56-57 and the stair walk (343) are fine. The arm rise at 751-756 is gradual, so it is fine too.
- **S5** frames 452-453 (2:15.6): a 2-frame shot (a tighter Max at the fridge) between the cuts at 452 and 454 reads as a flash/jump cut. Fix: drop it, so the shot at 454 starts at 452, or hold it for at least ~12 frames.
- **S6** frames 522-523 (2:17.9), Max at the fridge: his head turns from looking at the fridge to frontal in one frame. Fix: ease the turn over ~6 frames.
- **S7** frames 769-770 (2:26.2), Max CU: his R arm (screen left) drops from raised-outward to his side in one frame. Fix: ease it over ~6 frames.

## Re-check @ 6d8d0547 (S1-S7 eased; kit filter K cancelled)

Automated: clip_check --sight finds 0 sightings, and its only high hit is the known foot on the stair (1533). cam_check is clean. snap_check finds 72 events, 33 of them high. Viewed as frame pairs at 0.5: S1-S7 and the high events at 386, 444, 930, 1491, 1514, 1551, 1590, 1610 and 1904.

| item | verdict |
|---|---|
| S1 1155-1156 | fixed |
| S2 1330-1332 | fixed (shot reworked as a wide) |
| S3 1691-1692 Dad's head turn | **not fixed**: still 3/4 to frontal in one frame |
| S4 1762-1763 fridge door | fixed |
| S5 452-453 flash shot | fixed |
| S6 522-523 Max's head | fixed |
| S7 769-770 Max's arm | fixed |

New snaps from snap_check that are visible on screen (each a **must**, eased over ~6 frames):
- **T1** 385-386: at the island, Max goes from facing the camera with the torch raised to turned away with his arm across his body, in one frame.
- **T2** 443-444: Max's torch arm drops from raised (lit torch) to his side in one frame.
- **T3** 929-930: Max's arms jump from his sides to L arm out / R arm forward in one frame.
- **T4** 1490-1491 (wide): Skye at the island turns from facing the camera to facing away in one frame.
- **T5** 1513-1514 (wide): Skye drops from a run to a crouch in one frame.
- **T6** 1550-1551 (wide): Dad's walk pops into a splayed, jump-like pose in one frame.
- **T7** 1589-1590 and 1609-1610: Dad's arms swap position (the forward arm changes sides) in one frame.
Fine: 1903-1904 (a barely visible change).

## Re-check @ b6998591

Automated: snap_check finds 38 events, **0 high** (it was 33 high). clip_check --sight finds 0 sightings and 0 high hits. cam_check finds 0 glides, 0 cameras inside scenery and 0 cameras at a head.
Visual (0.5 scale, the frame before each former snap point and 3 frames after it): S3 1691-1694, Dad's head turn, is now eased. T1 385-388 is now a cut to the wide. T2 443-446, T3 929-932, T4 1490-1493, T5 1513-1516, T6 1550-1553 and T7 1609-1612 all move gradually, with no one-frame jumps. S1, S2 and S4-S7 were fixed @ 6d8d0547.

All musts fixed; no new issues. **RECHECK: OK @ b6998591.**

## Final pass

- Both final statuses are DONE at b6998591 (a: 1-906, b: 907-2013). The `code` fingerprint in both `ch03_a.json` and `ch03_b.json` is 091cbbae5147, so both halves were rendered from the same code; it is no longer the 726592de-era e6bae5603db8. The .json files do not record the sha, so b6998591 comes from the final status files.
- Seam: the pixel diff of the joined a+b at 906→907 is flat, with no pop. The b chunk starts (1184, 1461, 1738) are also flat. seam_check (907-2013, preroll 300, window 8) still reports cold-start pose differences at the chunk starts, but nothing shows in the delivered pixels.
- Whole chapter: a frame-to-frame diff scan, plus the in-shot spikes viewed as pairs (363 a stair step; 523 a caption; 660-662 a light fade; 1267 the torch switching on; 1771 the fridge door opening over 2 frames). No snaps.
- A 1 fps contact sheet of the whole chapter: identity, staging, props and captions are consistent. The hide reads correctly.

**FINAL: PASS**
