# review-1: final review, chapters 1-6

Fresh reviewer (made none of it). Each chapter stitched alone from main (`stitch_longform.py --chapters N-N --no-split`)
and reviewed from frames at 2-6 fps (contact sheets), per-line loudness from the stitched mix against `lines.json`,
`scripts/review/blank_frames.py`, and the script / boundary sheet.

**Timestamps are chapter time (mm:ss from the chapter's first frame)**, with the chapter frame (30 fps, 1-based) for
every must so fixes can be re-rendered by range. Severity: **must** = a viewer notices it or it weakens the story;
**should** = clearly better, do it if the frames are being re-rendered anyway; **could** = polish.

Sections are pushed one chapter at a time as segments land; the flow pass over the whole block comes last.

---

## Ch01 "The Dare" (MONDAY 9:47 PM), 1911 frames, 63.7 s

Stitched from main 15:20Z (ch01_a 1-860 + ch01_b 861-1911): seam clean, A/V 0.0, -14.1 LUFS. blank_frames: none.
Hook checks pass: VO and caption from frame 0, MONDAY 9:47 PM stamp, both faces in frame 0, CU by 1 s, red circle at
2.5 s, Max's door at ~7 s (the script's 4 s was the plan; 7 s is fine because the circle beat fills it). MONDAY
12:15 PM stamp on the classroom (0:12.2). Max's sly smile on "Huh. Just hoodies." (0:09.5-0:09.9) is exactly the
right tell. Spider drop insert (0:24.5) reads well. Levels even (-12.8 to -15.5) except Lily (#4).

1. **0:07.6-0:08.1 (frames 229-244), the twist's first clue is a pink blob on a grey wall. MUST.**
   The insert after the door opens shows a flat grey surface with a pink shape, no hoodies and no flashlight beam, for
   0.5 s. This is the clue Ch10 pays off ("Same as in my closet on Monday") and the reason the twist plays fair; right
   now nobody will remember it, and nobody can tell it's hair. Fix inside the existing 1.25 s action pause (frames
   212-249, no retime): door swings open over ~0.3 s, then a ~0.9 s insert of two hanging hoodies (different colours)
   with the lock of pink hair poking out between them, Max's flashlight circle sweeping across and STOPPING on the
   pink. Same framing logic as the wide at 0:09.97, where the open closet with hoodies does read.
2. **0:25.3-0:27.3 (frames 761-818), Skye shrieks "Spider! Get it off!" with a calm face, then a smile. MUST.**
   Her mouth is a small "o" and at 0:25.8 and 0:26.2-0:27.0 it's a smile. This beat is what makes "You're scared of
   everything" true and sets up the whole dare. Fix: face `scared` (or `shocked`) for the whole line, and a recoil away
   from the spider (lean back, `shock` arms at shoulder height, never both arms up).
3. **The closet CUs are underlit: Skye's face reads as a dark-brown mask. SHOULD.** 0:01-0:04.5 (the hook's CU, under
   the red circle), 0:10.5-0:12.2 ("That was way too close") and 0:52.5-0:54.5 ("Maaax"). On a phone her skin reads as
   a different colour from the daytime Skye, and in the hook the left hand over her mouth is a big flat brown block
   filling ~40% of the CU. Fix: a soft warm fill on her face from Max's flashlight side (or a moon rim) so the skin
   stays peach-in-shadow, and bring the hand down/in so it covers only the mouth (frames 31-136, 323-366, 1576-1636).
4. **0:57.3-0:59.4, Lily's offscreen line is ~8 dB under the lines around it. SHOULD (audio only).** "I am in bed!
   And you're too loud!" measures about -21.6 against -13.9 / -12.8 for Max either side; on a phone speaker it drops
   out, and it's a joke. Keep the muffling, raise it ~4 dB so it sits ~4 dB under Max.
5. **0:45.0-0:47.1 (frames 1351-1413), "See you tomorrow, scaredy-cat." plays on a wide where no face reads.
   SHOULD.** The taunt that closes the dare (and the word the whole week answers) is delivered by a 40-px Max walking
   away. Fix: Max turning back over his shoulder in MS/MCU for the line, or Skye's narrowed-eyes reaction to it.
6. **1:00.7-1:01.2 (frames 1822-1836), Max smiles on "Then who said my name?". SHOULD.** The one deliberate tell is
   the "Just hoodies" smile; here he should be properly scared (he yanks the blanket over his head a beat later), or
   the twist gets given away in chapter one. Face `scared` from 0:59.6 to the yank.
7. **VO "And this morning, he started a war" over a MONDAY 12:15 PM stamp. COULD.** Morning vs lunchtime (the stamp is
   right per the script). Fix, audio only: retake that VO line as "And today, he started a war" (same length).

## Ch02 "Twelve Pancakes" (TUESDAY 6:04 AM), 2006 frames, 66.9 s

Stitched from main (ch02_a 1-903 + ch02_b 904-2006): seam clean, A/V -0.03 s, -14.0 LUFS. blank_frames: none.
Card clean over the ladder shot; hallway -> kitchen wide reads (Skye on the stairs, Dad at the stove); pancake steal
from her side (0:29-0:30) and the pancake-stack foreground (0:17) are good; classroom end matches the boundary (Max
upright, Skye walking off with one arm up). Levels even (-12.6 to -15.4, whispers -18/-19). Dad's voice is right.
Max's voice: judged once "MAX voice replaced in ch02" lands (orchestrator).

1. **0:14.2-0:16.2 (frames 427-487), Max's entrance is four cuts in two seconds, starting with a 5-frame flash.
   MUST.** 0:14.20 a Max CU for ~5 frames (smiling, on "Dad, something was in my room"), 0:14.37 Max at the foot of
   the stairs, 0:14.87 Max behind the island as Lily walks in, 0:16.03 Dad's yellow arm wipes across the lens, 0:16.2
   the three-shot. It reads as a glitch and the smile contradicts "I didn't sleep at all". Fix: drop the 0:14.2 CU;
   one shot of Max shuffling in from the stairs (face `tired`/`nervous`, not smiling) held to ~0:15.5, Lily enters in
   it, then the three-shot. Keep Dad's arm out of the lens.
2. **0:42.5-0:47.1 (frames 1276-1414), "Best. Pancake. Ever." is a 4.6 s frozen frame. SHOULD.** Skye at the back
   door with the pancake lying on her flat hand block, which covers the lower half of her face; nothing moves, no
   bite on "Ever" (the gate asked for one). Fix: pancake up at her chin with her face clear, a bite on "Ever"
   (~0:46.6), and a small push-in or her stepping out of the door during the hold.
3. **0:36.9-0:40.4 (frames 1108-1211), Lily's face is hidden for "Ghost, ghost, ghost, ghost." SHOULD.** She's
   turned to Max with her head down; we get hair and a cheek. It's her funniest line and her deadpan is the joke.
   Cheat her 3/4 to camera (face `smug`), Max's annoyed face behind her.
4. **1:01.8-1:03.0 (frames 1855-1891), Max smiles on "How do you know that?". SHOULD.** Boundary says `suspicious`,
   and a grin here tips the twist (he already knows). Face `suspicious` through the line.
5. **0:11.5-0:14.0 (frames 346-420), Skye's whisper CU behind the island is underlit** (dark-brown face, same as
   Ch1 #3). SHOULD: warm fill from the kitchen lights so her skin matches daytime Skye.

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
