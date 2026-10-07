# Snap check (web/snap_check.mjs)

Every frame posed in order from frame 1 (no drawing, same history as a pre-rolled render) and compared with the frame before. Flags: **limb** = Torso/Head/Arm/Leg bone turns > 25 deg in one frame; **root** = an actor's velocity changes > 0.3 studs/frame (start/stop pops, not steady walks); **jump** = actor moves > 3 studs in one frame inside a shot (teleport); **prop** = a prop's velocity changes > 0.3 studs/frame or it changes holder. Skipped: frames where the camera cuts (> 0.5 studs or > 10 deg), set changes (> 50 studs), and actors/props off camera on either frame. Limbs popping together on the same frame are one event. **high** = limb > 60 deg, a teleport, or a root/prop jump > 1 stud; **low** = the rest (often walk start/stop or a quick gesture).

Partial run (ch01, ch03, ch04, ch06 at their recheck-status shas; the 11-chapter run was stopped on the orchestrator's 14:32Z request). Rerun: `node web/snap_check.mjs --clip projects/i-secretly-lived-in-my-enemys-house/web/chNN.js [--root <tree at sha>] --out chNN.json` (~30 s).

| ch | sha | frames | events | high | high limb | high prop | jump |
|---|---|---|---|---|---|---|---|
| ch01 | 6b008a0d | 1911 | 54 | **27** | 20 | 7 | 0 |
| ch03 | 726592de | 2013 | 76 | **33** | 15 | 14 | 0 |
| ch04 | 80a98e8b | 1833 | 34 | **13** | 3 | 10 | 0 |
| ch06 | 8537ebc6 | 1733 | 40 | **19** | 10 | 8 | 0 |

## ch01 @ 6b008a0d: 27 high of 54

| film | frames | kind | actor | part | max | note |
|---|---|---|---|---|---|---|
| 0:03.97 | f120-121 | prop | max | flashlight | 1.94 | studs/frame change (moved 0.00) |
| 0:10.23 | f308-309 | limb | max | Arm.R Arm.L Leg.L Leg.R | 60.48 | degrees |
| 0:10.23 | f308-310 | prop | max | flashlight | 2.93 | studs/frame change (moved 0.34) |
| 0:11.10 | f334-335 | prop | max | flashlight | 1.47 | studs/frame change (moved 1.69) |
| 0:11.43 | f344-345 | prop | max | flashlight | 2.36 | studs/frame change (moved 0.00) |
| 0:14.17 | f426 | limb | max | Arm.L Arm.R Leg.L Leg.R | 60.88 | degrees |
| 0:17.13 | f515 | limb | skye | Arm.L Arm.R | 78.5 | degrees |
| 0:17.63 | f530 | limb | max | Arm.R | 87.95 | degrees |
| 0:19.23 | f578 | limb | max | Arm.R | 88.45 | degrees |
| 0:23.73 | f713 | limb | max | Arm.L Arm.R Leg.L Leg.R | 63.85 | degrees |
| 0:24.00 | f721 | limb | max | Arm.R | 82.8 | degrees |
| 0:24.90 | f748 | limb | max | Arm.R | 82.76 | degrees |
| 0:25.33 | f761 | prop | skye | rubber_spider | 1.15 | studs/frame change (moved 0.08) |
| 0:25.43 | f764 | limb | max | Arm.L Arm.R Leg.L Leg.R | 63.85 | degrees |
| 0:27.37 | f822 | limb | skye | Arm.R | 63.6 | degrees |
| 0:27.37 | f822 | limb | max | Arm.R | 114.26 | degrees |
| 0:27.37 | f822-823 | prop | max | rubber_spider | 2.79 | studs/frame change (moved 0.00) |
| 0:29.93 | f899 | limb | max | Arm.R | 115.06 | degrees |
| 0:29.93 | f899-900 | prop | max | rubber_spider | 3.01 | studs/frame change (moved 0.00) |
| 0:47.20 | f1417 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 61.4 | degrees |
| 0:49.30 | f1480 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 61.46 | degrees |
| 0:50.27 | f1509 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 68.15 | degrees |
| 0:50.43 | f1514 | limb | skye | Arm.L Leg.L Leg.R | 61.56 | degrees |
| 0:50.97 | f1530 | limb | skye | Arm.R | 74.52 | degrees |
| 0:51.13 | f1535 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 61.71 | degrees |
| 1:01.43 | f1844 | limb | skye | Leg.L Leg.R | 62.43 | degrees |
| 1:01.93 | f1859 | limb | skye | Leg.L Leg.R | 70.98 | degrees |

Low events (27) are in `ch01.json` (`events`, severity low).

## ch03 @ 726592de: 33 high of 76

| film | frames | kind | actor | part | max | note |
|---|---|---|---|---|---|---|
| 2:20.17 | f289 | limb | skye | Head Arm.L Arm.R Leg.L Leg.R | 63.8 | degrees |
| 2:20.40 | f296 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 84.69 | degrees |
| 2:20.63 | f303 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 74.81 | degrees |
| 2:20.87 | f310-312 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 89.77 | degrees |
| 2:22.90 | f371-374 | prop | max | flashlight | 3.01 | studs/frame change (moved 0.50) |
| 2:23.40 | f386 | limb | max | Arm.L Arm.R Leg.L Leg.R | 114.45 | degrees |
| 2:23.40 | f386-387 | prop | max | flashlight | 3.88 | studs/frame change (moved 0.57) |
| 2:24.13 | f408-409 | prop | max | flashlight | 2.62 | studs/frame change (moved 0.50) |
| 2:25.33 | f444 | limb | max | Arm.L Arm.R Leg.L Leg.R | 109.05 | degrees |
| 2:25.33 | f444-445 | prop | max | flashlight | 2.45 | studs/frame change (moved 1.95) |
| 2:25.57 | f451 | prop | max | flashlight | 3.13 | studs/frame change (moved 2.65) |
| 2:32.53 | f660 | root | skye | root | 2.14 | studs/frame change (moved 0.00) |
| 2:35.53 | f750 | root | skye | root | 2.14 | studs/frame change (moved 0.00) |
| 2:41.53 | f930 | limb | max | Arm.L Arm.R Leg.L Leg.R | 61.01 | degrees |
| 2:41.53 | f930-931 | prop | max | ham | 2.85 | studs/frame change (moved 0.50) |
| 2:41.77 | f937 | limb | max | Arm.L Arm.R Leg.L Leg.R | 61.93 | degrees |
| 2:41.77 | f937-938 | prop | max | ham | 1.61 | studs/frame change (moved 0.97) |
| 2:42.07 | f946 | root | skye | root | 2.14 | studs/frame change (moved 0.00) |
| 2:53.10 | f1277-1278 | prop | max | flashlight | 3.04 | studs/frame change (moved 0.58) |
| 2:54.00 | f1304-1305 | prop | max | flashlight | 2.99 | studs/frame change (moved 0.54) |
| 2:54.73 | f1326-1327 | prop | max | flashlight | 2.64 | studs/frame change (moved 0.48) |
| 3:00.23 | f1491 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 157.71 | degrees |
| 3:00.23 | f1491-1496 | prop | skye | sandwich | 3.24 | studs/frame change (moved 0.53) |
| 3:00.70 | f1505 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 117.89 | degrees |
| 3:01.00 | f1514 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 141.53 | degrees |
| 3:01.00 | f1514-1515 | root | skye | root | 1.58 | studs/frame change (moved 0.00) |
| 3:01.00 | f1514-1515 | prop | skye | sandwich | 2.49 | studs/frame change (moved 1.97) |
| 3:02.23 | f1551 | limb | dad | Arm.L Arm.R Leg.L Leg.R | 111.9 | degrees |
| 3:03.53 | f1590 | limb | skye | Torso Head Arm.L Arm.R Leg.L Leg.R | 152.13 | degrees |
| 3:04.20 | f1610 | limb | dad | Arm.L Arm.R Leg.L Leg.R | 110.1 | degrees |
| 3:13.80 | f1898 | prop | dad | ham | 4.23 | studs/frame change (moved 0.52) |
| 3:14.00 | f1904 | limb | dad | Arm.L Arm.R Leg.L Leg.R | 61.97 | degrees |
| 3:14.00 | f1904-1905 | prop | dad | ham | 1.85 | studs/frame change (moved 1.18) |

Low events (43) are in `ch03.json` (`events`, severity low).

## ch04 @ 80a98e8b: 13 high of 34

| film | frames | kind | actor | part | max | note |
|---|---|---|---|---|---|---|
| 3:17.70 | f2 | limb | max | Arm.L Arm.R Leg.L Leg.R | 64.89 | degrees |
| 3:17.70 | f2-6 | prop | max | cookie | 3 | studs/frame change (moved 3.08) |
| 3:17.70 | f2-9 | prop | max | sandwich | 3.93 | studs/frame change (moved 3.06) |
| 3:18.50 | f26-27 | prop | max | cookie | 2.67 | studs/frame change (moved 2.06) |
| 3:18.50 | f26-27 | prop | max | sandwich | 2.7 | studs/frame change (moved 0.00) |
| 3:34.67 | f511 | prop | max | cookie | 2.11 | changes holder max -> none |
| 3:34.70 | f512 | prop | - | cookie | 2.11 | studs/frame change (moved 0.00) |
| 4:11.53 | f1617-1618 | prop | max | sandwich | 3.12 | studs/frame change (moved 0.00) |
| 4:13.10 | f1664 | limb | max | Arm.L Leg.L Leg.R | 60.8 | degrees |
| 4:13.10 | f1664-1665 | prop | max | sandwich | 2.94 | studs/frame change (moved 2.94) |
| 4:13.77 | f1684-1685 | prop | max | sandwich | 2.38 | studs/frame change (moved 2.57) |
| 4:13.90 | f1688 | limb | max | Arm.L Arm.R Leg.L Leg.R | 62.09 | degrees |
| 4:13.90 | f1688-1689 | prop | max | sandwich | 3.19 | studs/frame change (moved 3.15) |

Low events (21) are in `ch04.json` (`events`, severity low).

## ch06 @ 8537ebc6: 19 high of 40

| film | frames | kind | actor | part | max | note |
|---|---|---|---|---|---|---|
| 5:28.37 | f70-71 | prop | skye | flashlight | 1.4 | studs/frame change (moved 1.33) |
| 5:39.63 | f408-410 | limb | max | Arm.R | 64.73 | degrees |
| 5:40.43 | f432-435 | limb | max | Arm.R | 84.68 | degrees |
| 5:41.93 | f477 | limb | max | Arm.R | 154.34 | degrees |
| 5:57.20 | f935 | prop | skye | flashlight | 1.8 | studs/frame change (moved 0.00) |
| 5:59.50 | f1004 | limb | lily | Arm.L | 88.11 | degrees |
| 6:10.83 | f1344 | limb | dad | Arm.R | 82.27 | degrees |
| 6:10.83 | f1344-1345 | prop | dad | broom | 1.6 | studs/frame change (moved 1.60) |
| 6:10.97 | f1348-1349 | root | lily | root | 1.79 | studs/frame change (moved 1.79) |
| 6:10.97 | f1348-1349 | prop | lily | teddy | 2.1 | studs/frame change (moved 0.88) |
| 6:11.13 | f1353 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 107.7 | degrees |
| 6:11.13 | f1353-1354 | prop | skye | flashlight | 3.58 | studs/frame change (moved 0.82) |
| 6:11.20 | f1355 | limb | lily | Arm.R Leg.L Leg.R | 116.02 | degrees |
| 6:11.20 | f1355-1356 | prop | lily | teddy | 3.28 | studs/frame change (moved 0.67) |
| 6:11.40 | f1361 | limb | skye | Arm.L | 176.35 | degrees |
| 6:11.50 | f1364 | limb | skye | Arm.L Arm.R Leg.L Leg.R | 139.2 | degrees |
| 6:11.53 | f1365 | prop | skye | flashlight | 2.3 | studs/frame change (moved 0.75) |
| 6:11.80 | f1373 | prop | skye | flashlight | 2.88 | studs/frame change (moved 0.00) |
| 6:19.10 | f1592 | limb | dad | Leg.L Leg.R | 72.18 | degrees |

Low events (21) are in `ch06.json` (`events`, severity low).
