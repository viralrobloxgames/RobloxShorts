> **Example in the Roblox Shorts Studio repo. Finished:** `delivery/The_Free_Coin_Trap.mp4` (21.7 s, 651 frames, farm cost $2.76).
> The notes below are the original production log. FINISH_VIDEO.cmd was replaced by `python source/finish_short.py --encode`,
> which now uses repo-relative assets and the ffmpeg from your settings. Farm PNGs are not in git.

# Finish The Free Coin Trap

## What is ready

An original 21.7-second, 1080 x 1920 Roblox-style comedy with Max and Mia, eight shots, animated coin dispenser, growing coin pile and a final coin bonk. Native character library, animation, George narration, music, sound effects and word-timed captions are saved here.

**The finished MP4 does not exist yet.** No local 3D render was performed. The scene passed a basic camera-framing check; appearance and animation still need review in the farm test.

The scene has been uploaded to your existing GarageFarm account through Brave:

`/The_Free_Coin_Trap_GarageFarm/data/The_Free_Coin_Trap_GarageFarm.blend`

**GarageFarm job 9187976 is DONE: 651 of 651 frames.** The user ran the full render and Codex verified completion in Brave. **Do not render again.** Total farm cost: **$2.76**, account balance: **$47.24**. Current job metadata is in **source\garagefarm_job.json**. The remaining work is downloading the PNGs and running FINISH_VIDEO.cmd. Start at step 7 below.

**APPROVED BUDGET: up to $10 of existing GarageFarm credit for this short, including tests and full render, with no top-up.** The user explicitly approved this in the conversation. Do not ask again within that limit. Track total cost; keep at least $40 of the original balance available.

## Finish in GarageFarm

1. In Brave, open **Jobs** and use the existing test for **The_Free_Coin_Trap_GarageFarm**. Do not submit a duplicate. Only if there is no job: open **Files**, then **The_Free_Coin_Trap_GarageFarm**, then **data**, and click the uploaded `.blend` file.
2. Set **Version = 5.2.1_x64**. The uploader initially defaults to 5.3 alpha, so check this if reopening.
3. Use **PNG**, **1080 x 1920**, **EEVEE**, **Low priority**, **5 frames per execution**. Keep **Test job**, showing **1to651s50 (14 test frames)**. Leave other detected scene settings as supplied. Do not turn on the site's video option; the local finishing step adds the prepared voice and captions.
4. The user already approved **$10 total existing credit, no top-up**. The browser payment rule is satisfied within that limit. Do not spend more or purchase credits.
5. Wait for the existing test to complete. Inspect its images and the full-job cost estimate. Check character faces, text legibility, pressing the button, the coin pile, Mia's payment and the final coin. Full render is still subject to this visual review.
6. If the test looks right and the estimate fits your budget, use the test job's **Render full range** action. Render **1 through 651**, step **1**. The farm documentation says completed test frames are reused. Keep Low priority unless you choose to pay for a faster queue. An estimate is not a guaranteed cap; watch spending, and do not top up automatically.
7. Download the full-resolution PNG sequence. The GarageFarm guide recommends its official **renderBeamer** desktop app for downloading completed frames. If the website offers a ZIP/download option, that works too. Do not use preview thumbnails or screenshots. You need all 651 frames, including the original test frames.
8. Put the 651 PNG files directly into this project's **renders\farm** folder. Keep the frame numbers at the end of the filenames (such as `Free_Coin_Trap_0001.png`). Do not put the ZIP file there without extracting it.
9. Double-click **FINISH_VIDEO.cmd** in this folder. It assembles the farm images with the narration, music, sound effects and highlighted captions. This is video encoding, not local 3D rendering. It checks for missing/duplicate frame numbers and checks that the resulting video decodes.
10. Your final video will be **delivery\The_Free_Coin_Trap.mp4**. Play it through before posting. Nothing has been uploaded to YouTube or published.

## Resume with Codex

Paste this into the next message or task:

> Continue the existing Roblox Short in C:\Users\thoma\Desktop\PS2-SHORTS-COMMUNITY-KIT-v2\projects\roblox\the-free-coin-trap. Read START_HERE.md and source/farm_manifest.json. The scene is already uploaded to GarageFarm in my Brave browser under The_Free_Coin_Trap_GarageFarm/data. Use the existing scene and audio; do not regenerate them or render 3D locally. Check for an existing job before submitting anything. Complete the farm test, review it, render frames 1–651, download the full PNG sequence into renders/farm and run FINISH_VIDEO.cmd. Ask for a GarageFarm spending cap only if one has not already been approved in this conversation. Deliver the checked MP4.

## Saved files

- **The_Free_Coin_Trap_GarageFarm.blend** — packed, baked scene. No external assets or auto-run scripts needed.
- **script.txt** — original narration.
- **audio\narration.mp3** — completed George voice; do not regenerate.
- **audio\final_mix.wav** — prepared 21.7-second soundtrack.
- **audio\alignment\** — recorded word timings and transcript.
- **delivery\The_Free_Coin_Trap.ass** — highlighted captions.
- **delivery\The_Free_Coin_Trap.srt** — subtitle sidecar.
- **source\farm_manifest.json** — scene fingerprint, settings and selected test frames.
- **source\coin_scene.py** — scene authoring source, only needed if the farm test reveals a problem.
- **source\finish_short.py** — audio/caption preparation and final encoder, called by FINISH_VIDEO.cmd.

No new paid narration is needed. No Sketchfab download, native Roblox export, or YouTube publication is involved.
