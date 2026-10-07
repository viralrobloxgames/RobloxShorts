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
