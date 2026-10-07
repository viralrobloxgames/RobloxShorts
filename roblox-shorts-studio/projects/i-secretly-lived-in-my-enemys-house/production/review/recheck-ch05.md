# recheck-ch05

## Re-check @ 733213b9

Automated: clip_check 0 high, 1 medium (Skye Leg.R 0.28 in the nest blanket, 1 frame at 14.0 s: resting contact), 3 low
(Skye Leg.L 0.07 in a small box: contact). Sight: Lily sees Skye 0.2-67.3 s, correct (Skye is discovered in this chapter,
not hiding). cam_check: 0 glides, 0 inside scenery. Previews: whole chapter every 15th frame + every must range at 5-10 fps.

| Must | Verdict |
|---|---|
| c3 #1 Skye looks away from Lily (f1-87) | fixed (head 3/4, pupils on the hatch) |
| c3 #2 Lily's arms as an orange crate at the hatch | fixed (arms down in the hole, teddy on the rim) |
| c3 #3 "Who are you?" over Skye | fixed (on the hatch MCU) |
| c3 #8 float / walk away / through horse / inside skeleton | fixed (climb with knee up, stops at the boxes, ends at the nest facing Skye) |
| c3 #10 + c6 I14 skeleton/witch through Lily | fixed (clear in lily_ms and the hand-off) |
| c3 #12 horse head in Lily's arm (f498-725) | **not fixed** for f498-~690: see N1 |
| c3 #14 hand-off | fixed (horse in Lily's fist, then in Skye's palm, head clear of her arm) |
| c3 #15 tea wides | fixed (horse on her lap clear of the arm, teddy blob gone, shin 0.07 contact only) |
| c3 #16 tea_lily_ots f827-878 | fixed (two-shot with Skye in frame, teapot in Lily's hand) |
| c3 #17 nobody holds teapot/cup | fixed (teapot in Lily's hand throughout, cup in Skye's hand, pours/sip/cup-out; end state good) |
| c3 #18 seam 909/910 | fixed (pixel-identical) |
| c3 #19 teapot pop f1731-1751 | fixed (one teapot track) |
| c3 #20 both arms at shoulder height | fixed (one arm down) |
| c6 R2 Lily arm stuck out sideways in tea singles | **not fixed**: see N2 |
| c6 I12 (should) Lily's face in amber | fixed enough (eyes + mouth read in the CUs) |

New / remaining:
- **N1 frames 498-690, lily_ms, must.** Lily holds the hobby horse in her right fist with the arm hanging, so the stick and
  the horse's neck run up *through* her right arm block; the head pokes out beside her shoulder with its back half inside
  the sleeve for ~6 s. Fix: hold the horse in front of her (stick angled ~30 deg forward/out from the arm, head in front
  of and clear of the arm), or start the `hold_out` from the start of S8; check the head/stick vs her arm box.
- **N2 Lily's tea singles (tea_lily_ots and tea_lily_cu, e.g. f960-1065, 1180-1250, 1726-1751, 1830-1880), must.** Her
  camera-side arm (the teapot arm, `hand_hold` 0.8) reads as a block going straight out sideways at shoulder height off
  the frame edge, hand and teapot never in frame: exactly R2. Fix: in her singles lower that hand to her lap/knee with the
  teapot visible in frame (or reframe so hand + teapot are in shot); elbow bent, upper arm down.
- frames 205-245, Skye's "Boo" arm straight out horizontal at shoulder height (c3 #5), should: forearm up beside her head.
- tea_skye_cu (f~880-910, 1240-1300, ...), the skeleton's skull sits right on top of Skye's head in the background, should:
  shift the camera a touch so the skull clears her head.
- c3 #6 "hand on chest" still reads as a forearm across her chest at shoulder height (f~306-339), should.
