> **Example in the Roblox Shorts Studio repo.** Paths below are relative to this project folder.
> Farm frames are not in git. The full 1,935-frame render (job `The_AFK_Champion_GarageFarm_gv004`) was downloaded on the original laptop to
> `~/Old kit/ps2-shorts-studio-leftovers/The_AFK_Champion_GarageFarm/The_AFK_Champion_GarageFarm_gv004-Renders/` (moved from `~/.ps2-shorts-studio/` on 2026-10-01). The MP4 has **not** been encoded yet.
> To finish: copy those PNGs into `renders/farm/` and run `python source/assemble_narration.py`
> (rebuilds `audio/narration.wav`), then `python source/finish_afk.py --encode`.

# The AFK Champion — resume notes

64.5 s TikTok Short (must stay > 60 s). Leo, Max, Mia on Disaster Island. George narration (ElevenLabs, 901 credits total).

## Done
- `script.txt` approved script + two lines added for length ("Here's how.", "Max even typed 'bye Leo' in chat.").
- `audio/narration.wav|mp3` — spliced by `source/assemble_narration.py`; timings in `audio/alignment/`.
- `The_AFK_Champion_GarageFarm.blend` — packed, fully baked (CONSTANT keys), built by `source/afk_scene.py`
  (`blender --background --factory-startup --python source/afk_scene.py`, ~40 s, no rendering).
  Framing + occlusion checks in `source/farm_manifest.json`.
- `source/finish_afk.py` — SFX, music, final mix, ASS captions + round HUD + title pops (already run).

## Rules
- **Never render 3D locally** — the laptop can't handle it. GarageFarm only.
- Full farm render needs the user's spending cap. Never top up credit.

## Next
1. Review the GarageFarm test job (39 frames, 1to1935s50) in the web app (Jobs).
2. If good and the cap allows: render full range 1–1935 from the test job.
3. Download all PNGs into `renders/farm/` (frame numbers at end of names).
4. Run `python source/finish_afk.py --encode`
   → `delivery/The_AFK_Champion.mp4`. Checks gaps/duplicates and full decode.

## Downloading the finished frames (renderBeamer)

1. Open **renderBeamer** (desktop shortcut) and sign in to the same GarageFarm account.
2. Go to the **Download** / **Jobs** section and pick **The_AFK_Champion_GarageFarm_gv004**.
3. Download its **-Renders** output: 1,935 PNGs, roughly 3.5 GB.
4. Put the PNGs directly in `renders\farm\` (keep the frame numbers at the end of each name).
5. Tell Claude, or run:
   `python source/finish_afk.py --encode`
   It checks for gaps/duplicates, mixes the audio and burns the captions, then verifies the MP4 decodes.
