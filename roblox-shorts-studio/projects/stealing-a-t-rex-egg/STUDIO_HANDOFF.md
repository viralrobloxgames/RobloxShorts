# Hand-off: export the T-rex and egg from Roblox Studio (local agent)

Branch: `ccr-809c0167-fxs8me` (all of this work lives there, not on `main` yet).

## Context
- Short in progress: `projects/stealing-a-t-rex-egg/` ("Stealing a T-Rex Egg", a Steal an Egg parody). Script v2 and the
  shot-by-shot beats are in `script.txt` and `source/story.md` (script not yet approved for narration).
- A hand-built procedural T-rex (`web/lib/trex.js`) was rejected by the user as looking bad. The user has proper T-rex
  and egg models in Roblox Studio and wants those used instead.
- The pack pipeline that built `assets/roblox_pack/` is the one to reuse: Studio place "Copy of Steal a Beast Egg!",
  Studio's own **Export Selection** (OBJ), then `assets/roblox_pack/tools/process_export.py` to split/clean, with the
  Luau helpers in `assets/roblox_pack/tools/luau/` and PowerShell helpers (`studio_focus.ps1`, `save_export_dialog.ps1`,
  `pull_studio_log.py`). Read `assets/roblox_pack/README.md` first (conventions: 1 stud = 1 unit, +Y up, fronts face -Z,
  sRGB Kd, pivots at the origin).

## Task
1. In Studio, find the T-rex model and the egg model(s) the user points to (ask if unsure which). Optional: a nest.
2. Record how the T-rex is built, because it decides how it can be animated in the web renderer:
   - every BasePart (name, class, size, CFrame relative to the model pivot, MeshId/TextureID),
   - every Motor6D/Weld (Part0, Part1, C0, C1) or Bone (name, parent), and every Animation (name, AnimationId).
   Save it as `assets/roblox_pack/creatures/trex/rig.json`.
   If it has Animations or KeyframeSequences, export them like the pack's `animations/*.json` (same CFrame component
   convention as `animations/index.json` describes) into `assets/roblox_pack/creatures/trex/animations/`.
3. Export with Export Selection to OBJ and process into pack folders:
   `assets/roblox_pack/creatures/trex/trex.obj/.mtl/*.png` (if it is a multi-part rig, keep one OBJ object per part,
   named after the part, so the renderer can move parts independently), and `assets/roblox_pack/props/<egg_name>/`.
   Pivots: T-rex feet centre on the ground, facing -Z; eggs bottom centre.
4. Add catalog entries (`assets/roblox_pack/catalog.json`) and credits for any asset IDs (`assets/roblox_pack/CREDITS.md`).
5. Save Studio screenshots of the T-rex and egg (front, side, three-quarter, next to an R6 character for scale) to
   `assets/roblox_pack/previews/trex_*.png`.
6. Commit and push to `ccr-809c0167-fxs8me`. The cloud session will then load the model in `web/` and build a look test.
