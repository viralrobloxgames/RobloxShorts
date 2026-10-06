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

## Ch06 "The Practice" (THURSDAY 10:15 PM), 1733 frames, 57.8 s

Stitched from main (ch06_a 1-780 + ch06_b 781-1733): seam clean, A/V -0.03 s, -14.3 LUFS. blank_frames: none flagged
by the tool, but see #1. The card, the flashlight-under-chin creep and the mirror rehearsal (0:05.5-0:18.5, Max's
cringe faces on "Ugh. No.") all work; Lily's "You like him." entrance (0:26.4) lands. Behind-door Max is muffled and
~4 dB down (right). Dad runs hot: -10.6 to -12.6 against -14/-17 for the whispers around him (could: -2 dB on lines
13-18). Max's voice: judged once "MAX voice replaced in ch06" lands.

1. **0:44.9-0:45.6 (frames 1347-1369), Skye and Lily dash into the linen closet straight across Dad's flashlight
   beam, in a wide with black bands. MUST.** In the only shot of the escape Dad stands a few metres away facing them,
   flashlight up, and the girls run across the lit floor in front of him: he can't not see them, which breaks the
   scene's logic. The frame also has a black band across the top and a black wedge at the bottom (camera inside the
   ceiling/floor geometry). Fix: Dad turns to Max's door on "Max, was that you?" and the girls slip into the closet
   behind his back; or play the pull as a tight shot at the closet door (Lily's hand yanking Skye in, door closing to
   a gap) and cut back to Dad. Either way, camera fully inside the hallway.
2. **0:31.2-0:33.2 (frames 935-996), "Then why is your face all red?" and Skye's face is out of frame. SHOULD.**
   The shot is on Lily; Skye's head is cut off at the eyes by the top of the frame, so the red face the line asks about
   is never shown. Fix: frame both faces (or cut to Skye on "red") and give Skye a strong blush from 0:31.2 through
   "It's a very dusty attic." (to 0:35.8).
3. **0:52.5-0:54.7 (frames 1576-1642), Dad's cliffhanger line ("I'm checking every single box") plays on the back of
   his head and his raised arm. SHOULD.** The threat that ends the chapter needs his face: a low 3/4 front on Dad,
   broom raised, flashlight pointed up at the hatch (the boundary's end state), face `determined`.
4. **Garlic on Max's window isn't visible in the room shots (0:05.5-0:18.5, 0:47-0:48). SHOULD** (boundary: hung by
   Wednesday, visible in every later shot of his room; Lily's Ch5 line sets it up). The window isn't in frame in either
   set-up; put the window with the garlic string in the 0:11-0:15 angle.
5. **End frame 0:57-0:57.8: Dad's back fills the right of a wide, broom level, girls a few pixels in the gap.
   COULD.** Boundary: Dad facing the hatch, broom raised, flashlight up at it, which also sells "Every box?".

## Ch03 "A Useful Ghost" (TUESDAY 11:52 PM), 2013 frames, 67.1 s

Stitched from main (ch03_a 1-906 + ch03_b 907-2013): seam clean, A/V 0.0, -14.1 LUFS. blank_frames: none. The fridge
spelling (BE NI -> BE NICE -> 2 SKYE) reads beautifully, Skye peeking through the pantry slats behind Max at the reveal
(0:17.9) is the best staging in the block, and Dad's "Who's Skye?" / "Nobody!" lands. Levels even (Max -12 to -14,
whispers -18 to -19.6, offscreen Max -19.4: right). Max's voice: judged once "MAX voice replaced in ch03" lands.

1. **0:37.2-0:38.4 (frames 1117-1153), the crustless sandwich pops onto the plate: nobody makes it and no crust is
   cut. MUST.** At 0:36.5 the plate is empty, at 0:37.5 a finished sandwich sits on it. The crusts-cut sandwich is the
   story's running clue (Ch1 lunch, Ch4 "since this week", Ch10 "Who did you think was making the sandwiches?", the
   last line), and this is the one moment it's made. Fix inside the existing 1.25 s pause, no retime: an insert of
   Max's knife sliding a crust strip off the sandwich on the plate (crust strips left beside it), then the sandwich
   in place for 0:38.4. The gate flagged the knife stroke as hidden; it still is.
2. **0:45.3-0:49.6 (frames 1359-1488), "Max made the ghost a sandwich" with no sandwich in sight. SHOULD.** Skye
   picks it up at 0:44.5, then it's gone: hands at her sides, plate empty. Hold it up at her chin (the Ch3 end needs it
   in her hand anyway).
3. **Max's face is half in a hard shadow band through the fridge scene (0:12.5-0:37, frames 376-1110). SHOULD.**
   It reads at full size but on a phone his "o" on "Be nice to Skye?" and the flustered "Who even is Skye? I mean, I
   know who Skye is" (0:30-0:37, the twist's best plant in this chapter) are mush. The script has the fridge open as
   the key light: open the door for his read and let it light his face 3/4.
4. **1:00.0-1:01.0 (frames 1801-1830), Skye's reaction CU behind the island is underlit** (same dark-brown face as
   Ch1 #3 / Ch2 #5). SHOULD.

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
