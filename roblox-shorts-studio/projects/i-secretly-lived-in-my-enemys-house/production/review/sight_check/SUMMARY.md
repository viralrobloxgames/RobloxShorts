# Sight check (Skye hiding): who can see her

From `node web/clip_check.mjs --clip .../chNN.js --sight skye:max,dad,lily` (every 2nd frame, current main at the time of the run). A row = a seeker's eyes see Skye's head or torso: inside his 110-degree field of view, nothing solid (scenery or another character) in between. Sightings in scenes where she is meant to be seen (school, the tea party with Lily, the ch10/ch11 reveal) are fine; the rest break the hiding. Re-run per chapter after a fix (writes the clip_check json too).

| Chapter | Film | Chapter t | Frames | Seeker | Sees | Closest (studs) |
|---|---|---|---|---|---|---|
| ch01 | 0:00.0 | 0.00-0.13s | 1-5 | max | Torso | 7.6 |
| ch01 | 0:00.4 | 0.40-0.60s | 13-19 | max | Torso | 7.2 |
| ch01 | 0:00.9 | 0.87-1.20s | 27-37 | max | Torso | 7.2 |
| ch01 | 0:01.7 | 1.73-2.20s | 53-67 | max | Torso | 7.2 |
| ch01 | 0:02.7 | 2.73-3.20s | 83-97 | max | Torso | 7.2 |
| ch01 | 0:03.5 | 3.47-6.87s | 105-207 | max | Torso | 3.6 |
| ch01 | 0:07.1 | 7.07-7.13s | 213-215 | max | Torso | 4.4 |
| ch01 | 0:07.3 | 7.27-10.20s | 219-307 | max | Head | 4.3 |
| ch01 | 0:12.2 | 12.20-16.20s | 367-487 | max | Head | 4.6 |
| ch01 | 0:16.9 | 16.93-25.27s | 509-759 | max | Head | 3.7 |
| ch01 | 0:25.5 | 25.47-46.87s | 765-1407 | max | Head | 3.4 |
| ch02 | 1:11.0 | 7.33-7.87s | 221-237 | dad | Head | 10.8 |
| ch02 | 1:11.7 | 8.00-11.60s | 241-349 | dad | Head | 10.4 |
| ch02 | 1:17.2 | 13.53-13.87s | 407-417 | max | Head | 10 |
| ch02 | 1:18.8 | 15.13-15.33s | 455-461 | max | Head | 9.2 |
| ch02 | 1:18.8 | 15.13-15.40s | 455-463 | lily | Head | 10.4 |
| ch02 | 1:21.8 | 18.13-29.07s | 545-873 | lily | Head | 7.4 |
| ch02 | 1:22.2 | 18.47-24.00s | 555-721 | dad | Head | 10.4 |
| ch02 | 1:29.1 | 25.40-26.80s | 763-805 | dad | Head | 10.4 |
| ch02 | 1:34.1 | 30.40-30.40s | 913-913 | lily | Head | 7.4 |
| ch02 | 1:34.2 | 30.53-40.27s | 917-1209 | lily | Head | 7.4 |
| ch02 | 1:34.5 | 30.80-40.60s | 925-1219 | dad | Head | 8.2 |
| ch02 | 2:09.8 | 66.13-66.80s | 1985-2005 | max | Head | 6 |
| ch03 | 2:20.6 | 10.07-10.20s | 303-307 | max | Head | 28.2 |
| ch03 | 2:20.9 | 10.33-10.33s | 311-311 | max | Head | 27.5 |
| ch03 | 2:21.4 | 10.80-11.13s | 325-335 | max | Head | 20.6 |
| ch03 | 2:22.6 | 12.00-12.13s | 361-365 | max | Head | 9.6 |
| ch03 | 3:01.8 | 51.20-51.20s | 1537-1537 | dad | Torso | 13 |
| ch03 | 3:02.6 | 52.00-52.07s | 1561-1563 | dad | Head | 10.2 |
| ch03 | 3:11.2 | 60.67-63.67s | 1821-1911 | dad | Head | 10.7 |
| ch04 | 3:17.7 | 0.00-0.53s | 1-17 | max | Head | 4.9 |
| ch04 | 3:18.5 | 0.80-13.73s | 25-413 | max | Head | 3.8 |
| ch04 | 3:34.9 | 17.27-19.80s | 519-595 | max | Head | 3.8 |
| ch04 | 3:38.2 | 20.53-29.20s | 617-877 | max | Head | 3.7 |
| ch04 | 3:48.0 | 30.33-30.47s | 911-915 | max | Head | 3.7 |
| ch04 | 4:02.1 | 44.40-55.07s | 1333-1653 | max | Head | 3.7 |
| ch04 | 4:13.5 | 55.87-61.07s | 1677-1833 | max | Head | 9.8 |
| ch05 | 4:18.8 | 0.00-12.07s | 1-363 | lily | Head | 13.9 |
| ch05 | 4:31.6 | 12.87-67.27s | 387-2019 | lily | Head | 4.4 |
| ch06 | 5:50.7 | 24.60-25.67s | 739-771 | lily | Head | 2.3 |
| ch06 | 6:02.0 | 35.93-45.93s | 1079-1379 | dad | Head | 12.8 |
| ch07 | 6:35.4 | 11.53-11.53s | 347-347 | lily | Head | 4.7 |
| ch07 | 6:35.6 | 11.80-12.40s | 355-373 | lily | Head | 2.1 |
| ch07 | 6:39.8 | 16.00-16.00s | 481-481 | dad | Head | 13.6 |
| ch07 | 6:40.0 | 16.20-17.67s | 487-531 | dad | Head | 10.5 |
| ch07 | 6:48.4 | 24.60-24.80s | 739-745 | dad | Head | 7.2 |
| ch07 | 6:54.6 | 30.80-42.60s | 925-1279 | dad | Head | 1.6 |
| ch07 | 7:10.6 | 46.80-51.93s | 1405-1559 | dad | Head | 2.3 |
| ch07 | 7:21.5 | 57.67-57.67s | 1731-1731 | dad | Head | 13 |
| ch07 | 7:21.8 | 58.00-61.67s | 1741-1851 | max | Head | 1.6 |
| ch07 | 7:29.3 | 65.47-66.13s | 1965-1985 | lily | Head | 3 |
| ch07 | 7:29.7 | 65.87-66.20s | 1977-1987 | max | Head | 13 |
| ch08 | 7:58.2 | 20.93-25.00s | 629-751 | lily | Head | 2.8 |
| ch09 | 8:58.0 | 22.67-54.93s | 681-1649 | lily | Head | 3.3 |
| ch10 | 9:35.1 | 0.00-30.27s | 1-909 | max | Head | 5.2 |
| ch10 | 10:36.0 | 60.93-65.13s | 1829-1955 | max | Head | 4.5 |
| ch11 | 10:41.8 | 1.53-69.80s | 47-2095 | dad | Head | 5.4 |
| ch11 | 10:43.2 | 2.87-2.93s | 87-89 | lily | Head | 17.6 |
| ch11 | 10:43.4 | 3.13-34.53s | 95-1037 | max | Head | 9.9 |
| ch11 | 10:44.3 | 4.00-18.67s | 121-561 | lily | Head | 11.9 |
