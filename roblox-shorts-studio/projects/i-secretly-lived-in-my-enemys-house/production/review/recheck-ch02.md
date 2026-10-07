# recheck-ch02

## Re-check @ f1489f27

Automated checks: cam_check found 0 glides, 0 cameras inside scenery and 0 cameras at a head. clip_check found 6 high hits, all Dad's spatula hand 2% into the stove-top box (resting contact, accepted), plus 1 medium hit that is a real problem: Max is 33% inside the stair-side wall at f427-454 (see N1). The sight check shows no sighting during the steal or the crawl. The glimpses on the stairs at 11.3-15.5 s happen while Skye is still above or behind the family and no shot shows them, so they are accepted. Line times come from audio/chapters/ch02/lines.json.

| must | verdict | notes |
|---|---|---|
| A1 Dad faces the stove while Skye runs | fixed | f220-246 Dad has his back to the room |
| A2 steal while the family looks at Dad | fixed for secrecy (no sighting) | how the steal reads is still a must, see N5 |
| A3 Skye out of the counting shot | fixed | |
| A4 crawl motivated, family turned away | fixed | f1261-1303 Max and Lily have their backs to her |
| A5 Max talks to Dad, Dad turned from the stove | **not fixed** | f496-552: Max delivers line 4 straight to the lens (the hide side) and Dad keeps his back to him at the stove the whole line |
| B1 (user 1:18) stair foot and newel | **not fixed** | the banister is gone, but Max is now half inside the stair-side wall, see N1 |
| B2 (user 1:19) Lily inside Max | fixed | she comes down well behind him and sits on stool 1 |
| B3 (user 1:19) speaker on screen | mostly fixed | should: f460-495 Max is off screen or only an edge behind the stack during his own line |
| B4 (user 1:40) bodies overlapping the counter | fixed | stools 1 and 3, no overlap |
| B5 feet on the treads | fixed | |
| B7 crouch and crawl clear of the cabinet | fixed | |
| B9 ladder step-off | fixed | |
| B10 (user 1:53) Max inside his desk | fixed | forearms on top; only the hands sit slightly into the top edge (clip medium, 13% cover) and are not visible |
| C1 (user 1:47) giant hand and floating pancake | **not fixed** | see N6 |
| C2 pancake floats off the stack | **not fixed** | see N5 |
| D1 one-arm freeze | fixed | f202 |
| D2 Dad's zombie arms | fixed | one spatula beat per line |
| D3 Max smiling on scared or annoyed lines | **not fixed** | see N7 |
| E1 3-frame flash shots | fixed | |
| E3 Dad's arm in Lily's MCU | fixed | |
| E5 Skye outside before Dad's line ends | fixed | cut at f1303, the line ends f1315, after she reaches the door |
| F1 Max readable in the predawn light | fixed | |
| G1 Skye's head in Max's eyeline | fixed | |
| G2 kneel for the steal | see N5 | |
| G3 ladder descent on the rungs | **not fixed** | see N4 |
| G4 stairs: no airplane arms | **not fixed** | see N3 |
| G5 Max's vertical "wall" arm | fixed | |
| G6 Dad's fist in the counter | fixed | n/a now (Dad stays at the stove) |
| G7 Skye's arm through the chair back | fixed | |

New and remaining issues:
- **N1 frames 427-459, must (user 1:18).** Max comes off the stairs with his left arm and half his torso inside the stair-side wall (f448 and f454 show it clearly; clip_check: Max Leg.R, Torso and Arm.R in the 0.3x12x14 wall at (10.8, 6, -5), depth 0.36, cover 33%, 14.2-15.1 s). Fix: route the stairs_bottom -> stool path at least 0.8 stud off the wall face (the wall at x 10.8), then re-run clip_check until this hit is 0.
- **N2 frames 346-426, must.** Skye's whisper shot ("Why is he so happy?") shows a broken pose. Her body is horizontal, her head is rolled 90 degrees with her face sideways, and a giant white arm block fills the left third of the frame. It reads as a body lying on the floor. Fix: an upright low crouch with her back to the cabinet, head level and 3/4, hands at her knees or a finger to her lips; aim the camera off the near arm.
- **N3 frames 142-195, must (G4).** On the stairs both of Skye's arms are held out horizontally (airplane/T-pose, clearest at f160 and f178). The near hand hovers above the rail at shoulder height instead of on it. Fix: one hand down on the rail and the other arm low (K3).
- **N4 frames 1-60, must (G3).** On the ladder Skye hangs to the right of the rails and rungs, facing camera, so she still reads as sinking beside the ladder rather than climbing it (f25-43). Fix: put her body between the rails, facing the ladder or 3/4 to it, with her hands on the rails.
- **N5 frames 874-899, must (A2/C2/G2).** The steal does not read. Her hand block hovers behind the stack, the top pancake twitches at f889, and then the whole stack, butter included, stays as it was. No pancake visibly comes off into her hand, and her head is above the counter top beside the stack. Fix: the top pancake (with the butter, or without butter from the start) slides off the edge and is parented to her hand (PR1), with her hand on the stack top in front of it, not behind it, and the count visibly drops.
- **N6 frames 1303-1415, must (C1, user 1:47).** Exterior: the pancake is still a flat disc on the front face of the big hand block, not in a hand, and on the bite (f1405-1414) the block covers her mouth and chin. This is the "giant hand, floating pancake" the user rejected. Fix: hold it at her chin with her fingers at its edge, the disc rim-on to the camera, and for the bite move the pancake to her mouth instead of moving the block across her face (PR1/K1).
- **N7 lines 8, 16, 18, 20 (f803-871, f1488-1581, f1663-1747, f1855-1892), must (D3).** Max's annoyed, scared or suspicious lines alternate `mouth_o` with `mouth_small`, and Max's `mouth_small` is an upturned smile. Under half-lidded or angry brows it reads as a smirk ("Not funny" f811 and f841, "How do you know that?" f1876). Fix (kit K4): `mouth_small` for non-bright faces should be flat or downturned; alternatively the chapter can use a flat-mouth variant on these lines.
- **N8 frames 496-552, must (A5).** See A5. Either Dad turns from the stove to Max for line 4, or Max is 3/4 toward Dad and not toward the lens.
- N9 frames 97-136, should. In the hall creep both of Skye's arms are flared stiffly out from her body. Fix: arms closer in, one hand forward (sneak).
- N10 frames 460-495, should. Max is barely on screen during his own line (B3).

## Re-check @ 72fff376

Automated checks: cam_check found 0 glides, 0 cameras inside scenery and 0 at a head. clip_check found 4 high hits, all Dad's spatula hand 2% into the stove top (accepted). Max's arm against the stair wall is now medium, 0.2 deep, and not visible in the render. The sight check shows the same brief stair glimpses as before plus the meant classroom moment (accepted). I viewed the whole chapter.

| item | verdict | notes |
|---|---|---|
| N1 (user 1:18) Max inside the stair-side wall | fixed | f427-459: his body is whole beside the wall |
| N2 whisper-shot hide pose | fixed | f346-426: upright low crouch, head level |
| N3 airplane arms on the stairs | fixed | the near hand is low; the far hand trails at the wall (acceptable) |
| N4 ladder | fixed | she is now on the ladder face |
| N5 steal | **not fixed** | see below |
| N6 (user 1:47) exterior hand and pancake | fixed for the hold | the block no longer covers her face; the pancake sits at the end of her hand beside her chin. Should: there is no visible bite on "Ever" (f1400-1415), only a small head dip |
| N7 Max smiling on scared or annoyed lines | fixed | flat mouth at f811/841/1876, "o" at f1546, teeth on "alert" |
| N8 Dad turned to Max for line 4 | fixed | f463-535 Dad faces the kids |
| N9 hall-creep arms (should) | improved | |
| N10 Max barely on screen during his line (should) | not changed | |

Must left:
- **frames 887-896, the steal, must.** The stolen pancake lifts off the stack and floats in mid-air beside and above Skye's head for about 0.2 s (f890-893), touching nothing. Her hand block is behind the stack, not under the pancake. Then the pancake disappears behind the stack (f896). It reads as a floating prop, the exact thing the user rejected at 1:47. Fix: her hand on the top pancake in front of the stack (camera side) from T.steal, and the pancake parented to that hand from the first frame it moves, sliding it straight off toward her below the stack top. No free lerp to the "edge" point, which from this camera sits in the air above her head.

Note for the orchestrator: this commit changes the shared kit `web/kit/cast.js` `speak()`. Non-bright faces now alternate base/`mouth_o` instead of `mouth_small`, and 'surprised' and 'neutral' were removed from BRIGHT. This changes lip-sync in every chapter, not just ch02.
