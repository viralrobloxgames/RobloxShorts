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

Re-run on current main (all chapters), with `--sight skye:max,dad,lily`.

## Totals

| Chapter | high | medium | low | seen while hiding |
|---|---|---|---|---|
| ch01 | 3 | 41 | 33 | 11 |
| ch02 | 17 | 27 | 11 | 12 |
| ch03 | 21 | 45 | 17 | 7 |
| ch04 | 9 | 61 | 18 | 7 |
| ch05 | 6 | 7 | 35 | 2 |
| ch06 | 27 | 46 | 32 | 2 |
| ch07 | 34 | 35 | 38 | 11 |
| ch08 | 12 | 18 | 7 | 1 |
| ch09 | 2 | 7 | 50 | 1 |
| ch10 | 10 | 9 | 1 | 2 |
| ch11 | 43 | 46 | 49 | 4 |
| all | 184 | 342 | 291 | |

## Seen while hiding (line of sight)

A seeker's eyes see Skye's head or torso: inside his 110-degree field of view and nothing solid in between. Some are meant (school, the tea party with Lily, the reveal in ch10/ch11); the rest break the hiding.

| Chapter | Film | Chapter t | Who sees Skye | Part | Distance |
|---|---|---|---|---|---|
| ch01 | 0:00.0 | 0.00-0.13s | max | Torso | 7.6 |
| ch01 | 0:00.4 | 0.40-0.60s | max | Torso | 7.2 |
| ch01 | 0:00.9 | 0.87-1.20s | max | Torso | 7.2 |
| ch01 | 0:01.7 | 1.73-2.20s | max | Torso | 7.2 |
| ch01 | 0:02.7 | 2.73-3.20s | max | Torso | 7.2 |
| ch01 | 0:03.5 | 3.47-6.87s | max | Torso | 3.6 |
| ch01 | 0:07.1 | 7.07-7.13s | max | Torso | 4.4 |
| ch01 | 0:07.3 | 7.27-10.20s | max | Head | 4.3 |
| ch01 | 0:12.2 | 12.20-16.20s | max | Head | 4.6 |
| ch01 | 0:16.9 | 16.93-25.27s | max | Head | 3.7 |
| ch01 | 0:25.5 | 25.47-46.87s | max | Head | 3.4 |
| ch02 | 1:11.0 | 7.33-7.87s | dad | Head | 10.8 |
| ch02 | 1:11.7 | 8.00-11.60s | dad | Head | 10.4 |
| ch02 | 1:17.2 | 13.53-13.87s | max | Head | 10 |
| ch02 | 1:18.8 | 15.13-15.33s | max | Head | 9.2 |
| ch02 | 1:18.8 | 15.13-15.40s | lily | Head | 10.4 |
| ch02 | 1:21.8 | 18.13-29.07s | lily | Head | 7.4 |
| ch02 | 1:22.2 | 18.47-24.00s | dad | Head | 10.4 |
| ch02 | 1:29.1 | 25.40-26.80s | dad | Head | 10.4 |
| ch02 | 1:34.1 | 30.40-30.40s | lily | Head | 7.4 |
| ch02 | 1:34.2 | 30.53-40.27s | lily | Head | 7.4 |
| ch02 | 1:34.5 | 30.80-40.60s | dad | Head | 8.2 |
| ch02 | 2:09.8 | 66.13-66.80s | max | Head | 6 |
| ch03 | 2:20.6 | 10.07-10.20s | max | Head | 28.2 |
| ch03 | 2:20.9 | 10.33-10.33s | max | Head | 27.5 |
| ch03 | 2:21.4 | 10.80-11.13s | max | Head | 20.6 |
| ch03 | 2:22.6 | 12.00-12.13s | max | Head | 9.6 |
| ch03 | 3:01.8 | 51.20-51.20s | dad | Torso | 13 |
| ch03 | 3:02.6 | 52.00-52.07s | dad | Head | 10.2 |
| ch03 | 3:11.2 | 60.67-63.67s | dad | Head | 10.7 |
| ch04 | 3:17.7 | 0.00-0.53s | max | Head | 4.9 |
| ch04 | 3:18.5 | 0.80-13.73s | max | Head | 3.8 |
| ch04 | 3:34.9 | 17.27-19.80s | max | Head | 3.8 |
| ch04 | 3:38.2 | 20.53-29.20s | max | Head | 3.7 |
| ch04 | 3:48.0 | 30.33-30.47s | max | Head | 3.7 |
| ch04 | 4:02.1 | 44.40-55.07s | max | Head | 3.7 |
| ch04 | 4:13.5 | 55.87-61.07s | max | Head | 9.8 |
| ch05 | 4:18.8 | 0.00-12.07s | lily | Head | 13.9 |
| ch05 | 4:31.6 | 12.87-67.27s | lily | Head | 4.4 |
| ch06 | 5:50.7 | 24.60-25.67s | lily | Head | 2.3 |
| ch06 | 6:02.0 | 35.93-45.93s | dad | Head | 12.8 |
| ch07 | 6:35.4 | 11.53-11.53s | lily | Head | 4.7 |
| ch07 | 6:35.6 | 11.80-12.40s | lily | Head | 2.1 |
| ch07 | 6:39.8 | 16.00-16.00s | dad | Head | 13.6 |
| ch07 | 6:40.0 | 16.20-17.67s | dad | Head | 10.5 |
| ch07 | 6:48.4 | 24.60-24.80s | dad | Head | 7.2 |
| ch07 | 6:54.6 | 30.80-42.60s | dad | Head | 1.6 |
| ch07 | 7:10.6 | 46.80-51.93s | dad | Head | 2.3 |
| ch07 | 7:21.5 | 57.67-57.67s | dad | Head | 13 |
| ch07 | 7:21.8 | 58.00-61.67s | max | Head | 1.6 |
| ch07 | 7:29.3 | 65.47-66.13s | lily | Head | 3 |
| ch07 | 7:29.7 | 65.87-66.20s | max | Head | 13 |
| ch08 | 7:58.2 | 20.93-25.00s | lily | Head | 2.8 |
| ch09 | 8:58.0 | 22.67-54.93s | lily | Head | 3.3 |
| ch10 | 9:35.1 | 0.00-30.27s | max | Head | 5.2 |
| ch10 | 10:36.0 | 60.93-65.13s | max | Head | 4.5 |
| ch11 | 10:41.8 | 1.53-69.80s | dad | Head | 5.4 |
| ch11 | 10:43.2 | 2.87-2.93s | lily | Head | 17.6 |
| ch11 | 10:43.4 | 3.13-34.53s | max | Head | 9.9 |
| ch11 | 10:44.3 | 4.00-18.67s | lily | Head | 11.9 |

## ch01 clipping (3 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 0:21.7 | 21.7-25.4s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.72 | 10% |
| 0:25.5 | 25.5-34.7s | extra0 | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-7.0) | 0.72 | 10% |
| 0:07.6 | 7.6-8.1s | skye | Head | box 2.2x2.7x0.6 @set_bedroom(-14.4,5.1,3.6) | 0.46 | 33% |

## ch02 clipping (17 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 1:34.1 | 30.4-30.5s | lily | Arm.R,Leg.R,Torso,Head | dad.Torso | 1.13 | 95% |
| 1:34.0 | 30.3-30.5s | lily | Leg.L,Leg.R,Arm.L,Torso,Head | dad.Arm.L | 0.78 | 70% |
| 1:44.0 | 40.3-42.5s | max | Arm.L | box 11.0x0.3x3.9 @set_kitchen(0.0,3.5,-0.1) | 0.75 | 24% |
| 1:11.4 | 7.7-7.9s | skye | Arm.R | box 10.4x3.0x2.6 @set_kitchen(0.0,1.8,0.4) | 0.84 | 60% |
| 1:51.0 | 47.3-61.8s | max | Arm.L,Torso | box 3.2x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 0.79 | 11% |
| 1:34.2 | 30.5-30.7s | dad | Arm.L | box 10.4x3.0x2.6 @set_kitchen(0.0,1.8,0.4) | 0.92 | 38% |
| 1:34.2 | 30.5-30.7s | dad | Arm.L,Torso | box 11.0x0.3x3.9 @set_kitchen(0.0,3.5,-0.1) | 1.13 | 14% |
| 1:17.9 | 14.2-14.7s | max | Arm.R,Torso,Leg.R | box 0.3x12.0x14.0 @set_kitchen(10.8,6.0,-5.0) | 0.65 | 25% |
| 1:11.4 | 7.7-7.9s | skye | Arm.R | box 11.0x0.3x3.9 @set_kitchen(0.0,3.5,-0.1) | 0.75 | 17% |
| 1:34.1 | 30.4-30.5s | dad | Torso | lily.Arm.R | 1.16 | 13% |
| 1:34.0 | 30.3-30.4s | dad | Arm.L | lily.Arm.L | 0.79 | 22% |
| 1:34.0 | 30.3-30.5s | dad | Arm.L | lily.Leg.L | 0.65 | 25% |
| 1:34.0 | 30.3-30.5s | dad | Torso,Arm.L | lily.Torso | 0.67 | 21% |
| 1:32.9 | 29.2-29.3s | skye | Arm.L | box 10.4x3.0x2.6 @set_kitchen(0.0,1.8,0.4) | 0.65 | 32% |
| 1:11.0 | 7.3-7.4s | skye | Arm.R | box 0.3x12.0x14.0 @set_kitchen(10.8,6.0,-5.0) | 0.62 | 13% |
| ... 2 more high in ch02.json | | | | | | |

## ch03 clipping (21 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 3:00.2 | 49.7-50.3s | skye | Arm.L | box 10.4x3.0x2.6 @set_kitchen(0.0,1.8,0.4) | 0.96 | 57% |
| 3:01.9 | 51.3-51.9s | dad | Arm.R,Torso,Head,Arm.L | box 0.3x12.0x14.0 @set_kitchen(10.8,6.0,-5.0) | 0.99 | 24% |
| 2:20.7 | 10.1-10.7s | max | Torso,Arm.R,Head,Arm.L,Leg.R,Leg.L | box 0.3x12.0x14.0 @set_kitchen(10.8,6.0,-5.0) | 1.01 | 25% |
| 3:00.6 | 50.0-50.3s | dad | Arm.L,Arm.R,Torso,Head | box 6.0x0.3x11.0 @set_kitchen(13.5,12.1,-7.0) | 1.12 | 24% |
| 3:00.6 | 50.0-50.4s | skye | Arm.L | box 11.0x0.3x3.9 @set_kitchen(0.0,3.5,-0.1) | 0.94 | 16% |
| 3:01.4 | 50.8-51.7s | dad | Arm.R,Leg.R,Torso | box 5.1x0.1x0.9 @set_kitchen(13.5,3.8,-1.6) | 0.79 | 6% |
| 2:20.9 | 10.3-10.5s | max | Arm.R,Torso | box 5.0x0.8x0.8 @set_kitchen(13.5,3.4,-1.6) | 0.97 | 32% |
| 3:00.3 | 49.7-49.9s | dad | Leg.R,Leg.L | box 6.0x0.3x11.0 @set_kitchen(13.5,12.1,-7.0) | 1.11 | 14% |
| 3:01.8 | 51.3-51.4s | dad | Leg.R | box 5.0x0.8x0.8 @set_kitchen(13.5,1.1,0.8) | 0.74 | 22% |
| 3:01.8 | 51.2-51.4s | dad | Leg.R,Leg.L | box 5.0x0.8x0.8 @set_kitchen(13.5,0.4,1.6) | 0.57 | 17% |
| 3:01.8 | 51.2-51.4s | dad | Leg.R,Leg.L | box 5.1x0.1x0.9 @set_kitchen(13.5,0.8,1.6) | 0.66 | 8% |
| 2:20.7 | 10.1-10.4s | max | Leg.R,Leg.L | box 5.1x0.1x0.9 @set_kitchen(13.5,1.5,0.8) | 0.6 | 6% |
| 3:13.6 | 63.0-63.0s | dad | Arm.L | box 3.8x8.5x1.8 @set_kitchen(-11.2,4.3,-8.2) | 0.57 | 44% |
| 2:20.9 | 10.3-10.5s | max | Torso,Arm.R | box 5.1x0.1x0.9 @set_kitchen(13.5,3.0,-0.8) | 0.71 | 5% |
| 2:20.9 | 10.3-10.4s | max | Torso,Arm.R | box 5.0x0.8x0.8 @set_kitchen(13.5,2.6,-0.8) | 0.66 | 17% |
| ... 6 more high in ch03.json | | | | | | |

## ch04 clipping (9 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 4:13.2 | 55.5-61.1s | max | Arm.R,Torso,Arm.L | box 3.2x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 0.81 | 11% |
| 3:17.7 | 0.0-5.5s | skye | Arm.L,Arm.R | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 3:32.7 | 15.0-19.0s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 3:44.5 | 26.8-29.1s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 3:58.5 | 40.8-44.4s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 4:07.9 | 50.3-52.4s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 3:28.0 | 10.3-11.7s | skye | Arm.L | box 3.2x0.2x2.3 @set_classroom(-13.0,3.0,-1.0) | 0.68 | 13% |
| 3:17.7 | 0.0-0.3s | max | Torso,Arm.R | box 3.2x0.2x2.3 @set_classroom(-5.0,3.0,5.0) | 0.66 | 11% |
| 3:17.7 | 0.0-0.1s | max | Leg.L,Leg.R | box 1.9x0.2x1.7 @set_classroom(-5.0,1.6,7.4) | 0.68 | 16% |

## ch05 clipping (6 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 5:11.6 | 52.8-57.6s | skye | Leg.R,Leg.L,Arm.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 5:24.3 | 65.5-67.3s | skye | Leg.R,Leg.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 4:45.5 | 26.7-27.4s | skye | Leg.R,Leg.L,Arm.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.66 | 43% |
| 4:32.1 | 13.3-14.0s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.52 | 16% |
| 4:35.4 | 16.7-21.3s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.44 | 16% |
| 4:41.1 | 22.3-24.1s | lily | Arm.R,Torso | skeleton box 1.0x0.3x0.6 @world(603.6,2.3,-3.5) | 0.43 | 16% |

## ch06 clipping (27 high)

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

## ch07 clipping (34 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 6:35.1 | 11.3-15.9s | lily | Torso,Leg.R,Arm.R,Arm.L,Leg.L | witch cyl 2.4x2.9x2.4 @world(608.9,1.5,-3.5) | 1.07 | 90% |
| 6:35.6 | 11.7-15.9s | lily | Head,Torso,Leg.L,Leg.R,Arm.R | skye.Arm.L | 0.85 | 83% |
| 7:23.3 | 59.5-61.7s | skye | Arm.R | max.Arm.L | 1.05 | 52% |
| 7:23.3 | 59.5-61.7s | max | Arm.L | skye.Arm.R | 0.99 | 49% |
| 6:23.8 | 0.0-4.5s | lily | Arm.R,Torso,Head | skye.Arm.L | 0.72 | 63% |
| 6:45.4 | 21.5-24.2s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 6:51.8 | 27.9-29.8s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 7:09.5 | 45.7-46.7s | lily | Leg.L,Torso | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.67 | 59% |
| 6:35.6 | 11.7-15.9s | skye | Arm.L | lily.Head | 0.86 | 35% |
| 6:23.8 | 0.0-4.5s | skye | Arm.L,Torso | lily.Arm.R | 0.71 | 32% |
| 6:35.6 | 11.7-12.2s | skye | Arm.L | lily.Torso | 0.75 | 40% |
| 6:36.3 | 12.5-16.0s | lily | Arm.R | skye.Torso | 0.52 | 48% |
| 6:28.4 | 4.5-6.9s | skye | Leg.L,Arm.L | table_box box 2.6x1.4x2.2 @world(596.5,0.7,2.0) | 0.62 | 32% |
| 6:55.6 | 31.8-45.6s | dad | Arm.R | witch cyl 2.4x2.9x2.4 @world(608.9,1.5,-3.5) | 0.69 | 21% |
| 6:55.6 | 31.8-45.6s | skye | Arm.L | dad.Torso | 0.48 | 43% |
| ... 19 more high in ch07.json | | | | | | |

## ch08 clipping (12 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 8:11.4 | 34.1-40.5s | lily | Torso,Arm.R | skye.Arm.L | 0.69 | 46% |
| 8:31.8 | 54.5-58.0s | lily | Torso,Arm.R,Head | skye.Arm.L | 0.69 | 46% |
| 8:11.4 | 34.1-40.5s | skye | Arm.L | lily.Torso | 0.69 | 35% |
| 8:31.8 | 54.5-58.0s | skye | Arm.L | lily.Torso | 0.69 | 35% |
| 7:47.3 | 10.0-10.9s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.55 | 33% |
| 8:11.4 | 34.1-40.5s | lily | Arm.R | skye.Torso | 0.44 | 29% |
| 8:31.8 | 54.5-58.0s | lily | Arm.R | skye.Torso | 0.44 | 29% |
| 7:37.3 | 0.0-9.9s | skye | Arm.L | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.41 | 22% |
| 8:11.4 | 34.1-40.5s | skye | Torso,Arm.L,Leg.R,Leg.L | lily.Arm.R | 0.43 | 19% |
| 8:31.8 | 54.5-58.0s | skye | Torso,Arm.L,Leg.R,Leg.L | lily.Arm.R | 0.43 | 19% |
| 7:55.1 | 17.8-17.9s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.52 | 33% |
| 7:55.5 | 18.2-18.3s | skye | Arm.R | box 3.9x7.4x0.3 @set_hallway(-9.0,3.8,-5.0) | 0.41 | 19% |

## ch09 clipping (2 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 9:28.3 | 52.9-59.7s | lily | Arm.L | skye.Arm.R | 0.54 | 25% |
| 9:24.5 | 49.1-49.9s | skye | Arm.R,Torso,Arm.L | box 2.6x1.1x2.0 @world(608.4,2.5,5.8) | 0.6 | 3% |

## ch10 clipping (10 high)

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

## ch11 clipping (43 high)

| Film | Chapter t | Who | Parts | Into | Depth | Cover |
|---|---|---|---|---|---|---|
| 11:01.4 | 21.1-22.5s | lily | Arm.L,Torso | max.Arm.R | 0.84 | 70% |
| 10:59.0 | 18.7-19.9s | lily | Arm.L,Torso | max.Arm.R | 0.84 | 70% |
| 11:32.3 | 52.0-69.8s | lily | Arm.L | max.Arm.R | 0.78 | 68% |
| 11:24.4 | 44.1-69.8s | skye | Arm.R,Torso | max.Arm.L | 0.87 | 44% |
| 11:15.6 | 35.3-39.9s | skye | Arm.R | max.Arm.L | 0.86 | 44% |
| 11:32.3 | 52.0-69.8s | max | Arm.L,Torso | skye.Arm.R | 0.86 | 44% |
| 11:26.1 | 45.8-47.1s | max | Arm.L,Torso,Head | skye.Arm.R | 0.86 | 44% |
| 11:15.6 | 35.3-48.2s | lily | Arm.L,Torso | max.Arm.R | 0.69 | 56% |
| 11:01.4 | 21.1-22.5s | max | Arm.R,Torso | lily.Arm.L | 0.83 | 32% |
| 10:59.0 | 18.7-19.9s | max | Arm.R,Torso | lily.Arm.L | 0.83 | 32% |
| 11:32.3 | 52.0-56.7s | max | Arm.L | skye.Torso | 0.73 | 40% |
| 11:26.1 | 45.8-47.1s | skye | Arm.R | max.Torso | 0.72 | 41% |
| 11:32.3 | 52.0-69.8s | max | Arm.R | lily.Arm.L | 0.8 | 32% |
| 11:37.6 | 57.3-69.8s | max | Arm.L | skye.Torso | 0.72 | 40% |
| 11:32.3 | 52.0-56.0s | skye | Arm.R | max.Torso | 0.73 | 37% |
| ... 28 more high in ch11.json | | | | | | |

