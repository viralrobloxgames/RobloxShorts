# critic-7: frame-by-frame review, ch02 "Twelve Pancakes" (film 1:03.7-2:10.5)

How I looked: joined `ch02_a.mp4` + `ch02_b.mp4` (2006 frames), 3 fps 2x2 sheets over the whole chapter, then 10 fps
(every 3rd frame) 3x3 sheets over every move, sit, contact and hand-off (ladder f1-107, hall f106-147, stairs/run
f120-260, Max+Lily entrance f380-486, steal f860-936, crawl f1210-1300, exterior f1283-1416, Max sit-up f1825-1900,
Skye's exit f1880-2006), 6-12 frame steps over the dialogue shots, plus a scene-cut scan. `fN` = 1-based chapter frame;
film time = 1:03.7 + (N-1)/30 s. Cuts at f86 138 262 345 357 427 487 557 718 765 801 874 900 903 927 1006 1034 1106 1217
1220 1235 1283 1420 1486 1586 1661 1753 1833 1856 1897. Cross-checked with `production/review/clip_check/ch02.json`.
Kit ids per requests.md 23:25Z (K1-K4, P1, P2, PR1, SC1, SC2): tagged items still listed; the chapter fix is what the
"fix" column says the chapter itself must change.

## A. Kitchen secrecy: Skye is in plain sight of the family (the user's 1:45; four more instances)

Shared cause: the family's marks (Max stool 4, Lily stool 3, Dad at the island end / stove) all face the **camera side**
of the island, which is exactly where `island_hide`, the steal reach and the crawl path are. Nobody is ever given a
reason to look away. Fix once for the whole scene: Skye's moves happen only while every family member's head is turned
away (a motivated look: Dad's spooky waggle, Dad pointing up at the cupboard, Dad turning to the stove) **and** below
the island top on the side away from them; P4 (line-of-sight check) when it lands.

| # | time (frames) | what is wrong | fix | |
|---|---|---|---|---|
| A1 | 1:10.9-1:11.5 (f217-245) | Skye runs from the stair foot across the open floor to the island while Dad, at the back counter, is turned **3/4 toward camera, i.e. toward her** (f220-226 his face is on her). | Dad stays facing the stove/backsplash (`stove_turned`, back to the room) from f142 until Skye is crouched (f246); he turns round only on "Good morning, kitchen!". | must |
| A2 | 1:32.9-1:33.6 (f876-897), steal | Skye's arm and the pancake come up **above the counter** right in front of Lily, who is behind the island looking straight at camera = at Skye; Max beside her. The stolen pancake is in their eyeline for 0.7 s. | Move the steal under Dad's "Or it's a ghost!" waggle (f765-800): Max and Lily turn their heads to Dad (camera-left), and the steal cam shows their heads turned away. Keep the hand low: the pancake slides off the stack edge into her palm *below* the counter top, only fingers above the edge. | must |
| A3 | 1:34.5 (f921-925) | In Dad's MS "Hang on, I made twelve" Skye's pink hair is in frame at the island corner, ~1 stud from Dad, inside his view cone. | Skye stays at `island_hide` (mid-island, far from Dad's counting end) and the `dad_count` cam is re-aimed so she is out of frame; Dad must not stand at the hide-side end. | must |
| A4 | 1:44.8-1:46.3 (f1235-1280), crawl (user 1:45) | Skye crawls out from the island onto **open floor in full view**: Max, Lily and Dad are all at the island facing her and the camera (f1238-1259 their faces look straight over her). She also crawls **during** Dad's line, before any distraction. | Re-time the crawl to start on "...the syrup's in the **cupboard**": Dad points up/behind to a cupboard on the stove wall, Max and Lily turn on their stools to look at it (heads away from the hide side) and hold that look until she is out. Path: along the island's hide side tight to the cabinet face, then the shortest dash to `back_door_crawl` behind the family's backs. Cam: show their turned heads in the background so the escape reads as *motivated*. | must |
| A5 | 1:19.9-1:21.9 (f487-553) | Max delivers "Dad, something was in my room... it said my name" **facing the camera/Skye side with his back to Dad**, who is behind him at the counter. People look at who they talk to. | Max and Lily sit side-on (stools turned toward the stove end), Dad turns from the stove to face them; Max's 3/4 face toward Dad, camera from the hide side low. | must |

## B. Interpenetration and paths

| # | time (frames) | what is wrong | fix | |
|---|---|---|---|---|
| B1 | 1:18.0-1:18.4 (f429-445) **user** | Max comes down the stairs and steps **sideways through the banister and balusters** (f435-441 the hand rail cuts across his chest); clip_check f437-449 Max x stair stringer/wall, f441 x tread. | `stairsGait` must end at the **stair foot** (`stairs_bottom`, on the treads to the last step), then `travel` round the newel post to the stool. The current `travel(stairs_bottom -> behind-stool)` line leaves the stair laterally. Add a waypoint 1 stud out from the newel. **SC2** (kit paths) + chapter waypoint. | must |
| B2 | 1:18.7-1:19.6 (f450-479) **user** | **Lily walks out of Max's body**: she starts 0.7 s behind him on the same path at a faster speed (skip 9 vs shuffle 7), catches him and is inside him for ~1 s (f450-462 she emerges from his torso; clip_check 431-469: Lily x Max torso 86% cover, head, arms, legs). Then her body into the island (f467-471). | Lily starts **>=2.0 s** after Max and at his speed (or slower), and on her own lane 1.5 studs to the side; she enters frame only after Max has cleared the stair foot. | must |
| B3 | 1:18.0-1:19.9 (f429-486) **user** "shot does not show the speaker" | The caption is Max's ("Dad, something was in my room") but: Max reads as a dark-skinned adult under the predawn light (users took him for Dad), Lily's body covers his, and at f480-486 the camera is so close his head drops to the bottom edge with Lily's head cut. | Hold Max clearly 3/4 to camera, Lily separated (B2), framing MS wide enough that both heads stay inside the frame through f486. Identity: **P1**. | must |
| B4 | 1:19.9-1:22.0, 1:30.5-1:33.0, 1:37.3-1:44.0 (f487-553, f805-873, f1006-1211) **user 1:40 "bodies overlapping the counter"** | Max (stool 4) and Lily (stool 3) are on **adjacent stools too close for two bodies**: Lily's shoulder/arm is inside Max's arm the whole time they sit (clip_check f907-925 and f1035-1211: Lily x Max arm 65-75% cover); Lily's teddy arm and Max's forearm sink into the island top (f469-479 Max x top, 0.66). | Use stools **2 and 4** (one empty stool between) or shift Lily's seat 1.2 studs; forearms rest **on** the counter top (K1 seated variant), not into it. | must |
| B5 | 1:08.4-1:09.7 (f143-183) | Skye's feet go **through the stair treads** while descending (clip_check Leg x tread boxes 0.4-0.5 deep). | Feet on the treads (stairsGait step heights = tread tops). **SC2**. | must |
| B6 | 1:10.3-1:11.0 (f199-221) | Skye's right arm goes into the side wall/stair stringer while she freezes at the stair foot (clip_check 0.6-0.67). | Freeze mark 1 stud further from the wall. | should |
| B7 | 1:11.4-1:11.5 (f233-241) and 1:44.8 (f1235-1247) | Skye's arm through the island cabinet when she ducks in and again at the crawl start (clip_check 59% / 48% cover). | Crouch mark 0.6 stud off the cabinet face; crawl starts already clear of it. | must |
| B8 | 1:08.3-1:10.9, 1:19.9-1:22.0 (f139-219, f487-553) | Dad's left arm/hand is inside the stove top and the pan (clip_check 0.48-0.68). | Dad's stove mark 0.5 stud back; the pan sits on the burner with his hand on the handle. **PR1** for the grip. | should |
| B9 | 1:06.6-1:07.0 (f88-100) | After climbing down, Skye stands **inside the ladder** (the rails pass through her torso) before walking off. | She steps off backward from the bottom rung, then walks round the ladder side. | must |
| B10 | 1:51.0-2:05.0 (f1421-1855) **user 1:53** | Max slumped at his desk has his arms and torso **through the desk top** (clip_check Max x desk top 1.05 deep, every frame of the classroom). | **SC1** (seat/desk geometry); chapter: slump = forearms crossed on the desk top, head on forearms, hips on the seat. Recheck after SC1. | must |

## C. Props

| # | time (frames) | what is wrong | fix | |
|---|---|---|---|---|
| C1 | 1:46.4-1:50.8 (f1283-1416) **user 1:47** | Exterior CU: Skye's right forearm is a **giant block covering half her face** and the pancake is a flat decal floating on the side of the block, not in her hand; she never bites it ("bites on Ever" in the plan). | Frame MS (waist up), not MCU; pancake held in the palm at chin height **beside** the face (not between face and camera), one bite on "Ever". **PR1** + **K1**. | must |
| C2 | 1:33.5-1:33.6 (f891-897) | The stolen pancake slides off and **floats** beside her hand, then pops into the hand. | Parent it to the hand the frame it leaves the stack (PR1), slide distance short. | must |
| C3 | 1:44.8-1:46.3 (f1235-1280) | The crawl pancake hangs in the air in front of her face, not in her mouth. | `mouth` hold offset: edge between the lips. PR1. | should |
| C4 | 1:12.4-1:16.8, 1:22.3-1:28.7 (f263-341, f559-715) | Dad's spatula sticks out of the bottom of a fist-block and the pan floats at the edge of his other hand. | PR1 grip. | should |
| C5 | 1:34.6-1:37.0 (f927-1001) | Dad is "counting the stack with the spatula", but the stack is **not in his shot** and the spatula lies flat on the counter under his hand. | Re-aim `dad_count` so the stack is in frame and the spatula tip points at it. | should |

## D. Poses and animation (kit-tagged)

| # | time (frames) | what is wrong | fix / kit | |
|---|---|---|---|---|
| D1 | 1:10.3-1:10.7 (f199-214) | Skye's "freeze on six": **both arms flung out** (T/two-arm). | **K3** one-arm. | must |
| D2 | throughout Dad's MS (f263-341, f559-715, f769-800, f903-1001, f1220-1232) | Dad's arm(s) **straight forward like a zombie** for whole lines; "Or it's a ghost!" is the same forward arm, not a spooky waggle. | **K1**; chapter: one waggle gesture on "ghost", arm back down. | must |
| D3 | 1:30.5-1:33.0 (f805-873), 1:52.6-1:56.0 (f1486-1585), 2:05.5-2:06.6 (f1858-1894) | **Face cycling during lip-sync**: Max smiles on "Not funny", on "My house is haunted / It knows my name" and on "How do you know that?". Skye's faces cycle too (f347-426, f1596-1830). | **K4**. Chapter: base emotions per plan (annoyed / scared / suspicious). | must |
| D4 | 1:03.7-1:05.4 (f1-52) | On the ladder Skye **faces outward** (back to the rungs) and her forearm block covers her face for ~1 s (f1-25). | Body toward the ladder, head turned over the shoulder (plan), hands on the rails. | should |
| D5 | 1:05.4-1:06.5 (f55-85) | She climbs down out of the bottom of frame; for ~1 s only the top of her hair bobs at the bottom edge under the caption. | Cut to the hall angle when her feet reach the floor (f55), or tilt down with her. | should |
| D6 | 1:45.5-1:46.3 (f1256-1280) | The crawl reads as a stiff plank sliding: torso block upright, legs fixed straight back, feet/knees slide. | Distance-driven alternating hands/knees, torso near horizontal, hips higher than shoulders. | should |
| D7 | 1:36.9-1:44.0 (f1034-1211) | Plan says Max turns to Lily and Lily bounces; Max looks off camera-right (not at her), and the "turn" is not visible. | Max head/torso 3/4 toward Lily on his line. | should |

## E. Camera, cuts and captions

| # | time (frames) | what is wrong | fix | |
|---|---|---|---|---|
| E1 | 1:33.6 (f900-902) and 1:44.2 (f1217-1219) | **3-frame flash shots**: a Dad MS pops for 0.1 s before the real Dad shot (f903, f1220). Reads as a glitch. | Remove: the `dad_count` / `dad_syrup` entries start where the previous shot ends; check shot `at()` ordering (the `steal` shot ends before `at(9)-0.1`). **P2** if it is the camera lerp. | must |
| E2 | 1:19.9-1:22.0 (f487-553) | Unexplained **pink blob** (Skye's hair, out of focus) in the bottom-left corner and a huge pancake stack filling the left third; Max's face small. | Either a proper OTS on Skye (her head readable, 1/4 frame) or drop her from frame; stack smaller in frame. | should |
| E3 | 1:27.7-1:29.2 (f721-763) | Lily's MCU: Dad's yellow arm block and pan swing into the left of frame next to her head; her teddy half cut. | Dad's arm stays down during Lily's line (K1), cam angle off his arc. | must |
| E4 | 1:55.6-2:04.8 (f1596-1830) | OTS on Skye: Max's head fills a quarter of the frame, cut by the edge, with his lip-sync face moving in the foreground. | Smaller OTS (shoulder + back of hair edge) or clean MCU. | should |
| E5 | 1:46.4-1:47.0 (f1283-1301) | Dad's "The syrup's in the cupboard." caption plays over Skye **already outside** — she would have needed 0.3 s to get out. | Follows from A4 (crawl after the line); cut outside after she reaches the door. | must |

## F. Identity (P1)

- F1 1:18.0-1:19.9 (f429-486): Max in the predawn kitchen reads as a dark-skinned man with flat dark hair (the user took
  him for Dad). **P1**. Chapter: keep him lit by the warm island practical in his entrance shot. must.
- F2 1:25-1:44 kitchen MS/MCU: Max's kitchen hair (side-swept, lighter) differs from his classroom hair in the same
  chapter; confirm one hairstyle for Max all chapter (`max_pjs` should not swap hair). should.

## G. Merged from critic-1's ch02 section (verified against my frames; added or upgraded)

critic-1 had reviewed ch02 before the split (`critic-1.md` ch02, 14 musts). Every item there matches what I see. The
ones my sections above missed or rated lower are listed here. The ch02 session works from this file alone.

| # | time (frames) | what is wrong | fix | |
|---|---|---|---|---|
| G1 (c1#2) | 1:20.1-1:21.9 (f495-545) | Upgrades E2: the pink blob is **Skye's hair above the counter line**, and Max looks straight down the lens at it. Secrecy, not just composition. | Skye sits on the floor with her head below the counter line, or reframe without her. | must |
| G2 (c1#3) | 1:32.8-1:33.8 (f875-904) | In the steal Skye is **standing**, head at counter height, and her right forearm rises into the island's side panel/countertop edge (f884-895). | Kneel below the counter line; hand over the edge and on top of the counter (with A2/C2). | must |
| G3 (c1#6) | 1:04.9-1:06.2 (f36-75) | Upgrades D4: she descends **beside** the ladder in mid-air, sinking straight down like an elevator with no rung or rail contact. | Centre her on the rungs, alternate hand and foot contacts per rung, face 3/4 with the arm off it. | must |
| G4 (c1#7) | 1:08.5-1:10.6 (f145-215) | On the stairs Skye walks on the banister line (the handrail passes through her hips, f150) with **airplane arms** the whole way, and her shoulder is inside the wall at the foot (f180). Adds to B5/B6/D1. | On the treads 25 cm inside the rail, one hand on the rail and the other arm low; end the descent in a crouch. | must |
| G5 (c1#10) | 1:20-1:44 (f495-555, f725-760, f805-870, f1015-1215) | In every island two-shot **Max's left arm is held vertically beside his face like a wall** (broken pose), and Lily's shoulder is buried in it. Adds to B4. | Max's arms down on the counter (elbows on top) or folded; Lily's arms around the teddy; seats further apart (B4). K1 for the default. | must |
| G6 (c1#11) | 1:34.8-1:37.2 (f935-1005) | Upgrades C5: Dad's fist sinks into the countertop corner, with the spatula lying flat "in" the buried fist. | Hand on top of the counter, spatula held above it and pointing at the stack. | must |
| G7 (c1#14) | 1:51.2-2:09.2 (f1425-1490, f1845-1965) | Skye's right forearm **passes through the blue chair back** in the classroom two-shot foreground. | Her hand rests on Max's desk top (the plan's lean), or move the chair. | must |
| G8 (c1#15) | 2:05.2-2:10.6 (f1845-2006) | Max's blue chair stands on the camera side of his desk while he sits behind it with nothing under him; when she leaves, Skye's hip brushes the desk edges. | Chair under Max (SC1); Skye walks the middle of the aisle. | should |
| G9 (c1#17) | 1:12-1:44 kitchen | Lily's and Skye's faces render dark brown in the dim kitchen and don't match their other scenes. | **P1**; warm face fill at the island. | should |
| G10 (c1#18) | 1:12.0-1:12.5 (f245-260) | Skye "sits" against the island with her legs straight out and her hips floating. | Hips on the floor, knees up. | should |
| G11 (c1#21) | 1:53.5-2:01.4 (f1495-1720) | Skye's face is cut in half by the right frame edge in every Max CU. | Reframe so she is out of frame or clearly in it. | should |

## ch02 musts

| id | time | fix owner | one-line fix |
|---|---|---|---|
| A1 | 1:10.9-1:11.5 | ch02 | Dad faces the stove while Skye runs to the island |
| A2 | 1:32.9-1:33.6 | ch02 | steal during Dad's waggle, family looking at Dad, hand below the counter top |
| A3 | 1:34.5 | ch02 | Skye out of Dad's counting shot and view |
| A4 | 1:44.8-1:46.3 | ch02 (+P4) | crawl after "cupboard", family turned to the cupboard, path tight to the island then behind them |
| A5 | 1:19.9-1:22.0 | ch02 | Max talks to Dad facing him, Dad turned from the stove |
| B1 | 1:18.0-1:18.4 | ch02 + SC2 | stairs path ends at the stair foot, waypoint round the newel, no banister crossing |
| B2 | 1:18.7-1:19.6 | ch02 | Lily 2 s behind Max, same speed, own lane: never inside him |
| B3 | 1:18.0-1:19.9 | ch02 + P1 | speaker Max readable, both heads in frame |
| B4 | 1:19.9-1:44.0 | ch02 | stools 2 and 4 (not 3 and 4), forearms on the counter top |
| B5 | 1:08.4-1:09.7 | SC2 | Skye's feet on the stair treads |
| B7 | 1:11.4, 1:44.8 | ch02 | crouch/crawl marks clear of the island cabinet |
| B9 | 1:06.6-1:07.0 | ch02 | Skye steps off the ladder, not standing inside it |
| B10 | 1:51.0-2:05.0 | SC1 + ch02 | Max seated on the seat, forearms on top of the desk, nothing through it |
| C1 | 1:46.4-1:50.8 | ch02 + PR1/K1 | exterior MS, pancake in the palm beside the face, bite on "Ever" |
| C2 | 1:33.5 | PR1 | stolen pancake in the hand, no float |
| D1 | 1:10.3 | K3 | one-arm freeze |
| D2 | Dad MS throughout | K1 + ch02 | no zombie arms; one waggle on "ghost" |
| D3 | f805-873, f1486-1585, f1858-1894 | K4 + ch02 | no smiling on Max's scared/suspicious lines |
| E1 | 1:33.6, 1:44.2 | ch02 (P2?) | remove the two 3-frame flash shots |
| E3 | 1:27.7-1:29.2 | ch02 + K1 | no Dad arm/pan swinging through Lily's MCU |
| E5 | 1:46.4 | ch02 | Skye outside only after Dad's line and the crawl |
| F1 | 1:18.0-1:19.9 | P1 | Max recognisable in the predawn kitchen |
| G1 | 1:20.1-1:21.9 | ch02 | Skye's head below the counter line, not in Max's eyeline |
| G2 | 1:32.8-1:33.8 | ch02 | kneel for the steal, arm over the counter edge, not into the panel |
| G3 | 1:04.9-1:06.2 | ch02 | ladder descent on the rungs with hand/foot contacts |
| G4 | 1:08.5-1:10.6 | ch02 + SC2/K3 | on the treads inside the rail, no airplane arms, not inside the wall |
| G5 | 1:20-1:44 | ch02 + K1 | no vertical "wall" arm on Max, Lily not inside it |
| G6 | 1:34.8-1:37.2 | ch02 | Dad's hand on top of the counter, not in it |
| G7 | 1:51-2:09 | ch02 | Skye's arm not through the chair back |
