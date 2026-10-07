# recheck-ch10

## Re-check @ 7a5e5f4f

Automated: clip_check 0 high, 0 medium, 1 low (Max Arm.L 3% into the headboard at 62.4-65.1 s, resting contact, OK);
sight: Max sees Skye 0-65 s (expected: she is the ghost / unmasked in his room, never hiding). cam_check: 0 glides,
0 inside scenery. Visual: every 30th frame of the chapter + 4-10 fps around each must (scale 0.5).

| Must | Result |
|---|---|
| critic-5 #21 one Max, no teleport | fixed: grey tee, brown swept hair, light skin, at the headboard in every shot (MCU, wide, OTS, last shot); 880/886 cut is clean |
| critic-5 #22 sunk in mattress | fixed: torso upright at the headboard, hips on the mattress, duvet over the legs |
| critic-5 #23 bed edge / nightstand contact | fixed: Max never leaves the headboard; Skye's hand stays clear of him |
| critic-5 #24 plate blinks | fixed: plate in every bed shot f271-871, on his lap in the wides and the last shot |
| critic-5 #27 two-arms-up shrug | fixed: one-hand palm-up (f1520-1570) |
| critic-5 #28 straight-arms poses | both-arms-forward gone, but see new must below (one arm straight out sideways) |
| critic-5 #31 ghost glide / jump | fixed: smooth approach f1-61 in front of the chair, no jump |
| critic-6 I4 Max identity | fixed: same skin/hair/shirt across all angles, faces readable under the lamp (warm on Max) |

Skye: glow sticks on the wrists, no both-arms-spread pose anywhere; faces readable.

New:
- frames ~930-984, wide two-shot ("straightening a pumpkin", `armSide(a,'R',2.0...)` in ch10.js:190): Max's arm goes
  straight out sideways above shoulder height for ~1.8 s, holding nothing; in the wide it reads as half a T-pose /
  the critic-6 R2 "arm out sideways" the user rejected. Fix: upper arm ~45-60 deg out and forward, elbow bent ~90,
  hand at head height turning an imaginary pumpkin (small wrist/forearm wiggle). **must**
- f991-1065, 1321-1651 (Skye MCU): her phone arm is still a blown-out white block at lower left (critic-5 #33). should
- Max MCU (f1081-1291, 1681-1771): both forearms are big blocks toward the lens (critic-5 #29). should

## Re-check @ 1a5199f3

Automated: clip_check 0 high, 0 medium, 1 low (same resting contact, Max Arm.L on the headboard 62.4-65.1 s);
sight as before (expected); cam_check 0 glides, 0 inside scenery. Visual: every 30th frame + 920-990 every 4th.

| Must | Result |
|---|---|
| f930-984 pumpkin mime arm out sideways | fixed: one arm forward at head height, ~35 deg out, small wiggle; reads as a mime, not a T-pose |
| all earlier musts (#21-24, #27, #28, #31, I4) | still fixed; no regression from the kit change (cast.js) |

Glow sticks now read as glowing bracelets wrapped round both forearms (f121-541), no floating sticks. Skye's lowered arm
is in front of her body in the wides, no spread. Shoulds #29/#33 left as is (accepted).
New: none.

## Gesture-snap scan @ 1a5199f3 (segment B, delivery/chapters/ch10_b.mp4)

Mean |f - f-1| at 480 px, cuts excluded, every spike looked at as a frame pair. Caption on/off and face-texture
swaps (f977, f985, f1075, ...) are fine. Snaps (one-frame jumps inside a shot, all from step on/off code):

| Frames | What | Code | Verdict |
|---|---|---|---|
| f1274->1275 | Max MCU: head snaps down/turns in one frame ("eyes down, blushing") | ch10.js:192 `headTurn(a,0,0.18)` on a hard window; its end at T.comesDown+0.2 snaps back too | **must**: ease in/out over ~6 frames |
| f1460->1461 | Skye MCU: phone arm jumps from low to raised forward in one frame ("Because a fridge told you to") | ch10.js:140 `armFwd(a,'R',-1.45,0.05)` on a hard window | **must**: ease over ~6 frames |
| f1512->1513 | same arm drops back down in one frame | ch10.js:140 window end | **must**: ease over ~6 frames |
| (T.pink edges) | ch10.js:193 `headTurn(a,0,-0.1)` is the same hard step; ease it too | ch10.js:193 | **must** (same pattern) |

Segment A (1-880) scan is running from a 0.25-scale render at 1a5199f3; result to follow.

## Re-check @ 1b11aa8b (snap fixes; kit filter K cancelled)

snap_check: 0 high (4 low: f36 leg 29 deg / root 0.31 at the eased waypoint, glow band f36/f717, not visible as jumps).
clip_check 0 high, 0 medium, 1 low (same headboard rest); sight as before; cam_check 0/0/0.
Full-res looks at the former snap points (f2-45 walk, f722-724 sheet lift, f1272-1278 head dip, f1458-1464 fridge
point up, f1510-1516 down): every move now eases over several frames; no one-frame jumps. All earlier musts still fixed.
Verdict: OK.

## Final pass (delivery/chapters/ch10_a.mp4 + ch10_b.mp4)

Both final-ch10-a/b DONE at COMMIT 1b11aa8b; both .json carry the same render code 22352066fb72; ch10.js unchanged since
1b11aa8b. seam_check 881-1956 (4 workers, preroll 300): cold and pre-rolled differ on 0 frames at every start. The 880|881
split falls on a cut (Max MCU -> wide two-shot), same Max, no pop. 1 fps contact sheet of the whole chapter: one Max
throughout, plate continuous, glow bands on Skye's wrists, no spread/T poses, captions present, door insert and end OK.
Verdict: FINAL: PASS.
