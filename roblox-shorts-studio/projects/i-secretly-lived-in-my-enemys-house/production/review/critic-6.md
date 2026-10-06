# critic-6: ch11 frame-by-frame, whole-film character identity, repeated poses

Source: `delivery/chapters/ch11_a.mp4` + `ch11_b.mp4` (SPLIT 944), 3 fps 2x2 sheets for the whole chapter, then 10 fps and
30 fps strips at every move, cut and hand-off, plus `scdet` cut detection. Times are **chapter-local**
(ch11 0:00 = film 10:40); add 10:40 for the film time. Frame numbers are chapter frames at 30 fps (t x 30 + 1).

## ch11 "No Crusts" (film 10:40-11:50)

### Camera
1. **ch11 0:05.23-0:05.53 (f158-167), camera: the camera flies through the set at the cut into Dad's stove shot.** The cut from
   `stairs_wide` is not a cut: the camera is interpolated from the wide position to `stove_ms` over about 10 frames. On the way it passes
   behind Dad (f158), **inside Dad's head** (f159: a giant face fills the frame), and **inside a grey wall or hood** (f161: the whole
   frame is one flat grey plane), then swings past Lily. Fix: hard-cut the camera on shot changes (no lerp or smoothing across a
   `camOn` change); check every chapter for the same smoothing on cuts. **must**
2. **ch11 0:06.60→0:06.63 (f199→200), camera: a jump cut in the middle of Dad's line.** "Morning, Max! Morning, Lily!" jumps from the
   fridge angle to the pantry-door angle without a cut point. Fix: hold one framing for the whole line, or cut on "Morning..." with Dad's
   head turn. **must**
3. **ch11 0:14.27-0:15.20 (f429-457), camera plus 180° rule: Skye's walk to `island_end` is chopped into 4 angles in 1 s, and the last one crosses the line.**
   Angles change at f429, f438, about f448 and f457. At 0:14.3 the stairs are frame-left and the back door is frame-right. From 0:15.2 the
   stairs are frame-right and the toaster is frame-left, so screen direction flips in the middle of "Sorry about the pancakes". The plan
   says the camera stays on the island-front side. Fix: one `skye_mcu` framing from the island-front side that pans with her walk.
   **must**
4. ch11 0:17.67 (f531), camera: a small reframe pop in the middle of the line (the window appears). Fix: lock the camera. **should**

### Walking and staging
5. **ch11 0:00.67-0:04.67 (f21-141), walking: Skye does not walk down the stairs.** She takes one step (0:00.0-0:00.6) and then stands
   frozen about 4 treads from the bottom for 3.3 s. At 0:04.33 she pops to the foot of the stairs in a crouched, splayed-leg frame. By
   0:04.67 she is huge in the bottom-right corner with her legs cut by the frame, as if she slid toward the camera. The VO says "I
   walked down the stairs like a normal person", so the walk is the beat. Her left arm also sticks out past the banister line
   (0:01-0:04). Fix: `travelTo` `stairs_top→stairs_foot` along the stair path at walk speed over the full 0.0-5.5 s with feet on the
   treads, stopping at `stairs_foot` inside the frame. **must**
6. **ch11 0:00-0:05 (f1-150), staging: Dad is not at the stove.** He stands directly behind Max, faces the camera with his arms forward,
   and his torso overlaps Max's. The spatula sits in the utensil crock (visible at f158). The plan has Dad at the stove flipping, in
   3/4 profile. Fix: place Dad on the `stove` mark facing the pan, spatula in his right hand. **must**
7. **ch11 0:09.37-0:12.9 (f282-387), staging: in "Dad, this is Skye. She's the ghost.", Skye is not in the shot and Max points at the camera.**
   Both of Max's arms are straight out toward the lens. The right arm is a huge foreground block (frame x 600-850 of 960) aimed at the
   viewer, not at Skye. The planned two-shot (Max plus Skye at `stairs_foot`) does not exist. Fix: frame Max and Skye together and
   have Max point one arm, in profile, at Skye; the other arm down. **must**
8. **ch11 0:22.6-0:24.5 (f679-735), staging: "Does your mother know..." is a Dad single, not the planned Dad/Skye two-shot, and the "hand on hip" reads as a broken arm.**
   The arm is a block raised diagonally off the shoulder toward the top-right, with no hip in frame. Fix: a two-shot as planned, or
   frame to the waist so the hand-on-hip reads. **should**
9. ch11 0:27.7-0:29.5 (f832-886): "Max behind her edge of frame, smiling" is missing; a plain Skye single. **should**
10. **ch11 0:52.0-0:57.5 (f1560-1725) and the end screen 0:57.5-1:09.9, staging: the wide is a pile-up.** Dad stands right behind Max and
    Skye at kid height, and his head sits between theirs (a three-head stack). The planned "Dad flips another pancake" at the stove
    becomes a pancake floating between Max's and Dad's heads (0:52.7-0:53.1), with no pan visible. All four characters fit inside about
    a quarter of the frame width, and the end-screen frame darkens it further. Fix: Dad back on the `stove` mark (clear of the stools)
    with the pan visible; space the stools at least one body width apart; frame the wide tighter so the cast fills the left/centre band
    the end screen leaves clear. **must**

### Interpenetration and seating
11. **ch11 0:35.3-0:39.7 (f1060-1191) and 0:47.1-0:48.3 (f1414-1449), interpenetration: Max and Skye sit shoulder-into-shoulder.**
    Max's left forearm block sits in front of Skye's torso and against her right forearm. Max's right forearm crosses in front of
    Lily and the teddy. Fix: move stools 2 and 3 apart (or Skye to stool 4) so their arm boxes do not touch. **must**
12. **ch11 0:39.8-0:45.5 (f1195-1365), interpenetration: in the reverse angle Skye's left forearm crosses Max's forearm and chest.**
    Lily is hidden completely behind Max except for her hair, and the teddy lies on top of Max's forearm. Fix: same stool spacing as
    issue 11; frame Lily in or out on purpose. **must**
13. **ch11 0:18.6-0:22.5 (f560-675) and 0:42.4-0:44.0 (f1273-1320), interpenetration and props: in the Lily CUs, Lily's teddy is not in her arms.**
    The teddy sits against Max's huge foreground forearm, and Lily's right sleeve goes under or through Max's arm to reach it. Max's
    forearm (with a stray dark teardrop decal on it) fills the right third of the frame. Dad's head peeks out between Lily's and Max's
    heads, and Max's face is cut in half by the right edge. Planned: Lily hugging the teddy, lifting her chin, pointing at the fridge.
    None of those gestures happens. Fix: Lily holds the teddy to her chest with both arms (`hold(teddy, lily, 'hug')`); take Max's arm
    out of her CU (reframe or lower his arms); give her a single-arm point at the fridge on 0:42.4. **must**
14. **ch11 0:56.0-0:57.1 (f1681-1714), props: the sandwich plate teleports and Max's arm goes through the island.** Max's arm swings down
    on the left, and its block sinks below the countertop edge (0:56.6-0:57.0). The plate sits under his arm on the left until 0:56.63.
    At 0:56.73 it jumps to Skye's spot in one frame, with no hand on it. The plate is also already in front of Max from 0:35.3, so the
    "slide" pays off nothing. Fix: animate the plate along the island top from `island_plate_2` to `island_plate_3` over 0.8-1 s with
    Max's hand on its rim; clamp the arm above the counter surface; keep the plate off the island (or at Max's elbow) until this beat.
    **must**

### Props and poses
15. **Dad's spatula appears and disappears (prop continuity).** It is missing in 0:05-0:09 (it is in the crock), 0:20-0:27 and
    0:48-0:52. It is present in 0:13.0-0:14.2 and 0:29.7-0:31.6. The plan says the spatula is in his right hand throughout. When he holds
    it, the handle sticks out of the side of the block fist and the blade points down at the floor (0:13.3, 0:30.0). Fix: keep it in his
    hand in every Dad shot, gripped through the palm with the blade up. **must**
16. **ch11 0:13.0-0:14.2 and 0:29.7-0:31.6, repeated pose: "The pancake thief!" and "Phone. Now." are the same frame.** Same
    `dad_cu` framing, same sideways arm held straight out to frame-left at shoulder height, same down-pointing spatula. The arm points at
    neither Skye nor her pocket. Fix: 0:13 points the spatula forward at Skye (toward camera-left, angled, elbow bent); 0:29.7 points at
    the hoodie pocket, then turns back to the pan as planned. **must**
17. **ch11 0:15.2-0:18.5, 0:24.7-0:26.6 and 0:27.7-0:29.6, poses: Skye's arms.** On "Sorry about the pancakes..." both forearms stick out
    level at shoulder height toward the camera for 3.3 s (zombie arms), with no neck rub and no look at the fridge. On "She thinks I'm at
    a sleepover" the "shrug" is **both arms raised up and out in a V**: the house rule forbids two-arms-up. The right arm is also a huge
    foreground block cut by the frame edge. Fix: arms down at rest; one hand to the back of her neck after the walk; the shrug is a
    shoulders-only lift with forearms at hip height. **must**
18. **ch11 0:32.1-0:34.1 (f964-1024), props and pose: the phone is at her temple, and her arm wraps over her head.** The forearm lies on
    top of her hair and the phone stands vertical against her eye/temple. Fix: `hold(phone, skye, 'R', 'ear')`: elbow down, hand at the
    side of the head, phone at the ear line. **should**
19. ch11 0:05.3-0:09.0 and 0:48.4-0:51.8, staging: Dad says "Morning, Max! Morning, Lily!" looking frame-right at the wall with the kids
    behind him, and he flips the pancake while facing the camera with the pan cut off in the bottom-left corner. Fix: turn him toward
    the island on the greetings, and toward the pan on the flip, with the pan inside the frame. **should**
20. ch11 0:05-0:51, every `dad_cu`/`stove_ms`, camera: a red apple from the fruit bowl sits exactly behind Dad's neck and reads as a red
    ear growth. Fix: nudge the camera or move the bowl. **should**
21. ch11 0:08.0-0:09.3 and 0:20.0-0:20.7, faces: "Pumpkin girl?" and "You knew?" play mostly as a smiling talk mouth, not `surprised`
    (the shock face appears only on the last frames). Fix: hold `surprised` as the base face under the lip-sync. **should**
22. ch11 0:35.3-0:39.7, animation: on "Do you want to go? With me?" the two-shot is completely static for 4.4 s. Both kids have both
    forearms straight out on the island, Max does not rub his neck, and Skye holds one "o" mouth throughout. Fix: Max's single-arm neck
    rub on "So."; Skye's `surprised` face reacting on "With me?". **should**
23. ch11 0:39.8-0:42.4: on "Are you asking me, or is the fridge asking me?", the SAY YES fridge is a small blur in the background and
    there is no thumb gesture toward it. Fix: CU with the fridge over her shoulder as planned; one-arm thumb point. **should**
24. ch11 0:45.8-0:46.8 (`max_cu`), identity and staging: Dad's head sits directly behind Max's head, so Max reads as two-headed. Fix:
    move Dad or the camera. **should**
25. ch11 0:31.77 (f954), captions: Skye's reaction shot starts 0.3 s before Dad's caption ends; acceptable as a reaction cut. No fix needed.

### ch11 musts
| # | time (ch11) | issue |
|---|---|---|
| 1 | 0:05.23-0:05.53 | camera lerps through Dad's head and a wall at the cut |
| 2 | 0:06.6 | jump cut mid-line |
| 3 | 0:14.27-0:15.2 | four angles in 1 s, 180° line crossed |
| 5 | 0:00.7-0:04.7 | no walk down the stairs: frozen, then a pop |
| 6 | 0:00-0:05 | Dad behind Max, not at the stove |
| 7 | 0:09.4-0:12.9 | Max points both arms at the camera; Skye missing |
| 10 | 0:52-1:09.9 | wide/end screen pile-up, floating pancake |
| 11-12 | 0:35-0:48 | Max/Skye/Lily arms interpenetrate (stools too close) |
| 13 | 0:18.6-0:22.5, 0:42.4-0:44 | teddy not in Lily's arms; Max's arm fills her CU |
| 14 | 0:56.0-0:57.1 | plate teleports; arm through the counter |
| 15 | whole chapter | spatula appears and disappears |
| 16 | 0:13, 0:29.7 | identical Dad point pose, spatula at the floor |
| 17 | 0:15-0:29.6 | Skye zombie arms; two-arms-up shrug |
