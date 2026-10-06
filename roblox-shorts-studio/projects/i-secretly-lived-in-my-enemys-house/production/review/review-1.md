# review-1: final review, chapters 1-6

Fresh reviewer (made none of it). Each chapter stitched alone from main (`stitch_longform.py --chapters N-N --no-split`)
and reviewed from frames at 2-6 fps (contact sheets), per-line loudness from the stitched mix against `lines.json`,
`scripts/review/blank_frames.py`, and the script / boundary sheet.

**Timestamps are chapter time (mm:ss from the chapter's first frame)**, with the chapter frame (30 fps, 1-based) for
every must so fixes can be re-rendered by range. Severity: **must** = a viewer notices it or it weakens the story;
**should** = clearly better, do it if the frames are being re-rendered anyway; **could** = polish.

Sections are pushed one chapter at a time as segments land; the flow pass over the whole block comes last.

---

## Ch04 "Cinnamon" (WEDNESDAY 12:15 PM), 1833 frames, 61.1 s

Stitched from main 15:05Z (ch04_a + ch04_b, commit 32dbd17): seam at frame 825 clean, A/V diff 0.0, -14.2 LUFS
integrated. blank_frames: no runs flagged. Lines measure -12.7 to -16.4 LUFS-ish in the mix (even), the closing whisper
-19 (right for a whisper), music bed ~-38 under the gaps (well under speech), tail 0.83 s of room tone. Captions:
VO pink italic, Skye pink, Max teal, all inside the lower band, never over a face. The card (0:00-0:02) is clean.

What works: the cookie two-shot under "Max was being nice" sells the VO; Max's frown on "Why is there a cobweb" (0:30.5)
and Skye's blush CU on the closing whisper (0:55.5 on) land the chapter's turn.

1. **0:54.8-0:55.3 (frames 1645-1660), the half-sandwich handover is three cuts in half a second. MUST.**
   At 0:54.83 the camera jumps to a new low two-shot (~10 frames), at 0:55.17 to a shot from behind Max (~5 frames: his
   back fills the left half), at 0:55.33 to the end shot. The one action the script gives this beat ("Skye takes half")
   reads as a flicker, and the 5-frame shot is the back-of-head frame the hard rules forbid.
   Fix: hold ONE angle from "Want half?" through the take: keep the 0:52.5 two-shot (or the 0:54.83 one) until her hand
   closes on the half and Max turns away (~0:55.4), then cut once to the end shot. Drop the behind-Max shot entirely.
   Re-render 1640-1680.
2. **0:55.3-0:55.9 (frames 1660-1677), Max is back in his seat in ~0.5 s.** From the aisle at 0:55.33 he is seated
   at 0:55.83: at walk speed that's a slide/teleport in the background of the end shot. SHOULD. Fix: either start the
   end shot after he is seated (simplest, pairs with #1), or let him walk the full distance with `travelTo` and sit
   during the first second of the whisper.
3. **The cobweb doesn't read in Skye's front close-ups. SHOULD.** It's on the back/left of her hair: clear in the
   over-shoulder shots (0:11.5, 0:19, 0:29) and the lean-in two-shot (0:30-0:33), but in her own CU it's a few faint
   white lines (0:10.5, 0:17, 0:33.4 "It's fashion.", 0:41, 0:50). "It's fashion." is the joke's punchline and the
   cobweb should be in that frame. Fix: in the "It's fashion." CU (0:33.4-0:34.4, frames 1003-1033) cheat Skye 3/4 so
   her left side is to camera (or nudge the cobweb forward to the front-left of the hair so it reads at CU everywhere).
   The VO's "I hadn't brushed my hair since Monday" also has nothing messy to point at: the hair is the same neat cap
   as Ch1; a second cobweb strand or a stray tuft would sell it (could).
4. **Every gap is exactly 0.25 s, so the jokes don't breathe. COULD** (an audio retime moves every later frame, so
   only if ch04 re-renders B anyway). Punchlines that want a 0.4-0.5 s beat before them: "Did you lick it?" (0:13.8),
   "It's fashion." (0:33.4), "With cinnamon?" (0:39.8), "Since this week." (0:52.6).
5. **Coverage repeats.** The same Skye front MCU is used eight times (0:10.5, 0:13.5, 0:17, 0:27, 0:33.5, 0:37.5,
   0:41, 0:50) and the same Max/Skye two-shot five times; the 60 s chapter is a 6-angle loop. COULD: on the
   cinnamon run (0:34.4-0:43.8) push in a little on each exchange (MCU -> CU -> tighter CU) so the interrogation
   escalates instead of repeating.
