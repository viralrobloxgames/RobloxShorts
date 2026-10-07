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

## Re-check @ 3830bc67

Automated: clip_check 0 high (same 1 medium nest-blanket contact + 3 low 0.07 box contacts), sight as before (Skye is
discovered, not hiding), cam_check 0/0/0. Seam 909/910 pixel-identical. Previews: whole chapter every 15th frame + N1/N2
ranges and the earlier must frames.

| Must | Verdict |
|---|---|
| N1 horse through Lily's arm (f498-690) | fixed (stick in her fist in front of her, head clear of the arm, through the hold-out and hand-off) |
| N2 Lily's sideways tea arm (c6 R2) | fixed (teapot hangs by her knee in frame in tea_lily_ots; arms slope down in tea_lily_cu) |
| all earlier musts | still fixed |

Shoulds: "Boo" arm now up (fixed). Remaining, not blocking: in tea_skye_cu the skeleton's skull still sits just above
Skye's head in the background; "hand on chest" forearm at chest height (f306-339).

Verdict: OK at 3830bc67.

## Final pass

delivery/chapters/ch05_a.mp4 (f1-909, 909 frames) + ch05_b.mp4 (f910-2019, 1110 frames), both from 3830bc67, 1920x1080 30 fps.
Whole chapter at 2 fps in sheets, must ranges in stills, seam.
- Seam (last frame of A vs first of B): mean abs diff 0.32/255, same shot, same caption ("Neigh. I mean, yes, please."), only a
  lip-sync mouth change. No pop.
- All re-check musts hold in the final encode: attic clear of the skeleton/witch/tea box; horse in Lily's fist in front of her
  (S8-S10) then in Skye's palm; teapot in Lily's hand, low by her knee in her singles; Skye's cup in her palm through
  "More tea, please"; Lily's face reads in the amber light. Captions sit over the right speaker.
- Orchestrator's question, film 4:36 (ch05 f~500-690, lily_ms): checked at full resolution (f600). Lily's right hand holds the
  horse forward; her left arm hangs straight down at her side (sleeve, cuff, forearm down to her hip). It is not an arm
  stuck out sideways, so not R2. No must.
- Shoulds still open (not blocking): skeleton skull just above Skye's head in tea_skye_cu; "hand on chest" forearm at chest height.

FINAL: PASS
