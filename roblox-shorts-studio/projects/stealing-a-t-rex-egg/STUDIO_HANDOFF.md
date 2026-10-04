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

## Result (local session, 2026-10-03)

Done from the place **"Hunt For Eggs!"** (placeId 129859645860144; the user had this one open, not the "Copy of" place),
`ServerStorage.Assets.Prehistoric`. Details: "Creatures and eggs" in `assets/roblox_pack/README.md`.

- **T-rex: `assets/roblox_pack/creatures/trex/`** = the game's own T-Rex guardian (`PrehistoricModelsII.Tyrannosaurus`, the
  65-part one the roster uses in the Volcano zone). 9.3 x 12.1 x 25.8 studs, head towards -Z, origin at bottom centre
  (`rig.json` `feetCentre` = (0, 0, -1.33) is the point between the feet). No textures: flat part colours.
  - `trex.obj`: **23 objects, one per rigid body**: torso, neck2, neck1, head, mouth (the jaw), arm_L/R + _lower + _hand,
    leg_L/R + _lower + _D + _Hand (the foot), tail01-04. `RootPart` is an invisible root (no geometry).
  - `rig.json`: `bodies[]` (parent, joint `pivot` and `rest` CFrames in model space), `joints[]` (Motor6D C0/C1),
    `attachments[]` (MouthPT in the mouth, MountSeat on the head, ...), `gait` (which bodies are legs, arms, tail, head/neck,
    jaw, root) and every original part.
  - **Animations: none.** The model has an empty AnimationController; the game animates it in code
    (`ReplicatedStorage.CreatureGait`, Motor6D.Transform). `rig.json` `animationNote` gives the cycle's numbers. So the web
    rig poses it the same way: rotate a body about its `pivot` (`pivot * Transform * pivot^-1`); children follow.
    Sleep / roar / headbutt / jaw-open are ours to author on these joints (jaw = `mouth`, neck = `neck2` > `neck1` > `head`).
- **Eggs (`assets/roblox_pack/props/`)**: suggested hero "best egg" = **`egg_prism`** (smooth pink/purple/gold textured egg
  with a ring, 4.2 x 5.2 studs: as tall as an R6 character; its `egg_prism_shimmer` object is a see-through ForceField
  shell, fade or drop it). Nest eggs = **`egg_trex`** (the game's T-rex egg, blocky cream and gold, 6.4 x 8.4, scale down)
  and `egg_basic` (five stacked discs with joints E1U/E2U/E3/E2D/E1D, so it can split open for the hatch beat). 70 more
  eggs alongside (`egg_designer_*` are smooth textured meshes; `egg_rare`, `egg_epic`, ... are the rigged blocky ones).
- **Also added:** 164 more creatures in `assets/roblox_pack/creatures/` (`index.json` lists them): the other dinosaurs
  (`rex`, `t_rex`, `mutated_t_rex`, `cyber_t_rex`, `velociraptor_2`, ...) and 55 small textured pets (`animal_*`:
  static rest pose, good for hatched pets / a baby stand-in is `rex` or `lod_tyrannosaurus` scaled down).
- Previews: `assets/roblox_pack/previews/trex_three_quarter.png`, `trex_front.png`, `trex_side.png` (T-rex, egg_prism,
  egg_trex, egg_basic and a 5-stud R6-sized block character). `tools/preview_obj.py` renders any pack OBJ without three.js.
- Not done here: no Node on this computer, so nothing was loaded in `web/`. Next: a loader for `creatures/<name>` in
  `web/lib/` (build a group per body from rig.json, parent by `bodies[].parent`, pivot at `bodies[].pivot`), replace
  `web/lib/trex.js`, and a look test.
