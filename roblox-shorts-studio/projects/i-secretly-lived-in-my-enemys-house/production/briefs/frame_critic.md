# Frame critic brief: physical plausibility, staging and animation, frame by frame

The user watched the finished cut and found many problems the earlier reviewers missed (they looked at framing, faces,
story and sound on sparse low-res frames). Your job is different: go through your chapters **densely, frame by frame**,
and list every moment that makes no physical or story sense or is poorly animated. Be harsh: anything a viewer could
notice is a must. You made none of this video.

## What the user found in the first 2 minutes (calibrate on these; there are more)
- 0:00-0:03 hook: Skye is "hiding" in Max's closet, but Max faces the closet and could plainly see her. A hidden
  character must be out of the other character's line of sight (behind the door, in shadow, he looks away).
- 0:15 Max stands *inside* a desk; 0:45 Max walks through desks; 1:53 Max sits *inside* his desk.
- 0:25 Skye's "Spider!" pose: both arms flung up/out like a T (the house rule is no two-arms-up poses) and the spider is
  on the desk, not on her.
- 0:34 Max's hand/prop goes through Skye's body or the desk.
- 0:45 extreme close-up with a blob in frame and the face cut.
- 0:57 the boy in bed reads as a different character (dark face, different hair) under the night light.
- 1:18 Max walks through the staircase banister; 1:19 Lily overlaps Dad's body, and the shot shows Dad and Lily while
  the caption is Max's line ("Dad, something was in my room").
- 1:40 bodies overlapping the counter; 1:45 Skye crawls across the open kitchen floor in full view of the family
  (she is supposed to be secret); her arm passes through the island.
- 1:47 a giant block hand covers Skye's face and the pancake floats.

## Checklist (every frame you look at)
1. **Interpenetration**: bodies, limbs, heads or props passing through furniture (desks, chairs, tables, island,
   stairs, banister, bed, doors, walls, ladder, boxes) or through another character.
2. **Sitting / standing / lying**: seated characters must sit ON a seat (hips on the seat, legs in front, not sunk into
   or floating above it); standing feet on the floor; nobody inside a desk or bed frame.
3. **Walking**: real walks along clear paths (around furniture, up stairs on the steps), feet not sliding, no
   teleports between cuts unless motivated.
4. **Staging logic**: secrets stay secret (Skye unseen by whoever must not see her: out of their line of sight, behind
   something, in shadow); people look at what they react to; the speaker is on screen or the cut motivates it.
5. **Props**: held in the palm (not floating, not inside the hand/face), the right size, consistent hand.
6. **Poses / animation**: no T-poses, no two-arms-up, no broken or robotic limbs, no huge foreground limbs blocking
   faces, gestures readable and natural, no jitter or pops between consecutive frames.
7. **Character identity**: everyone recognisable in every light (Max, Skye, Lily, Dad, extras); same hair, skin and
   clothes as their wardrobe for that scene.
8. **Camera**: no camera inside geometry, no faces cut by the frame edge in key moments, no unexplained blobs in frame,
   readable composition.
9. **Captions**: the colour matches who is speaking, and that person is on screen (or the cut is motivated).

## How to look
- Get the chapter video: `delivery/chapters/chNN_a.mp4` + `chNN_b.mp4` from main (or join the film parts in
  `delivery/`, see its README). Chapter start times in the film: `delivery/youtube_chapters.txt`.
- Extract frames at **at least 3 fps** at 960 px wide and look at them in **2x2 sheets** (big enough to see clipping),
  e.g. `ffmpeg -i ch01_a.mp4 -vf "fps=3,scale=960:-1,drawtext=text='%{pts\:hms}':x=12:y=12:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=2x2" sheets/a_%03d.png`
  (segment B timestamps start at SPLIT, see `production/status/chNN.md`). Go to 6-10 fps or single full-res frames
  wherever there is movement, a sit-down, a hand-off or contact between characters and furniture.
- Script and continuity for context: `script.txt`, `source/boundary_sheet.md` (skim only what you need).
- An automated clipping report may appear at `production/review/clip_check/chNN.json` (kit-pipeline is building
  `web/clip_check.mjs`); use it as a second pair of eyes, not a replacement for looking.

## Output
Write `production/review/critic-N.md`, one section per chapter, pushed as soon as each chapter is done (fixers start
immediately). Every issue: `chNN mm:ss.s-mm:ss.s (frames a-b), category, what is wrong, the concrete fix, must|should`.
Group issues that share a cause (e.g. "the classroom desk seat is too low for the sit pose: every seated shot"). End
with a table of musts. Then set `production/status/critic-N.md` to `STATUS: DONE`. Never post anything.
