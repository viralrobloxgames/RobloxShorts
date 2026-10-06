# Clipping check (web/clip_check.mjs)

Automated: every 2nd frame of each chapter posed as for a render (no drawing); each visible body part (head, torso, arms, legs; boxes shrunk 0.14 studs so resting contact does not count) tested against visible solid scenery and the other characters (exact box overlap). Only clipping the camera can see is listed (in frame, not hidden behind scenery). Resting on a top (seat, desk, mattress, step) up to 0.45 studs is not counted. Severity: **high** = visible penetration >= 0.6 studs, or >= 0.4 with >= 15% of the part inside; **medium** = >= 0.25 or >= 15%; low otherwise. Film times from delivery/stitch_report.json. Per chapter: chNN.json (`summary` = grouped findings, `ranges` = per body part).

Re-run after a fix: `node web/clip_check.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js --out projects/i-secretly-lived-in-my-enemys-house/production/review/clip_check/chNN.json` (from roblox-shorts-studio/, ~15 s). Some actor-actor hits are intended contact (a hug, a carry, holding hands): judge those on the picture.

## Acceptance (the user's examples)

| User | Found |
|---|---|
| 0:15 Max standing in desks | ch01 0:12.2-0:16 Max torso through a chair back (box 1.9x1.5x0.2), arms in a desk top |
| 0:45 Max walking through desks | ch01 0:43.5-0:47 Max torso/arms in desk tops (box 3.6x0.2x2.3) |
| 1:18 Max through the banister | ch02 1:18.3 Max in the newel post (0.4x4.2x0.4), balusters and steps |
| 1:19 Lily overlapping "Dad" (it is Max, grey T-shirt) | ch02 1:18.0-1:19 Lily inside Max (86% of her torso), high |
| 1:45 arms through the island | ch02 1:44.8 Skye arm in the island (box 10.4x3.0x2.6), high |
| 1:53 Max sitting inside his desk | ch02 1:51-2:05 Max torso/arms in the desk top |

## Totals

| Chapter | high | medium | low |
|---|---|---|---|
| ch01 | 23 | 72 | 66 |
| ch02 | 41 | 59 | 34 |
| ch03 | 25 | 56 | 19 |
| ch04 | 16 | 59 | 72 |
| ch05 | 6 | 7 | 28 |
| ch06 | 27 | 46 | 32 |
| ch07 | 34 | 40 | 33 |
| ch08 | 14 | 20 | 7 |
| ch09 | 2 | 7 | 32 |
| ch10 | 10 | 9 | 1 |
| ch11 | 31 | 99 | 95 |
| all | 229 | 474 | 419 |

## ch01 (23 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 0:37.0 | 37.0-38.1s | max | Arm.R | skye.Arm.L | 0.85 | 56% |
| 0:37.0 | 37.0-38.0s | skye | Arm.L | max.Arm.R | 0.87 | 52% |
| 0:00.0 | 0.0-0.9s | max | Leg.R,Leg.L | box 5.4x2.0x0.3 @set_bedroom(-4.0,1.0,-1.8) | 0.83 | 41% |
| 0:25.3 | 25.3-36.9s | skye | Torso | box 1.9x1.5x0.2 @set_classroom(-13.0,2.8,1.9) | 1.04 | 19% |
| 0:25.3 | 25.3-39.1s | skye | Arm.L | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.95 | 14% |
| 0:43.7 | 43.7-47.1s | skye | Arm.L | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.95 | 14% |
| 0:17.0 | 17.0-21.6s | max | Arm.R | box 1.3x0.7x0.6 @world(1188.0,3.4,-0.9) | 0.73 | 19% |
| 0:12.2 | 12.2-16.2s | max | Torso | box 1.9x1.5x0.2 @set_classroom(-5.0,2.8,1.9) | 0.72 | 10% |
| 0:27.1 | 27.1-45.2s | max | Arm.R | box 1.3x0.7x0.6 @world(1188.0,3.4,-0.9) | 0.63 | 16% |
| 0:29.9 | 29.9-40.4s | max | Arm.R | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.69 | 11% |
| 0:24.5 | 24.5-25.4s | max | Arm.R | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.69 | 11% |
| 0:43.5 | 43.5-44.4s | max | Arm.R | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.69 | 11% |
| 0:46.3 | 46.3-46.6s | max | Arm.L,Torso | box 3.6x0.2x2.3 @set_classroom(3.0,3.0,-7.0) | 0.93 | 14% |
| 0:07.6 | 7.6-8.1s | skye | Head | box 2.2x2.7x0.6 @set_bedroom(-14.4,5.1,3.6) | 0.46 | 33% |
| 0:45.5 | 45.5-45.8s | max | Torso,Arm.R | box 3.6x0.2x2.3 @set_classroom(-5.0,3.0,-1.0) | 0.87 | 14% |
| ... 8 more high in ch01.json | | | | | | |

## ch02 (41 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 1:18.0 | 14.3-15.5s | lily | Torso,Head,Arm.R | max.Torso | 0.95 | 86% |
| 1:38.2 | 34.5-40.3s | lily | Arm.L,Torso | max.Arm.R | 0.88 | 65% |
| 1:18.2 | 14.5-15.6s | lily | Arm.L,Torso,Head,Arm.R | max.Arm.L | 0.78 | 75% |
| 1:18.1 | 14.4-15.6s | lily | Leg.R,Leg.L,Torso,Arm.R | max.Leg.L | 0.67 | 67% |
| 1:33.9 | 30.2-30.6s | lily | Arm.L,Torso,Leg.L | max.Arm.R | 0.8 | 75% |
| 1:18.0 | 14.3-15.5s | max | Torso,Leg.L,Arm.L,Leg.R,Arm.R | lily.Torso | 0.81 | 38% |
| 1:38.2 | 34.5-40.3s | max | Arm.R,Leg.R | lily.Arm.L | 0.89 | 30% |
| 1:51.0 | 47.3-61.8s | max | Arm.L,Torso,Arm.R | box 3.6x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 1.05 | 14% |
| 1:18.0 | 14.3-15.6s | max | Arm.L,Arm.R | lily.Arm.L | 0.73 | 33% |
| 1:18.1 | 14.4-15.4s | max | Torso,Arm.R,Leg.R,Leg.L,Arm.L | lily.Arm.R | 0.91 | 17% |
| 1:33.9 | 30.2-30.8s | max | Arm.R,Torso | lily.Arm.L | 0.75 | 35% |
| 1:18.0 | 14.3-15.3s | lily | Leg.R,Torso,Arm.R | max.Leg.R | 0.43 | 57% |
| 1:18.0 | 14.3-15.5s | max | Torso,Head,Arm.L,Arm.R | lily.Head | 0.7 | 19% |
| 1:18.2 | 14.5-15.6s | max | Leg.L,Leg.R | lily.Leg.R | 0.63 | 24% |
| 1:18.2 | 14.5-14.9s | max | Torso,Arm.R,Head,Leg.R,Leg.L | box 0.3x12.0x14.0 @set_kitchen(11.8,6.0,-5.0) | 0.82 | 29% |
| ... 26 more high in ch02.json | | | | | | |

## ch03 (25 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 3:00.2 | 49.7-50.3s | skye | Arm.L | box 10.4x3.0x2.6 @set_kitchen(0.0,1.8,0.4) | 0.96 | 57% |
| 3:00.6 | 50.0-51.7s | dad | Torso,Arm.R,Head,Leg.L | box 0.3x12.0x14.0 @set_kitchen(11.8,6.0,-5.0) | 0.95 | 29% |
| 3:00.3 | 49.7-50.1s | dad | Arm.L,Leg.R,Leg.L,Arm.R | box 5.0x0.3x11.0 @set_kitchen(14.0,12.1,-7.0) | 1.11 | 29% |
| 3:00.6 | 50.0-50.3s | dad | Torso,Head,Arm.R | box 5.0x0.3x11.0 @set_kitchen(14.0,12.1,-7.0) | 1.05 | 29% |
| 2:20.8 | 10.2-10.5s | max | Torso,Leg.R,Arm.R,Head,Leg.L | box 0.3x12.0x14.0 @set_kitchen(11.8,6.0,-5.0) | 1.02 | 33% |
| 3:00.9 | 50.3-51.5s | dad | Torso,Arm.R,Head | box 0.3x11.4x12.2 @set_kitchen(12.2,8.9,-4.0) | 0.88 | 5% |
| 3:00.6 | 50.0-51.1s | dad | Arm.L,Arm.R | wall_right box 0.5x12.0x16.0 @set_kitchen(16.3,6.0,-4.0) | 0.54 | 33% |
| 3:00.6 | 50.0-50.4s | skye | Arm.L | box 11.0x0.3x3.9 @set_kitchen(0.0,3.5,-0.1) | 0.94 | 16% |
| 3:01.3 | 50.7-51.6s | dad | Arm.R,Leg.L | box 4.1x0.1x0.9 @set_kitchen(14.0,3.8,-1.6) | 0.65 | 6% |
| 3:01.8 | 51.2-51.4s | dad | Leg.R,Leg.L | box 4.0x0.8x0.8 @set_kitchen(14.0,1.1,0.8) | 0.89 | 22% |
| 2:20.8 | 10.2-10.3s | max | Arm.R,Torso | box 4.0x0.8x0.8 @set_kitchen(14.0,2.6,-0.8) | 0.79 | 29% |
| 3:01.8 | 51.3-51.4s | dad | Leg.R,Leg.L | box 4.1x0.1x0.9 @set_kitchen(14.0,1.5,0.8) | 0.82 | 11% |
| 2:20.8 | 10.3-10.4s | max | Arm.R | box 4.0x0.8x0.8 @set_kitchen(14.0,3.4,-1.6) | 0.67 | 21% |
| 3:01.7 | 51.1-51.4s | dad | Leg.R,Leg.L | box 4.1x0.1x0.9 @set_kitchen(14.0,0.8,1.6) | 0.64 | 8% |
| 3:00.6 | 50.0-50.1s | dad | Leg.R | box 4.0x0.8x0.8 @set_kitchen(14.0,9.4,-8.0) | 0.68 | 19% |
| ... 10 more high in ch03.json | | | | | | |

## ch04 (16 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 4:13.2 | 55.5-61.1s | max | Arm.L,Arm.R,Torso | box 3.6x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 0.81 | 14% |
| 3:18.4 | 0.7-17.4s | skye | Arm.R | max.Arm.L | 0.66 | 25% |
| 3:18.4 | 0.7-17.4s | max | Arm.L | skye.Arm.R | 0.69 | 22% |
| 4:11.5 | 53.9-55.1s | max | Arm.L | skye.Arm.R | 0.62 | 22% |
| 4:11.5 | 53.9-55.1s | skye | Arm.R | max.Arm.L | 0.54 | 24% |
| 3:40.5 | 22.9-29.1s | skye | Arm.L,Torso | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.53 | 17% |
| 3:17.7 | 0.0-11.7s | skye | Arm.L,Arm.R | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.49 | 16% |
| 3:47.9 | 30.3-33.3s | skye | Arm.L,Torso | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.49 | 16% |
| 3:58.5 | 40.8-55.9s | skye | Arm.L,Torso | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.49 | 16% |
| 4:02.1 | 44.4-55.9s | skye | Arm.L | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.49 | 16% |
| 3:34.9 | 17.3-19.0s | skye | Arm.L,Torso | box 3.6x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.49 | 16% |
| 3:17.7 | 0.0-0.3s | max | Torso,Arm.R | box 3.6x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 0.69 | 11% |
| 3:17.7 | 0.0-0.1s | max | Leg.L,Leg.R | box 1.9x0.2x1.7 @set_classroom(-5.0,1.6,7.1) | 0.68 | 16% |
| 4:13.4 | 55.7-55.8s | max | Leg.R,Leg.L | box 1.9x0.2x1.7 @set_classroom(-5.0,1.6,7.1) | 0.76 | 8% |
| 4:12.8 | 55.1-55.2s | skye | Arm.R | max.Arm.R | 0.42 | 19% |
| ... 1 more high in ch04.json | | | | | | |

## ch05 (6 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 5:11.6 | 52.8-57.6s | skye | Leg.R,Leg.L,Arm.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 5:24.3 | 65.5-67.3s | skye | Leg.R,Leg.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 4:45.5 | 26.7-27.4s | skye | Leg.R,Leg.L,Arm.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 4:32.1 | 13.3-14.0s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.52 | 16% |
| 4:35.4 | 16.7-21.3s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.44 | 16% |
| 4:41.1 | 22.3-24.1s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.43 | 16% |

## ch06 (27 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 5:51.7 | 25.7-26.2s | lily | Torso,Head,Arm.R | skye.Arm.L | 0.67 | 65% |
| 6:00.0 | 33.9-35.1s | skye | Arm.L | box 0.4x10.0x4.5 @set_hallway(-6.5,5.0,-7.2) | 0.86 | 27% |
| 5:28.8 | 2.7-5.3s | skye | Arm.R,Torso,Leg.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.87 | 24% |
| 5:51.8 | 25.7-27.5s | lily | Arm.R | skye.Torso | 0.56 | 56% |
| 6:11.3 | 45.3-45.5s | lily | Leg.L,Leg.R,Torso | skye.Leg.L | 0.84 | 75% |
| 6:00.1 | 34.1-35.1s | skye | Arm.L | wall_back box 6.4x10.0x0.4 @set_hallway(-3.8,5.0,-5.2) | 0.63 | 24% |
| 5:51.8 | 25.7-26.2s | lily | Arm.R | skye.Leg.L | 0.57 | 44% |
| 5:45.0 | 18.9-26.1s | skye | Arm.R,Torso,Head | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.59 | 22% |
| 5:55.8 | 29.7-31.1s | skye | Arm.L | wall_back box 6.4x10.0x0.4 @set_hallway(-3.8,5.0,-5.2) | 0.61 | 16% |
| 5:51.8 | 25.7-26.1s | skye | Arm.L | lily.Torso | 0.67 | 32% |
| 5:54.3 | 28.3-31.3s | skye | Arm.L | box 0.3x7.9x0.6 @set_hallway(-6.8,4.0,-5.0) | 0.69 | 8% |
| 6:11.3 | 45.3-45.5s | lily | Arm.L,Torso | skye.Arm.L | 0.62 | 46% |
| 5:51.8 | 25.7-26.3s | skye | Torso,Leg.L,Arm.L | lily.Arm.R | 0.57 | 19% |
| 5:51.7 | 25.7-26.2s | skye | Arm.L | lily.Head | 0.49 | 27% |
| 6:11.4 | 45.3-45.5s | skye | Leg.L | lily.Leg.L | 0.81 | 37% |
| ... 12 more high in ch06.json | | | | | | |

## ch07 (34 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 6:35.1 | 11.3-15.9s | lily | Torso,Leg.R,Arm.R,Arm.L,Leg.L | witch cyl 2.4x2.9x2.4 @world(608.9,1.5,-3.5) | 1.07 | 90% |
| 6:34.0 | 10.1-15.9s | lily | Head,Torso,Arm.R,Leg.L,Leg.R | skye.Arm.L | 0.86 | 100% |
| 7:24.1 | 60.3-61.7s | max | Arm.L | skye.Arm.R | 0.98 | 48% |
| 7:23.3 | 59.5-61.7s | skye | Arm.R | max.Arm.L | 1.02 | 43% |
| 6:23.8 | 0.0-4.5s | lily | Arm.R,Torso,Leg.R | skye.Arm.L | 0.74 | 62% |
| 6:45.4 | 21.5-24.2s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 6:51.8 | 27.9-29.8s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 7:09.5 | 45.7-46.7s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 6:35.6 | 11.7-15.9s | skye | Arm.L | lily.Head | 0.82 | 38% |
| 6:23.8 | 0.0-4.5s | skye | Arm.L,Torso | lily.Arm.R | 0.78 | 29% |
| 6:36.3 | 12.5-16.0s | lily | Arm.R | skye.Torso | 0.52 | 48% |
| 6:55.6 | 31.8-45.6s | dad | Arm.R | witch cyl 2.4x2.9x2.4 @world(608.9,1.5,-3.5) | 0.69 | 21% |
| 6:35.6 | 11.7-12.1s | skye | Arm.L | lily.Torso | 0.75 | 40% |
| 6:35.1 | 11.3-12.3s | lily | Arm.R,Arm.L,Torso | witch box 1.6x0.5x1.0 @world(608.9,3.0,-3.5) | 0.58 | 27% |
| 6:28.4 | 4.5-6.9s | skye | Leg.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.53 | 32% |
| ... 19 more high in ch07.json | | | | | | |

## ch08 (14 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 8:11.4 | 34.1-40.5s | lily | Torso | skye.Arm.L | 0.89 | 40% |
| 8:31.8 | 54.5-58.0s | lily | Torso,Arm.R,Head | skye.Arm.L | 0.89 | 40% |
| 8:11.4 | 34.1-40.5s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 8:27.0 | 49.7-51.6s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 8:31.8 | 54.5-58.0s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 8:06.9 | 29.6-30.9s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 8:02.9 | 25.6-26.6s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 8:30.0 | 52.7-53.6s | skye | Arm.L | lily.Torso | 0.88 | 35% |
| 7:47.3 | 10.0-10.9s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.55 | 33% |
| 8:11.4 | 34.1-40.5s | lily | Arm.R | skye.Torso | 0.44 | 29% |
| 8:31.8 | 54.5-58.0s | lily | Arm.R | skye.Torso | 0.44 | 29% |
| 7:37.3 | 0.0-9.9s | skye | Arm.L | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.41 | 22% |
| 7:55.1 | 17.8-17.9s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.52 | 33% |
| 7:55.5 | 18.2-18.3s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.41 | 19% |

## ch09 (2 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 9:28.3 | 52.9-59.7s | lily | Arm.L | skye.Arm.R | 0.54 | 25% |
| 9:24.5 | 49.1-49.9s | skye | Arm.R,Torso,Arm.L | box 2.6x1.1x2.0 @world(608.4,2.5,5.8) | 0.6 | 3% |

## ch10 (10 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 10:02.0 | 26.9-29.9s | max | Torso,Arm.R | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.97 | 33% |
| 9:43.4 | 8.3-13.9s | max | Torso,Arm.R | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.72 | 33% |
| 9:56.8 | 21.7-23.5s | max | Torso,Arm.R | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.72 | 33% |
| 9:53.2 | 18.1-19.8s | max | Torso,Arm.R | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.72 | 33% |
| 10:04.0 | 28.9-29.9s | max | Arm.R | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.52 | 33% |
| 10:05.0 | 29.9-32.7s | max | Leg.R,Leg.L | box 5.3x0.3x5.0 @set_bedroom(-4.0,2.3,-4.3) | 0.51 | 33% |
| 9:35.1 | 0.0-3.9s | max | Torso | box 5.3x0.3x4.4 @set_bedroom(-4.0,3.3,-4.0) | 0.72 | 10% |
| 9:35.2 | 0.1-0.1s | skye | Leg.L | box 3.7x7.5x1.6 @set_bedroom(9.2,3.8,2.3) | 0.68 | 10% |
| 9:35.2 | 0.1-0.1s | skye | Leg.L | box 3.8x7.5x1.5 @set_bedroom(9.2,3.8,2.2) | 0.66 | 10% |
| 9:35.3 | 0.2-0.2s | skye | Leg.L | box 3.8x7.5x1.4 @set_bedroom(9.1,3.8,2.1) | 0.6 | 10% |

## ch11 (31 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 11:15.6 | 35.3-42.4s | max | Arm.L | skye.Torso | 0.86 | 43% |
| 11:24.4 | 44.1-48.2s | max | Arm.L | skye.Torso | 0.86 | 43% |
| 11:32.3 | 52.0-69.8s | skye | Arm.R | max.Torso | 0.85 | 43% |
| 11:32.3 | 52.0-69.8s | max | Arm.L,Torso | skye.Arm.R | 0.84 | 43% |
| 11:32.3 | 52.0-69.8s | max | Arm.L | skye.Torso | 0.83 | 43% |
| 11:32.3 | 52.0-69.8s | skye | Torso,Arm.R | max.Arm.L | 0.82 | 43% |
| 11:15.6 | 35.3-42.4s | skye | Torso,Arm.R | max.Arm.L | 0.82 | 38% |
| 11:24.4 | 44.1-48.2s | skye | Torso,Arm.R | max.Arm.L | 0.82 | 38% |
| 11:15.6 | 35.3-39.9s | max | Arm.L,Torso | skye.Arm.R | 0.79 | 38% |
| 11:26.1 | 45.8-48.2s | max | Arm.L,Torso | skye.Arm.R | 0.79 | 38% |
| 10:40.3 | 0.0-5.2s | dad | Arm.L | box 3.4x3.2x2.4 @set_kitchen(-2.0,1.6,-10.8) | 0.81 | 33% |
| 11:15.6 | 35.3-39.9s | skye | Arm.R | max.Torso | 0.71 | 38% |
| 11:26.1 | 45.8-48.2s | skye | Arm.R | max.Torso | 0.71 | 38% |
| 10:40.3 | 0.0-5.2s | dad | Arm.L | box 3.4x0.2x2.5 @set_kitchen(-2.0,3.3,-10.7) | 0.94 | 13% |
| 11:01.4 | 21.1-22.5s | lily | Arm.L,Torso | max.Arm.R | 0.55 | 41% |
| ... 16 more high in ch11.json | | | | | | |

