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

## Whole-film character identity (film times)

Method: the whole film sampled every 3 s (4x3 sheets), then a side-by-side grid of Max from every chapter (15 s, 57 s, 141 s,
213 s, 333 s, 468 s, 597 s, 630 s, 676 s). The pattern: **every night or coloured-light scene recolours skin and hair**, and the
lighting is not compensated on the faces. Day scenes (classroom, Sunday kitchen) are correct. The single root-cause fix for most
items below is a **face/skin key light per character** (a small neutral fill on the head, or `MeshBasic`/emissive skin and hair
with a floor on brightness and saturation), so blue moonlight, fridge light, flashlight and attic amber tint the set but not
the cast's identity colours.

### Max
I1. **ch01 0:51-1:00 (night, Max's room), identity: Max in bed reads as a different, dark-skinned boy with blue-black hair.**
    Skin goes to dark brown and the hair turns navy/black under the blue night light. This is the user's 0:57 example, confirmed.
    Fix: a face key light, as above; check the hair stays the brown of the classroom shots. **must**
I2. **ch03 2:21-2:51 (night kitchen, fridge light), identity: the same dark-faced, black-haired Max for 30 s, and the "grey" PJ top reads
    navy.** Fix: a face key light; the fridge light should not drive the face colour. **must**
I3. **ch06 5:30-5:42 and 6:12 (desk mirror, warm lamp), identity and wardrobe: Max has a different, lighter, orange-brown messy hair look,
    and his top reads tan/khaki with orange sleeves.** Next to 0:15 and 10:45 he does not read as the same boy. Fix: a face key light
    plus a neutral fill so the `max_pjs` grey reads grey; confirm the hair mesh is the same as in the other chapters. **must**
I4. **ch10 9:42-9:57 vs 10:03-10:33, identity: Max changes appearance mid-scene.** In the bed shots (9:42-9:57) he has light skin, brown
    side-swept hair and a tan T-shirt. In the wider and over-shoulder shots (10:03-10:33) he has dark brown skin, black spiky hair and
    a navy T-shirt. Same scene, same minute; it reads as two different boys. Fix: a face key light; match the light colour across the
    angles of one scene. **must**
I5. ch08 7:48-7:51 (night bed, on the phone): blue-black hair, but the face stays light enough; fixed by the same key light. **should**
I6. ch02 1:18, 1:27-1:42 (dawn kitchen): Max OK (grey top, brown hair), slightly dark. No action beyond the global fix.

### Skye
I7. **ch01 0:00-0:03 and 0:51 (closet, night), identity: Skye in the closet has a brown face and purple hair.** The cold-open hook is the
    first image of the film, and the girl in it does not match the bright pink-haired Skye the viewer meets at 0:21. Fix: a face key
    light; keep her hair pink (hair saturation floor). **must**
I8. **ch03 3:15 (fridge-light kitchen), identity: the same dark face and purple hair.** **should**
I9. **ch08 8:03-8:30 (attic, flashlight), identity: the top of Skye's head is blown out to a glowing white/lilac.** The flashlight sits
    above her head and bleaches the pink hair. Fix: move the flashlight below chin level (it is a "torch under the chin" scene) or
    clamp the hair's specular/emissive response. **should**
I10. ch06 5:45-6:00 (landing, night): Skye's face is grey-washed and her hair dark magenta; borderline. **should**
I11. ch05, ch07, ch09 (attic amber): Skye stays readable (orange cast but pink hair and white hoodie hold). OK.

### Lily
I12. ch05 4:27-5:24, ch07 6:45-7:09, ch09 8:57-9:12 (attic amber): Lily's face loses all features except the eyes, a flat orange-brown
     disc, and her yellow `lily_day` dress merges with the amber walls. Fix: the face key light; consider a slightly cooler fill in the
     attic so the yellow dress separates from the wood. **should**
I13. ch06 5:51-6:00 (landing, night): Lily is a near-black silhouette at the frame bottom; the face is unreadable. **should**
I14. ch05 4:36: Lily stands inside the skeleton (the ribs overlap her face and body). That is an interpenetration rather than identity;
     it belongs to ch05's critic, flagged here so it is not lost. **must**

### Dad
I15. **ch03 3:03-3:12 and ch06 6:03-6:18, wardrobe: Dad wears a maroon dressing gown with blue-striped trim, which is not on the boundary
     sheet.** His only listed wardrobe is `dad_cardigan` (plus the apron in the kitchen). If the robe is a deliberate night look, it needs
     a kit id and a boundary-sheet line; otherwise use `dad_cardigan`. His hair in these shots reads purple/plum. Fix: register a
     `dad_robe` wardrobe or switch the shots back to the cardigan; a face key light for the hair. **should**
I16. **ch06 6:18, identity: the flashlight held at Dad's chest whites out his face completely** (a white blob with eyes). Fix: aim the
     flashlight forward/down, away from his face. **should**
I17. ch02 1:12-1:33 (dawn kitchen): Dad's dark-brown hair reads red-maroon under the warm pendant lights. **should**
I18. ch11 0:45.8 (`max_cu`): Dad's head sits behind Max's head (see ch11 issue 24).

### Extras
I19. ch01 0:12-0:45, ch02 1:51-2:09, ch04 3:18-4:15: the classroom extras (Noob with a red cap, the blonde girl, the kid in the orange
     beanie, a dark-haired boy) are consistent within the classroom and stay in the same seats across days. OK. One exception:
     **ch04 4:12, identity: a boy seen from behind at Skye's desk row wears a teal hoodie with black spiky hair.** He reads as Max
     with the wrong hair (Max's hair is the dark-brown swoop), or as an extra in Max's hoodie. Fix: if it is Max, use his hair; if it is an
     extra, change the hoodie colour. **should**

## Repeated poses (whole film)

R1. **Arms straight out forward at shoulder height ("zombie arms"), both arms, the default talking pose for every character.**
    Seen at 0:18-0:21 (Max, Skye), 1:39-1:42 (Max), 3:21-3:33 (Max, Skye), 3:42-4:15 (Max, Skye, about 30 s of it), 4:21-4:42 (Skye),
    9:00-9:21 (Skye), 10:00-10:27 (Skye), 10:55-10:58 and 11:15-11:20 (ch11). Once you notice it, it is in almost every MCU, and it is the
    single most robotic thing in the film. Fix: change the default `speak()` idle to arms down (hands at the sides or one hand at
    waist height). Raise a single forearm only on a gesture beat and return it within about 1.5 s. Shots seated at a desk or island
    may rest the forearms flat on the surface, not floating. **must**
R2. **One arm stuck straight out sideways (Lily and Dad).** Lily: 4:51-5:15 in every one of her tea-party singles, and 6:45-7:09. Dad:
    1:12, 1:21-1:24, 6:42-6:57, and ch11 0:13 and 0:29.7 (identical, ch11 issue 16). The arm is horizontal, perpendicular to the body,
    pointing at nothing. Fix: give each line its own gesture (point at a person or object, hand on hip, hold the spatula/teapot at waist
    height), or the arms at rest. **must**
R3. **Two-arms-up / T-pose shapes**, against the house rule: Skye's scarecrow at 6:36-6:39, 6:54-7:18 (arms out horizontal for over 40
    s; the boundary sheet allows shoulder height, but held this long with the skeleton and witch beside her it reads as a T-pose
    model, not a girl pretending); Skye 6:27 (both arms up and out, "Where do I hide?"); Skye 9:03 (arms out wide holding the drawing);
    the ch11 shrug at 0:25. Fix: the scarecrow drops her elbows a little and tilts her head; "Where do I hide?" is a one-arm flail;
    hold the drawing at chest height with the elbows bent. **must**
R4. Max's hand at the back of his head / phone at the ear: 7:48-7:51 and ch11 0:32 Skye: forearm laid over the top of the head. The same
    "arm over the head" rig shape is used for both the phone and the embarrassed rub. Fix: an elbow-down variant (see ch11 issue 18).
    **should**
R5. Face cycling: during lip-sync, the `speak` mouth replaces the emotion every other frame (ch11 issue 21; also 1:57, 3:21-3:33, 5:36-5:42).
    The faces flick between the emotion and a generic smile/"o". Fix: lip-sync on top of the emotion face, not instead of it. **should**

## Musts (identity and poses)
| # | where | issue |
|---|---|---|
| I1 | 0:51-1:00 | Max dark-faced, blue-black hair at night |
| I2 | 2:21-2:51 | Max dark-faced in the fridge light |
| I3 | 5:30-5:42, 6:12 | Max different hair and shirt colour at the desk |
| I4 | 9:42-10:33 | Max changes skin, hair and shirt between angles of one scene |
| I7 | 0:00-0:03, 0:51 | cold-open Skye brown-faced with purple hair |
| I14 | 4:36 | Lily inside the skeleton |
| R1 | whole film | both-arms-forward zombie talking pose everywhere |
| R2 | 1:12-1:24, 4:51-5:15, 6:42-7:09, ch11 | one arm out sideways pointing at nothing |
| R3 | 6:27, 6:36-7:18, 9:03, ch11 0:25 | T-pose / two-arms-up shapes |

Root-cause fixes, in order of payoff: (1) a per-character face/hair key light with colour floors (fixes I1-I13, I16-I17);
(2) a new default `speak()` arm idle (fixes R1 and most of ch11 issues 7, 17 and 22); (3) hard camera cuts with no
interpolation across `camOn` changes (ch11 issue 1, probably present in other chapters too).

## ch11 re-check @ b948ad2f (own previews: `--every 15 --scale 0.5` whole chapter; dense f1-187 every 6, f280-390 every 10, f424-475 every 3, f1650-1725 every 5)

Verdict: **not yet OK. Two musts remain (R-a, R-b)**; everything else passes or is down to a should.

| # | was | now |
|---|---|---|
| 1-3 | camera glide, jump cut, 4 angles and a 180° flip | **fixed**: hard cuts, one framing per line, and Skye's walk to the island is one camera panning with her (f430-475), island-front side |
| 5 | no stair walk | **fixed**: continuous walk down the treads f1-~140, round the newel to the floor, no pop |
| 6 / 15 | Dad not at the stove; spatula comes and goes | **fixed** in the wides (Dad at the back counter/stove, pan in hand at f1276-1321, f1561+). In the `dad_cu` close-ups the hands are out of frame, so no visible props, which is fine |
| 7 | Max points at the camera, Skye missing | **partly**: Max and Skye are now both in frame. But see R-a, and Max is small and half-hidden behind the pancake stack at frame left, with his point barely readable. Fix: re-aim the shot or move the stack. **should** |
| 10 | wide pile-up, floating pancake | **fixed** in the wide: Dad reads above Lily, clear of Max; SAY YES whole |
| 11-12 | arms through each other at the island | **fixed**: stools spaced, no contact (f1081-1186, f1201-1366, f1426-1441) |
| 13 | teddy not in Lily's arms | **teddy fixed** (on her chest), **pose not**: see R-b |
| 14 | plate teleports, arm in counter | **fixed**: the plate rides Max's palm from his spot to Skye's (f1665-1725), with no jump |
| 16 | identical Dad points | **should**: neither point reads in the `dad_cu` (f391-421, f901-931). At most a shoulder block moves at the frame edge. Widen to a MS for those two lines, or accept them as face-only beats |
| 17 | zombie arms, V shrug | **fixed**: arms down on the walk and talk, the shrug is small, the phone is at the ear with the elbow down (f961-1036) |

**R-a ch11 0:09.4-0:12.9 (f282-390), pose, MUST: Skye's "small awkward wave" is both arms held out and down-sideways (an A/T shape) for 3.5 s.**
She stands foreground right with both forearms angled away from her body, like a "ta-da", and holds it for the whole of "Dad, this
is Skye. She's the ghost." Fix: one-arm `wave` (or one hand at her neck); the other arm hangs at her side.

**R-b ch11 0:18.6-0:22.5 (f560-676) and 0:42.4-0:44.0 (f1273-1321), pose, MUST: Lily's "hug" is both arms raised up and out in a V on either side of the teddy.**
Her arms do not touch the bear. It is a two-arms-up shape in a close-up, held about 4 s, against the house rule. On the fridge point (f1276-1321), one arm comes forward as a huge foreground block while the other stays up and out. Fix: `posture(lily,'hug_teddy')`
with the forearms crossed over the bear; on her fridge line, keep one arm on the bear and raise only the pointing arm (and keep it
out of the lens, e.g. pointing across frame toward the fridge side).

Shoulds still open: ch11 issue 24 (Dad's face peeking out beside Max's head in `max_cu`, f1381-1411); the flipped pancake arcs
through the seated two-shot right next to Max's head (f1705-1720) while the pan is out of frame, so it reads as floating. Keep
the flip in the stove shot or the wide.

After R-a and R-b, ch11 is OK from me (no need to re-check the shoulds).
