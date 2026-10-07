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
