# review-2: chapters 7-11 + whole-film checks

Reviewer: review-2 (fresh; made none of it). Each chapter is reviewed from its own stitch
(`stitch_longform.py --chapters N-N --no-split`), so **times are mm:ss from the start of that chapter**
(add the chapter's start in the film; the film-time column gets filled in at the global pass).
Severity: **must** = a viewer notices or the story weakens; **should** = clearly better; **could** = polish.
Frame = chapter frame at 30 fps (time x 30 + 1).

## Ch08 "The Worst" (FRIDAY 9:30 PM), 58.05 s, 1742 frames, reviewed 15:2xZ

Lands overall: the phone misunderstanding is clear, "Skye is the worst..." gets a beat before the cut to her face,
the attic two-hander reads well and the voices are consistent. Audio: lines -16 to -18 dB RMS, whispers 2-4 dB under,
Max's phone lines correctly band-limited (centroid ~1.2-1.4 kHz vs 2.5 kHz dry), 0.25 s gaps, bed under speech
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
