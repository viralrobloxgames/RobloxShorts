# Roblox R6 asset pack

Authentic-looking Roblox R6 characters, faces, accessories, props, map pieces and animation data for the web
(three.js) renderer in `roblox-shorts-studio/web/`. Everything was built in Roblox Studio (place "Copy of Steal a
Beast Egg!", folder `Workspace.RobloxAssetPack`) and exported with Studio's own **Export Selection** (OBJ). The raw
exports were then split into one folder per item and cleaned up by the scripts in `tools/`. This pack replaces the
hand-made placeholder cast (6 faces, 8 procedural motions).

## Layout

```
roblox_pack/
  characters/<Name>/          Leo, Max, Mia, Noob, Skye (ViralRoblox News presenter; glam faces, pink hair)
    <Name>.obj/.mtl           objects: Head, Face, Torso, Left Arm, Right Arm, Left Leg, Right Leg (+ Hair)
    <name>_composite.png      R6 body atlas: body colours + Pants + Shirt, 1024x1024 at 128 px per stud
    <name>_body.png           the same atlas, body colours only        (recolour gags: tint this...)
    <name>_clothing.png       clothing only, transparent elsewhere     (...then lay this on top)
    <name>_hair.png, face.png hair texture; default face (happy)
    rig.json                  part sizes, Motor6D C0/C1, joint pivots, attachments, accessory offsets, clothing IDs
    faces/<expression>/       face.png (1024 px, transparent) + head.obj/.mtl with that face applied
  faces/                      master face set: <expression>.png, layers/eyes|mouth/, faces.json, face_sheet.png
  accessories/<item>/         crown_admin, admin_badge_halo, hair_leo|max|mia|skye, cap, beanie, headphones, top_hat, spiky_hair, long_hair
  props/<item>/               gold_coin, coin_pile, trophy, sword, rocket_launcher, phone, tablet, free_coins_button, bomb, gift_box
  map/<item>/                 36 pieces: baseplate tiles, spawn, 12 obby blocks, lava, kill brick, checkpoint, truss, ladder,
                              wedge, cylinder, ball, stage sign, finish pad, podium, lobby, islands, trees, tycoon dropper/ore/conveyor,
                              leaderboard and round-timer boards
  animations/<name>.json      24 Roblox default R6 animations + 27 authored poses/loops, animations/index.json
  clothing/                   the Shirt/Pants templates (585x559) worn by Leo, Max, Mia and Skye
  decals/                     original decal images used on props and map pieces
  lighting.json               sky asset IDs and bright-obby lighting values
  catalog.json                every asset: path, description, objects, dimensions, pivot, source asset IDs
  CREDITS.md                  every Roblox asset ID with creator, free/owned and Roblox-made
  validation.json             result of tools/validate_pack.py
  previews/                   Studio screenshots of the lineup and face sheet (only when Studio could render; see below)
  studio/RobloxAssetPack.rbxm the whole Studio build as a model file: characters (Humanoid, Shirt/Pants, hair), accessories,
                              props, map kit, LightingPreset, FaceSheet. In Studio: right-click Workspace > Insert from File.
  tools/                      the scripts that built and exported everything (see "Rebuilding")
  _studio_raw/                raw Studio exports (git-ignored)
```

## Conventions

- **Scale:** 1 stud = 1 unit. An R6 character is 5 studs tall to the top of the head: legs 2, torso 2, head ~1.2.
- **Axes:** +Y up. Characters and the fronts of items face **-Z**; +X is the character's right. This is Roblox's own
  convention. The old `web/lib/rig.js` cast faced +Z, so rotate a pack character by π about Y to drop it into an existing clip.
- **Pivots:** every OBJ is moved so its pivot is at the origin:
  - characters: feet centre on the ground;
  - accessories: their attachment point on the head (`HatAttachment`/`HairAttachment` = head centre + (0, 0.6, 0));
    this point sits inside most hairstyles, so never place accessories at it directly: use `wear()` / `fitAccessory()`
    in `web/lib/robloxPack.js`, and run `node web/fit_check.mjs` (see `web/README.md`) before any full render;
  - handheld props: the grip, in Roblox tool-handle orientation;
  - world props and map pieces: bottom centre (islands: top centre).
  `catalog.json` gives each item's pivot kind and bounding box.
- **Names:** folders and files are lower_snake_case with no spaces. Object names inside the OBJs are the Roblox part
  names, e.g. `Left Arm` (`o Left Arm`; three.js OBJLoader keeps the full name). Decal and texture overlays are
  separate objects called `<Part>_<Decal>`, e.g. `Board_Face` or `SpawnLocation_Decal`.
- **Materials (MTL):**
  - Kd/Ks/Ke are sRGB (Studio writes linear Kd; the scripts convert it).
  - Materials with **Ke** are Roblox **Neon**: render them emissive and let bloom catch them.
  - Overlays and faces have alpha, with `d 0.999` so MTLLoader turns transparency on. Keep `depthWrite` on and draw them after the base mesh.
  - Studded faces use Roblox's own stud tile (`roblox_studs_diff.png` + normal map `norm roblox_studs_nmap.png`) at 1 tile per stud.
  - Texture wrap must be Repeat (MTLLoader's default).
  - Roblox's modern material textures only reach the OBJ once Studio has streamed them in at full resolution. Wood
    did (`roblox_wood_diff.png`, a 512 px copy, tinted by Kd like in Roblox); Grass, Ground, Slate and Metal only came
    through as 32-64 px placeholders, so those parts are flat colour.

## Characters and animation

`rig.json` holds each joint's `C0`, `C1`, `part0`, `part1` and its pivot in character space: Neck (0,4,0),
shoulders (±1,3.5,0), hips (±1,2,0), RootJoint (0,3,0). Roblox's formula is

```
Part1.CFrame = Part0.CFrame * C0 * Transform * C1:Inverse()
```

The animation files give `Transform` per joint per keyframe as Roblox CFrame components
`[x,y,z,R00,R01,R02,R10,R11,R12,R20,R21,R22]` (row-major). In three.js, build a Matrix4 from the components and compose
it the same way. The OBJ is in the rest pose, so for each part take `rest = Part0 * C0 * C1^-1` from rig.json and apply
the delta. Easing on a pose runs from its keyframe to the next. The R6 `run` is the walk played at speed WalkSpeed/14.5.
Roblox's `point` uses the left arm; `point_forward` is a right-arm version.

Swap expressions by changing the `Face` material's texture (or use `faces/<expression>/head.obj`). Every face keeps its
eyes at the Roblox Smile's eye positions, `faces.json:eye_centres_uv`, so faces swap mid-shot without a jump. Lip-sync
set: `mouth_closed`, `mouth_small`, `mouth_wide`, `mouth_o`, `mouth_e` (same eyes, only the mouth changes). The eyes and
mouths are also separate layers in `faces/layers/`, so you can blink over any mouth.

Hair is its own object (`Hair`) and its own accessory OBJ (`accessories/hair_<name>`). Attach extra accessories at
head centre + the attachment offset listed in `catalog.json`. Leo's character copy of the Pal Hair texture is
brightened toward ginger (the brief's look); `accessories/hair_leo` keeps Roblox's original colours.

### How the characters were built

Studio writes a character's clothing atlas, its head mesh and its face decal into an OBJ only while the Studio window
is active and rendering. The characters were therefore assembled by `tools/build_characters_local.py` from pieces
that are all Roblox's or ours:

- Torso, arms and legs use Roblox's R6 body-part mesh exactly as Studio exports it: a box with a 0.065 stud bevel on
  every edge (44 triangles).
- The head and the face layer are the R6 head mesh (`SpecialMesh` Head at scale 1.25) and its face-decal mesh from a
  Studio export.
- Hair is the accessory export, placed at the head's `HairAttachment` (0, 5.1, 0).
- The atlas is composited the way Roblox does classic clothing: body colour, then Pants (torso and legs), then Shirt
  (torso and arms). It uses the same Shirt/Pants designs as the uploaded templates, rendered at 2x (128 px per stud)
  so close-ups stay sharp.

Every template region is drawn as seen from outside, with image-up = +Y. On the side faces, image-right runs:

| Face | Image-right points to |
|---|---|
| Front | −X |
| Back | +X |
| Right (+X) | −Z |
| Left (−X) | +Z |

The head uses a skin swatch inside the same atlas, so swapping the atlas recolours the whole body.

`tools/build_characters.py` is the alternative path: it builds the same folders from a rendered Studio export (Studio's
own 1024x512 atlas). Use it once the export runs while Studio is the active window.

## Faces (32)

**Glam style** (`faces/glam/`, made by `tools/make_glam_faces.py` from the eye and mouth layers): the same 32 expressions with lashes, eye sparkle, blush and berry lips, eyes in the same place. Skye (the ViralRoblox News presenter) uses it; `FACE_STYLE` in `web/lib/robloxPack.js` and `tools/build_characters_local.py` picks it per character.
`studio/RobloxAssetPack.rbxm` predates Skye: her Studio model is `Workspace.RobloxAssetPack.Characters.Skye` in the place.

happy (Roblox Smile, redrawn), neutral, surprised, angry, sad, laugh, smug, evil_grin, scheming, scared (panic),
crying, dizzy, confused, annoyed (deadpan), shocked, determined, wink, sleeping (sleepy/AFK), nervous (sweat), love
(heart eyes), cool (sunglasses), blink, suspicious, shouting, knocked_out, disgusted, talking, plus the lip-sync set
mouth_closed/small/wide/o/e. This covers all 18 CircleToons faces (with their names) plus the brief's list.

## Rebuilding

The scripts in `tools/` are the source of truth:

| Script | What it does |
|---|---|
| `make_faces.py`, `make_clothing.py`, `make_decals.py` | draw faces, Shirt/Pants templates and decal images |
| `luau/stage_characters.luau`, `luau/stage_batch.luau` | clone items into a staging folder with unique part tags, print a manifest |
| `save_export_dialog.ps1` | fills Studio's Export Selection dialog and clicks Save (no manual clicks) |
| `studio_focus.ps1` | brings Studio to the front while exporting (Studio only renders meshes and clothing while active) |
| `pull_studio_log.py` | reads data that Luau printed into Studio's log (Luau cannot write files) |
| `process_export.py` | splits and cleans the raw OBJ exports (map, accessories, props) into the pack folders; rebuilds decal quads from the pack's own PNGs when Studio did not write them |
| `build_characters_local.py` | characters from the R6 part meshes, Studio's head/face meshes, the accessory hair and the clothing designs |
| `build_characters.py` | characters from a rendered Studio character export (alternative) |
| `manifests/` | the export manifests (part tags, CFrames, colours, materials, decals) the processing scripts read |
| `builtin_textures/`, `surface_tiles/` | Roblox built-in images used by the map (SpawnLocation decal, stud and inlet tiles, grid) |
| `build_rigs.py`, `make_poses.py`, `build_animations.py` | rig.json and animations |
| `build_catalog.py`, `validate_pack.py` | catalog.json, CREDITS.md, validation.json |

Studio side: `Players:CreateHumanoidModelFromDescription(desc, R6)` builds the genuine R6 rig. Exports go through
`PluginManager():ExportSelection()`, whose file dialog `save_export_dialog.ps1` completes.
