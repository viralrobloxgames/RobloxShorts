# recheck-ch11

## Re-check @ 50e434a3

Own checks: `clip_check --sight skye:max,dad,lily` reports 0 high hits. The medium hits are Max's arm resting in the plate he carries (f1683-1713) and Skye's arm grazing the counter or island, which is resting contact. Sight ranges are N/A because Skye is not hiding in ch11. `cam_check` reports 0 glides, 0 inside scenery and 0 at a head. Previews at 0.5 scale: f276-396 every 6th frame (plus f279-302 every 3rd), f554-682 every 6th, f1267-1327 every 4th, and the whole chapter `--every 15`.

| must | verdict |
|---|---|
| R-a Skye's two-arm "wave" (f282-390) | **fixed**: one-arm wave from about f295 to the end of the shot; the other arm hangs at her side |
| R-b Lily's V-arms "hug" (f560-676) | **fixed**: forearms come in over the teddy, so it reads as a hug |
| R-b fridge point (f1273-1321) | **fixed**: one arm points sideways toward frame left, the other stays on the bear, and nothing blocks the lens |
| critic-6 ch11 items 1-17 | still fixed, no regressions in the `--every 15` pass |

New issues:
- frames 281-292: the shot opens with Skye's waving arm already about 45° out and down for about 0.4 s before it rises. It reads as the start of the gesture. Fix: start the wave from her side. **should**

The payoff two-shot no longer has the floating pancake flip, which closes that critic-6 should.

**RECHECK: OK @ 50e434a3**

## Gesture-snap scan @ 50e434a3 (added to the brief after my OK)

Method: a frame-to-frame difference (`tblend` difference + YAVG) over every frame. Sources: f1-943 from my own 0.25-scale render, and f944-2095 from the 09:35 `ch11_b.mp4`. Every spike that was not a cut was re-rendered frame by frame with the fixed `render.mjs` on main, so these snaps are in the clip, not render pops. They overturn my OK.

| frames | what | fix | |
|---|---|---|---|
| 560-562 | Lily's close-up opens on the cut for 2 frames in her previous pose (body turned, one arm up and out to the side), then snaps into `hug_teddy` at f562 | have the hug pose and facing in place by f559, before the cut | **must** |
| 525-526 | Skye's head turns from profile to 3/4 front in one frame (two-shot by the stairs) | ease the head turn over about 6 frames | **must** |
| 1276-1277 | Lily's head jumps about 15° from looking frame-right to the camera in one frame at the start of "The fridge says yes" (the arms are fine) | ease over about 6 frames | **must** |
| 1664-1669 | Max's arm by the plate (his left, frame-right) flickers up, down, up: raised at 1664-65, down at 1666-67, raised again at 1668 | one eased raise (or none); no alternating keys | **must** |
| 1723-1724 | Max's arm by the plate drops from the forearm on the table to hanging in one frame | ease over about 6 frames | **must** |

Not snaps: f56-57 is the title fade; f1067, 1194 and 1500 are a caption change plus a mouth shape; f1152, 1561 and 1668 (the caption part) are caption changes.

**RECHECK: MUSTS @ 50e434a3** (snaps only; R-a and R-b stay fixed)

## Re-check @ a9896716

Own checks: `clip_check --sight` reports 0 high (27 medium, of the same kinds as before); `cam_check` 0/0/0; `snap_check` 1 high and 22 low. The pixel snap scan over all 2095 frames (0.25 scale, no captions) shows only the title fade (f56-57) and the end-screen dim (f1980). I also re-viewed the `--every 15` pass at 0.5 and every frame of each snap range.

| must | verdict |
|---|---|
| f560-562 Lily snaps into the hug after the cut | **fixed**: the hug pose is there from the first frame of the close-up |
| f525-526 Skye's head snap | **fixed**: eased over about 6 frames |
| f1276-1277 Lily's head snap | **fixed**: a gradual turn after the cut |
| f1664-1669 Max's arm flicker | **fixed**: the arm is steady |
| f1723-1724 Max's arm drop | **fixed**: the arm is steady |
| R-a, R-b | still fixed |
| the rest of the chapter (`--every 15`) | no regressions |

New issue:
- **f437-438, must**: by the front door (the shot that cuts in at f429), Skye stands facing the camera with her arms down at f435-437, then at f438 she is mid-stride and turned side-on: a body turn of about 90° plus a full stride in one frame. `snap_check` rates it high (arms and legs 63°). Fix: turn her over about 6 frames and start the walk from a small first step.
- The low `snap_check` flags are not visible: Max's background arm at f283, Max out of frame at f402, Skye's stepped stair gait, phone and spatula handling. No action.

**RECHECK: MUSTS @ a9896716** (one: f437-438)
