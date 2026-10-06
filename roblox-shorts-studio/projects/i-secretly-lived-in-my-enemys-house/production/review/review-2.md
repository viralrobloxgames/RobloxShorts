# review-2: chapters 7-11 + whole-film checks

Reviewer: review-2 (fresh; made none of it). Each chapter is reviewed from its own stitch
(`stitch_longform.py --chapters N-N --no-split`), so **times are mm:ss from the start of that chapter**
(add the chapter's start in the film; the film-time column gets filled in at the global pass).
Severity: **must** = a viewer notices or the story weakens; **should** = clearly better; **could** = polish.
Frame = chapter frame at 30 fps (time x 30 + 1).

## Ch08 "The Worst" (FRIDAY 9:30 PM), 58.05 s, 1742 frames, reviewed 15:2xZ

Lands overall: the phone misunderstanding is clear, "Skye is the worst..." gets a beat before the cut to her face,
the attic two-hander reads well and the voices are consistent. Audio: lines -16 to -18 dB RMS, whispers 2-4 dB under,
Max's phone lines (still the old `max_kid` voice; judged again once `max_boy` lands per requests.md) correctly band-limited (centroid ~1.2-1.4 kHz vs 2.5 kHz dry), 0.25 s gaps, bed under speech
-40 to -47 dB, no clicks that matter. Stitch: loudness -14.05 LUFS, but true peak **-0.85 dBTP** (target -1.0), see global.

1. **00:10.0-00:10.4 (frames 300-312), must.** Skye bends to slide the note and the camera ends up inside her: the
   back of her hair and her arm fill the frame, with the edge of the head cut open. A blocked frame a viewer sees.
   Fix: hold the 00:06-00:09 over-shoulder framing through the bend, or pull the camera back ~1.5 studs / raise it
   so it clears her head while she crouches; re-render frames 295-330.
2. **00:21.0-00:21.3 (frames 631-640), must.** The cut into the attic opens on an empty shot: dark floorboards and the
   vacuum, nobody in frame, with "THE WORST. RIGHT. GOT IT." still on screen (blank_frames flags 00:21.0). Then Lily
   pops up very low in frame (00:22-00:23, the top of her head cut by nothing but the frame bottom showing only head
   and shoulders). Fix: open the attic on the wide that is currently at 00:24 (round window, nest, Skye in her
   flashlight pool, Lily coming off the ladder), then cut in to Lily for "What happened? Did he see you?". If the
   ladder shot stays, Lily must already be in frame on its first frame. Re-render frames 631-720.
3. **00:52.5-00:54.4 (frames 1576-1633), must.** The chapter's payoff is "Then why are you crying?" but Skye is not
   crying when Lily says it: at 00:52 ("Yes, I do.") her face is the open-mouth `shocked`, and the camera is on Lily
   for the whole line; the tears only appear at 00:57, in the last half-second. The viewer has to see the tears
   before or as Lily calls them out. Fix: give Skye `crying` (tears) from "Yes, I do." (00:51.8) and cut to her close-up
   for the second half of Lily's line (from ~00:53.6), then the wide for "It's dusty..." with `crying` held to the
   end (boundary sheet: Ch8 ends `crying`). Re-render frames 1555-1742.
4. **00:11.0-00:17.7 (frames 331-532), should.** Max "on the phone" shows no phone: his hand is cupped at his ear with
   nothing in it at 640 px and barely anything at 1080p. This scene is the whole misunderstanding; the phone has to
   read. He is also `surprised` (o-mouth) for "Skye? Ask Skye to the dance?" where the script says he's smiling.
   Fix: put the `phone` prop in his hand (`hold()`), face `happy` from 00:11; re-render frames 331-532.
5. **00:00-00:20 and 00:34-00:58, should.** The folded note is never clearly readable: not in her hand in the hallway
   close-ups (00:06-00:10), no visible crumple at 00:18 (script: "The note crumples in her fist"), and in the attic
   the crumpled note lies on the rug by the flashlight instead of being in her hand (boundary sheet). Fix: note in
   her right hand at 00:04-00:10, a crumple close insert or hand-in-frame at 00:18.0-00:18.5, the crumpled note in her
   hand in the attic wides (00:34-00:41, 00:55-00:58).
6. **00:25-00:49 (attic close-ups of Skye), should.** The flashlight standing on end blows out the top of her hair
   into a white-violet hotspot and a bright rim along her shoulders; it looks like a render error at phone size.
   Fix: lower that light's intensity ~40% or move it below her chin line; re-render frames 750-1500 (close-up shots only).

## Package: thumbnail, title, description (first pass, before the full stitch)

**Thumbnail pick: A "HE NEVER KNEW"** (`I_Secretly_Lived_In_My_Enemys_House_thumbnail.jpg`), not D "I LIVED IN HIS
HOUSE! 7 DAYS" (`thumbnail_variants/D_...`; that is the older `thumbnail.jpg` draft). Why:
- D at phone width (~360 px) is dark and muddy, Max is a half-lit head cut off at the right edge, Skye is small in a
  yellow wash; and its text just repeats the title word for word. A is brighter, has two readable faces and adds
  something the title doesn't have.
- **"HE NEVER KNEW" helps the twist.** It's the narrator's own belief: it echoes the first line ("...and he had no idea")
  and the description ("He had no idea... right?"), and Ch10 shows it was wrong. That's a promise the film keeps by
  overturning it, not clickbait: viewers who reach "Same as in my closet on Monday" get the joke on the thumbnail.
  A "...?" is not needed; the flat statement is the stronger hook.
- B "7 DAYS HIDING" is a fine backup but a weaker curiosity gap. C's red circle is on her *face*, which is redundant.

Fixes to A:
7. **Package, should.** Max's face in A is a flat neutral looking past her, and it's the weakest face in the frame.
   Give him a small sideways smirk with his eyes toward Skye (`smug`/side-eye). It reads as "he totally sees her"
   at a glance, which plants the twist and rewards a re-watch. Keep Skye's `shocked`.
8. **Package, should.** At phone size Skye's face is ~45 px tall. Crop in ~15% toward the two of them (lose the
   left-hand louvres) so both faces are at least 60 px at 360 px width; keep the text block where it is.
9. **Package, could.** If C is kept as an A/B test variant, move the red circle from her face to **the lock of pink hair
   sticking out between the hoodies**: that's the actual clue from Ch1/Ch10, so the circle becomes a plant too.

Description and settings:
10. **Package, must (at the global pass).** The chapter list in `_post.md`/`post.json` is still the estimate (0:00,
    1:04, ... 10:53). Replace it with `delivery/youtube_chapters.txt` from the full stitch; checked again below.
11. **Package, could.** Settings say "altered content: No". Fine for an animated Roblox story, but Skye is voiced by a
    voice clone (`brittney`): if that voice is cloned from a real, identifiable person rather than a stock voice, the
    user should decide that box before posting.

## Ch09 "The Drawing" (SATURDAY 2:20 PM), 59.73 s, 1792 frames, reviewed 18:3xZ

What works: the drawing reveal is set up and paid off, "He kept it. All this time." gets a proper close-up with a
sad turn at 00:37, and "Yes." (00:53, the angry face) and "You're both so dumb." land. Dad's offscreen lines are
correctly quieter and muffled (-23 dB RMS vs -17, centroid ~1.1 kHz). Stitch: -14.12 LUFS, TP -0.91 dBTP;
`ok: false` only because the audio ends 0.067 s (2 frames) before the video (see global).

12. **00:25.0-00:30.9 and 00:39.0-00:45.9 (frames 751-928, 1171-1378), must.** The drawing reads **"BEST FRIENDS."**,
    spelled right, and Skye's next line is "He spelled friends wrong." The joke dies, and anyone reading the prop
    on screen gets a contradiction. Fix the drawing texture in `props.js` to **"BEST FRENDS"** (script, story.md,
    boundary sheet), and re-render every frame where the drawing is visible: the ranges above plus the box insert
    at 00:25.
13. **00:26.0-00:30.9 and 00:39.0-00:45.9, should** (same frames as 12, so do it in the same re-render). Skye holds the
    drawing flat against her stomach, so it reads as a print on her hoodie, not a paper she's holding and looking at.
    Hold it up in both hands at chest-to-chin height and angle it slightly toward camera; in the 00:28-00:30 insert,
    show the edges of the paper and her fingers on it.
14. **00:48.6-00:50.0 (frames 1459-1500), should.** The scripted beat "[+1.2 Skye looks at the drawing for a long
    moment, puts it back gently on top]" is a top-down shot of two hands over a box with the paper out of view,
    so the chapter's quietest moment shows no face and no drawing. Use her close-up looking down (face `sad`, soft
    smile at the end) with the drawing in frame, then the hands laying it on top.
15. **00:06.1-00:11.3 (frames 184-339), should.** "Step one, eye holes" plays on a close-up with no sheet and no scissors
    in frame. She is holding glow sticks. The boundary sheet's opening has the bedsheet across her lap with the
    scissors cutting. Frame the close-up wider so the sheet and scissors are in the bottom third, or put the scissors in
    her right hand.
16. **00:58.2-00:59.7 (frames 1747-1792), could.** Lily's "Ghost!" is delivered with a calm smile toward camera; the
    boundary sheet has her facing the hatch, face `shouting`. A quick turn toward the hatch would sell the cover-up.
17. **00:46.7-00:48.6, could.** "It was a really good sandcastle" has strong sibilance (centroid 3.7 kHz vs ~2.5 kHz for
    her other lines; sharp transients in the source clip at 47.55-47.8). A light de-ess on that clip would help.
