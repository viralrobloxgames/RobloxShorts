# critic-3: frame-by-frame review, ch05 + ch06 (film 4:18-6:23)

Source: `delivery/chapters/ch05_a.mp4` + `ch05_b.mp4` (2019 frames, split 910), `ch06_a.mp4` + `ch06_b.mp4` (1733 frames,
split 781), joined. Looked at every 10th frame (3 fps) in 2x2 sheets at 960 px, every 4th frame through all movement and
contact (Lily's climb-out, the horse hand-off, the A/B seams) and single full-res frames where something touches.
Times are chapter time `mm:ss.s`, frames are 1-based chapter frames (30 fps); film time = ch05 + 4:18.0, ch06 + 5:26.0.
Severity: **must** = a viewer will notice; **should** = weakens the scene.

## ch05 "The Tea Party" (film 4:18.0-5:26.0)

### Hatch / nest half (S1-S11)

1. **ch05 00:00.0-00:02.9 (f1-87), staging/eyeline. must.** S1: Skye in the foreground reacts `shocked` with her face
   turned screen-left toward the lens, while Lily, the thing she is reacting to, is behind her at the hatch screen-right.
   She is looking away from the intruder for 3 s. Fix: rotate Skye's head ~70 deg toward the hatch (cheek + one eye to
   camera), or move the camera so Lily is in her eyeline.
2. **ch05 00:01.3-00:02.9 and 00:08.3-00:10.0 (f40-87, f250-299), pose/identity. must.** Lily at the hatch: both forearms
   lie flat forward on the floor as two huge orange/yellow wedges either side of her chest, which reads as Lily sitting
   inside an orange crate, not climbing through a hatch. The teddy is sunk into the arm blocks. Fix: elbows on the
   hatch rim at shoulder width, forearms angled in (hands on the rim), teddy hugged to her chest above the rim; lower
   the camera a touch so the hatch hole and ladder read.
3. **ch05 00:05.0-00:06.2 (f149-186), caption/speaker. must.** Lily's "Who are you?" (yellow) plays entirely over the
   Skye MCU; Lily is never on screen for her first line. The plan has S2 on `hatch_mcu`. Fix: cut to Lily at the hatch
   for 4.97-5.97 s, back to Skye for "I'm a ghost".
4. **ch05 00:03.0-00:06.2 (f88-186), animation. should.** Skye is frozen in one `shocked` pose for 3.2 s: no blink,
   no head move, no breathing. Fix: head turn on the cut, one blink, idle sway.
5. **ch05 00:07.0-00:08.2 (f205-245), pose. should.** "Boo": the arm shoots straight at the lens (f211, a giant
   foreground block taking a third of the frame next to her face), then locks rigid and horizontal (f241). No finger
   wiggle, and the other arm flares out ~40 deg at the same time, so it nearly reads as two arms up. Fix: one forearm up
   beside her head, elbow bent, hand at head height wiggling (wrist +/-15 deg at ~4 Hz); other arm stays down.
6. **ch05 00:10.2-00:11.3 (f306-339), pose. should.** "Hand flat on chest" renders as the whole arm horizontal across
   her torso at shoulder height, with the forearm sunk into the torso and backpack strap. Fix: elbow down at her side,
   forearm angled up so only the hand rests on the sternum, 0.1 stud in front of the torso.
7. **ch05 `nest_mcu` (00:03.0-00:11.3, 00:14.0-00:16.5, 00:21.3-00:26.6), camera. should.** A rafter plank cuts across
   the top of frame with a white rounded blob (lamp/bowl) half out of frame above it, right over Skye's head. Fix: tilt
   the camera down / lower it so the plank and blob are out, or remove the plank from this angle.
8. **ch05 00:11.3-00:14.0 (f340-421), walking/interpenetration/staging. must.** S6 Lily's climb-out and walk is
   broken end to end:
   - f343-363: she hovers diagonally in the air beside the hatch, legs splayed, no hand on the rim, no foot on the
     ladder or floor (a float, not a climb).
   - f365-381: she then walks **away** from Skye, back to camera, toward the boxes.
   - f367-375: her body walks straight through the hobby horse leaning on the boxes.
   - f399-421: she turns back and walks into the skeleton prop, and stops standing **inside** it (ribcage, arm and
     stand through her torso). She never gets near `nest_front`, ~4 studs from Skye.
   Fix: real climb (hands on the rim, knee up onto the floor, stand at `hatch_top`, feet on the floor every frame),
   then `travelTo` toward `nest_front` facing Skye on a path that clears the horse and the skeleton (check both
   bounding boxes); stop facing Skye.
9. **ch05 00:14.0-00:16.5 (f422-496), pose/face. should.** S7 "Please, please don't tell": Skye is in full profile
   (one eye) with her arms hanging. The planned `kneel_up` with her hands together at her chest is missing, so the plea
   doesn't read. f423 also opens on a `shocked` face that switches to `happy` 4 frames later. Fix: `kneel_up` with her
   hands clasped at her chest, turned 3/4, `nervous` from the first frame.
10. **ch05 00:16.6-00:24.2 (f498-725), interpenetration. must.** S8/S10 `lily_ms`: Lily's standing mark is inside the
    skeleton prop. For 7.6 s the skeleton's ribcage, arm bone and hand go through her right shoulder and chest, its
    skull floats as a blurry blob above her head, and the witch costume overlaps her left side. Fix: move Lily's mark
    at least 1.5 studs clear of the skeleton and the witch (or move the props), and re-aim `lily_ms` so neither crosses
    her silhouette.
11. **ch05 00:16.6-00:21.2 (f498-640), pose/props. should.** No finger up on "Every day" (planned single-arm gesture).
    The teddy is not in her hand: it sits cut off at the bottom-right frame edge, apparently floating at hip height.
    Fix: teddy in her left hand at her chest, right index finger up on "Every day".
12. **ch05 00:22.4-00:24.2 (f671-725), props/interpenetration. must.** S10 "And you have to be the horse": the
    hobby-horse head first sits embedded in Lily's left arm block (f498-680), then rides on top of her arm with no stick
    gripped in her hand, passing through the witch costume. She holds it out toward the witch, not toward Skye. Fix:
    stick gripped in her right palm, head above her fist and clear of every body, offered across toward Skye (screen
    left/camera side).
13. **ch05 00:21.4-00:22.4 -> 00:24.3 (f641-730), continuity. should.** S9 "Deal": no nod, and the planned backpack
    slip-off isn't shown. The backpack straps simply vanish across the cut at f730. Fix: animate the slip-off in the gap
    after "Deal" (or at least hold the straps until a cut-away and let the backpack land in the nest on screen).
14. **ch05 00:24.3-00:26.6 (f731-800), props/interpenetration. must.** S11 hand-off: an orange blob (the horse head)
    pokes in at the right frame edge for 1.5 s (f731-776), then the horse head appears half inside Skye's forearm and
    chest (f781-800). It never passes from Lily's hand to hers. Fix: frame the hand-off (Lily's fist with the horse
    enters frame right, Skye's right palm closes on the stick), head clear of Skye's body.

### Tea party half (S12-S32)

15. **ch05 every tea wide / two-shot (00:26.9-00:27.5 f807-826, 00:53.0-00:56.0 f1590-1680, 01:05.6-01:07.3 f1968-2019),
    interpenetration. must.** One cause, every wide:
    - The hobby-horse head goes through Skye's left forearm the whole tea party (also visible at the bottom of every
      `tea_skye_ots`).
    - Skye's shin/white shoe pokes into the front face of the tea box.
    - Lily's near forearm is a giant block lying across her body, its far end sunk into the box side (f815).
    - A big yellow toy teddy sits dead centre in the foreground, cut off by the bottom edge (a blob in front of the
      action).
    Fix: horse lying across her lap *below* her forearms (lap-rest pose), Skye's `tea_skye` mark moved 0.5 stud back
    from the box, Lily's forearms down with her hands on the box top or her lap, and `tea_toy_*` moved beside the box,
    not between the lens and the box.
16. **ch05 00:27.5-00:29.3 (f827-878), camera/props. must.** S13 "More tea, horse?" (`tea_lily_ots`): there is no Skye
    shoulder in frame (it isn't an OTS). Lily's forearm is a huge block covering her whole torso in the foreground. The
    teapot floats at bottom-left, cut off by the frame and not in her hand, so there is no pour. Fix: put Skye's
    shoulder/cheek soft at frame left, Lily's teapot in her right hand tipped toward the cup, arm below chin height.
17. **ch05 00:26.9-01:07.3, props (whole tea party). must.** Nobody ever holds the teapot or a cup. Every planned prop
    beat is missing: the pour (S13), "sets the teapot down, picks up her cup" (S15), the cup in both hands on her lap
    (S16), sips (S17, S23), the toast (S20), the pour for herself (S26), "sets the teapot down and picks it back up"
    (S28), the teapot in hand (S30), the cup halfway up (S31). The bodies are frozen with only mouths moving for 40 s.
    The boundary frame (f2019) has Skye's cup hovering beside her fist, not in her palm, and Lily's teapot sitting on the
    box rather than in her hand, so ch07 inherits a broken state. Fix: attach the cup to Skye's right palm and the
    teapot to Lily's right palm (kit-props grip offsets) and animate at least the pour, a sip, the toast and the
    push-out of the cup on "More tea, please".
18. **ch05 00:30.3 (f909 -> f910), continuity pop at the A/B seam. must.** In one continuous `tea_skye_ots` shot the
    teapot appears from nowhere on the box beside Skye's hand and the left cup jumps position, exactly at the segment
    split. Fix: make segment B start from segment A's prop state (or start A with the teapot already there) and
    re-render the shot so it is identical across 909/910.
19. **ch05 00:57.6-00:58.3 (f1731-1751), props pop. must.** In S28 (`tea_lily_ots`) the teapot is absent at f1731-1741
    and pops onto the box by f1751 inside the same shot, with no hand. Its side also flips between set-ups (Skye's side of
    the box in `tea_skye_ots`, Lily's side in the two-shot and `tea_lily_ots`). Fix: one teapot track, in Lily's hand or
    at one fixed spot, the same in every angle.
20. **ch05 `tea_lily_ots` 00:32.0-00:33.6, 00:38.6-00:40.1, 00:45.3-00:49.4, 00:57.6-00:59.4 and `tea_lily_cu` 00:36.6,
    00:41.3-00:42.5, 00:51.3-00:52.8, 01:01.0-01:03.2, pose. must.** Lily holds both arms out horizontally at shoulder
    height (a T-pose read) and stays frozen for up to 4 s. Fix: `kneel` with her hands low (cup in one hand, the other
    on her knee); never both arms at shoulder height.
21. **ch05 `tea_skye_cu` (00:37.6-00:38.6, 00:40.3-00:41.3, 00:49.6-00:51.2, 00:59.6-01:01.0), camera/eyeline. should.**
    Skye stares straight into the lens, and the CU background (round window centred, rocking chair, purple backpack on a
    red cushion) is a different direction from her `tea_skye_ots` background (skeleton, witch, XMAS boxes) for the same
    conversation, so the geography jumps every cut. Fix: re-aim `tea_skye_cu` on the OTS axis, Skye looking screen-right
    toward Lily.
22. **ch05 captions over the wrong speaker. should.** Pink (Skye) captions stay up over Lily's shots for 6-8 frames
    after the cut (approx. frames): "Professionally." ~f1238-1246 (00:41.3), "Because he hates me." f1726-1733 (00:57.6), "What does it
    sound like?" f1827-1834 (01:01.0). Fix: end each caption on the cut (or move the cut to the caption end).
23. **ch05 00:26.9-01:07.3, props/continuity. should.** Lily's own teddy (plan: beside her in every tea shot, and in
    the boundary frame) is not visible anywhere in the tea party; only the foreground toy teddy is. Fix: place
    `tea_teddy` beside Lily, inside the frame of `tea_wide` / `tea_two`.

### ch05 musts

| # | Time (ch05) | Frames | Category | Problem |
|---|---|---|---|---|
| 1 | 00:00.0-00:02.9 | 1-87 | staging | Skye reacts looking away from Lily |
| 2 | 00:01.3-00:10.0 | 40-87, 250-299 | pose | Lily's arms read as an orange crate at the hatch |
| 3 | 00:05.0-00:06.2 | 149-186 | caption/speaker | Lily's first line over Skye's shot |
| 8 | 00:11.3-00:14.0 | 340-421 | walk/clip | Lily floats out of the hatch, walks away from Skye, through the horse, ends inside the skeleton |
| 10 | 00:16.6-00:24.2 | 498-725 | clip | skeleton + witch through Lily for 7.6 s |
| 12 | 00:22.4-00:24.2 | 671-725 | props/clip | horse head in Lily's arm, no grip, offered to the witch |
| 14 | 00:24.3-00:26.6 | 731-800 | props/clip | horse blob at frame edge, head inside Skye's arm |
| 15 | tea wides | 807-826, 1590-1680, 1968-2019 | clip | horse through Skye's arm, shin in the box, Lily's arm in the box, teddy blob |
| 16 | 00:27.5-00:29.3 | 827-878 | camera/props | not an OTS, giant forearm, teapot floating |
| 17 | 00:26.9-01:07.3 | 807-2019 | props | no cup or teapot ever held; boundary state broken |
| 18 | 00:30.3 | 909/910 | continuity | teapot pops in at the A/B seam |
| 19 | 00:57.6-00:58.3 | 1731-1751 | props | teapot pops in mid-shot, flips sides |
| 20 | Lily tea shots | see item | pose | both arms at shoulder height (T-pose) |
