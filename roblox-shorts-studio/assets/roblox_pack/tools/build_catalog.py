"""Write roblox_pack/catalog.json and CREDITS.md from the processed pack, the export manifests and the upload log.

    python build_catalog.py <pack_dir> <manifest_dir>
"""
import json
import sys
from datetime import date
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
UPLOADS = json.loads((HERE / "uploads.json").read_text(encoding="utf-8"))
ROBLOX_INFO = json.loads((HERE / "roblox_asset_info.json").read_text(encoding="utf-8")) if (HERE / "roblox_asset_info.json").exists() else {}

DESC = {
    # accessories
    "crown_admin": "Gold admin crown with five points and gems (original, CSG band). Sits on the head top.",
    "admin_badge_halo": "Glowing gold halo ring (Neon) with a floating 'ADMIN' badge plate above it. Objects: Halo, Badge, Badge_AdminText (front) and Badge_AdminText_2 (back), BadgeStem.",
    "hair_leo": "Leo's hair: Roblox 'Pal Hair' (free, Roblox-made) with its original dark amber texture. characters/Leo uses a copy brightened toward ginger.",
    "hair_max": "Max's hair: Roblox 'Brown Hair' (free, Roblox-made), short dark brown.",
    "hair_mia": "Mia's hair: Roblox 'Black Ponytail' (free, Roblox-made).",
    "beanie": "Roblox 'Orange Beanie with Black Hair' (free, Roblox-made).",
    "spiky_hair": "Roblox 'Blonde Spiked Hair' (free, Roblox-made).",
    "long_hair": "Roblox 'Straight Blonde Hair' (free, Roblox-made).",
    "cap": "Red baseball cap, no logo (original: CSG half-sphere crown, round brim at the front, button).",
    "headphones": "Over-ear headphones: dark band (CSG arc) and teal cups (original).",
    "top_hat": "Black top hat with a red band (original).",
    # props
    "gold_coin": "Gold coin with raised rim and centre (original). Pivot at its centre, face toward -Z.",
    "coin_pile": "Heap of 36 gold coins (original). Pivot bottom centre.",
    "trophy": "Gold trophy cup on a wooden base (original). Pivot at the stem (grip); base bottom at y = -0.845.",
    "sword": "Classic-style sword: silver blade, gold guard and pommel, leather grip (original). Pivot at the grip, blade along +Y.",
    "rocket_launcher": "Cartoon rocket launcher: olive tube, red-nosed rocket, pistol grip (original, no gore). Pivot at the grip, tube along -Z.",
    "phone": "Smartphone with a glowing screen facing +Z (toward the holder). Pivot at the grip.",
    "tablet": "Tablet (landscape) with a glowing screen facing +Z. Pivot at the grip (bottom edge).",
    "free_coins_button": "Big red 'FREE COINS' button on a base with a sign behind it (original). Pivot bottom centre.",
    "bomb": "Cartoon bomb with fuse and spark (original). Pivot bottom centre.",
    "gift_box": "Red gift box with gold ribbon and bow (original). Pivot bottom centre.",
    # map
    "baseplate_tile_studs": "16x1x16 classic studded baseplate tile (Dark green, studs on top, inlets below).",
    "baseplate_tile_grid": "16x1x16 modern baseplate tile (dark grey + Roblox's grid texture 6372755229 at 0.8 transparency).",
    "spawn_location": "12x1x12 SpawnLocation with Roblox's spawn decal.",
    "finish_pad": "8x1x8 white pad with a black/white checker decal on top.",
    "checkpoint": "6x1x6 green checkpoint SpawnLocation with a flag pole and green flag.",
    "winners_podium": "Winner's podium: 1st (gold, 3 tall, centre), 2nd (silver, 2 tall, +X), 3rd (bronze, 1.4 tall, -X) with number decals on the -Z faces.",
    "lava_strip": "8x1x2 Neon lava strip (orange-red, emissive).",
    "kill_brick": "4x1x4 Neon red kill brick.",
    "truss": "2x16x2 TrussPart (climbable).",
    "ladder": "12-stud wooden ladder (two rails, 11 rungs) with Roblox's Wood material texture.",
    "wedge": "4x2x4 WedgePart ramp (slope faces -Z).",
    "cylinder": "Upright cylinder platform, 4 wide, 2 tall.",
    "ball": "4-stud ball.",
    "stage_sign": "Blank stage sign: 6x2 board on two posts. Board_Face is a separate quad with UVs 0..1 for your text.",
    "leaderboard_board": "Blank leaderboard: 8x5 board on posts. Board_Face (UV 0..1) is blank for drawing.",
    "round_timer_board": "Blank round-timer board: 6x3.4 on posts. Board_Face (UV 0..1) is blank for drawing.",
    "island_small": "Floating island, 12x12 grass top with dirt and stepped rock underside (Grass/Ground/Slate parts, flat colours). Pivot top centre (walkable surface).",
    "island_large": "Floating island, 20x20 grass top with dirt and stepped rock underside (Grass/Ground/Slate parts, flat colours). Pivot top centre (walkable surface).",
    "tree_round": "Classic Roblox tree: cylinder trunk and ball of leaves.",
    "tree_blocky": "Blocky tree: square trunk and three stacked studded leaf blocks.",
    "tycoon_dropper": "Tycoon dropper: post, arm and dropper box with funnel and red light. Drops fall from ~y 4.7.",
    "tycoon_ore": "1x1x1 tycoon drop / ore block (gold).",
    "tycoon_conveyor": "3x16 conveyor belt with arrow texture (points along the belt) and yellow rails.",
    "lobby_platform": "40x2x40 studded lobby platform with a darker trim.",
}
for c in ("red", "orange", "yellow", "green", "blue", "purple"):
    DESC[f"obby_block_{c}_smooth"] = f"4x1x4 obby block, {c}, SmoothPlastic."
    DESC[f"obby_block_{c}_studs"] = f"4x1x4 obby block, {c}, Plastic with studs on top and inlets below."


def bbox(obj_path):
    V = [list(map(float, l.split()[1:4])) for l in open(obj_path, encoding="utf-8") if l.startswith("v ")]
    V = np.array(V)
    lo, hi = V.min(0), V.max(0)
    return {"min": np.round(lo, 3).tolist(), "max": np.round(hi, 3).tolist(), "size": np.round(hi - lo, 3).tolist()}


def objects(obj_path):
    return [l[2:].strip() for l in open(obj_path, encoding="utf-8") if l.startswith("o ")]


def rid(x):
    if x is None:
        return None
    s = str(x)
    return int(s.split("//")[-1].split("=")[-1]) if any(ch.isdigit() for ch in s) and "rbxasset://textures" not in s else s


def main(pack, manifest_dir):
    pack, manifest_dir = Path(pack), Path(manifest_dir)
    manifests = {p.stem.replace("manifest_", ""): json.loads(p.read_text(encoding="utf-8")) for p in manifest_dir.glob("manifest_*.json")}
    items_by_name = {}
    for m in manifests.values():
        for it in m["items"]:
            items_by_name.setdefault(it["item"], it)
    cat = {"pack": "Roblox R6 asset pack for RobloxShorts", "version": "1.0.0", "generated": date.today().isoformat(),
           "units": "studs (1 stud = 1 unit)", "axes": "+Y up; characters face -Z; +X is the character's right; OBJ coordinates are relative to each item's pivot",
           "studio": {"place": "Copy of Steal a Beast Egg! (placeId 121299808702869)", "folder": "Workspace.RobloxAssetPack"},
           "colour": "MTL Kd/Ks/Ke are sRGB; materials with Ke are Roblox Neon; overlays (decals/textures/face) use alpha with d 0.999",
           "characters": [], "faces": {}, "accessories": [], "props": [], "map": [], "animations": "animations/index.json",
           "lighting": "lighting.json", "clothing": [], "decals": []}
    for rig_path in sorted(pack.glob("characters/*/rig.json")):
        rig = json.loads(rig_path.read_text(encoding="utf-8"))
        name = rig["name"]
        obj = rig_path.parent / rig.get("objFile", f"{name}.obj")
        e = {"name": name, "path": f"characters/{name}/{obj.name}", "rig": f"characters/{name}/rig.json",
             "objects": objects(obj) if obj.exists() else [], "dimensions": bbox(obj) if obj.exists() else None,
             "pivot": "feet centre on the ground (origin), facing -Z", "bodyColors": rig["bodyColors"],
             "textures": sorted(p.name for p in rig_path.parent.glob("*.png")),
             "faces": f"characters/{name}/faces/<expression>/face.png + head.obj/.mtl",
             "clothing": rig.get("clothing"), "hair": [{"name": a["name"], "sourceAssetId": a.get("sourceAssetId"), "item": a.get("packItem")} for a in rig["accessories"]],
             "source": {"rig": "Players:CreateHumanoidModelFromDescription(..., R6) (Roblox's own R6 rig)",
                        "meshes": "R6 body-part mesh (box with 0.065 stud bevel) and head / face-decal meshes as Studio exports them",
                        "robloxMade": "rig, meshes and hair yes; clothing templates and faces are ours",
                        "built": "tools/build_characters_local.py"}}
        cat["characters"].append(e)
    fm = json.loads((pack / "faces" / "faces.json").read_text(encoding="utf-8"))
    cat["faces"] = {"master": "faces/<expression>.png (1024x1024, transparent)", "layers": "faces/layers/eyes|mouth/<expression>.png",
                    "sheet": "faces/face_sheet.png", "eye_centres_uv": fm["eye_centres_uv"], "count": len(fm["faces"]),
                    "list": [{"name": f["name"], "group": f["group"], "aliases": f["aliases"], "description": f["description"],
                              "robloxDecalAsset": UPLOADS["faces"].get(f["name"])} for f in fm["faces"]]}
    for cat_name in ("accessories", "props", "map"):
        for d in sorted((pack / cat_name).iterdir() if (pack / cat_name).exists() else []):
            if not d.is_dir():
                continue
            obj = d / f"{d.name}.obj"
            it = items_by_name.get(d.name, {})
            overlays = sorted({o["texture"] for p in it.get("parts", []) for o in p.get("overlays", [])})
            src_id = it.get("sourceAssetId")
            e = {"name": d.name, "path": f"{cat_name}/{d.name}/{obj.name}", "description": DESC.get(d.name, ""),
                 "objects": objects(obj) if obj.exists() else [], "dimensions": bbox(obj) if obj.exists() else None,
                 "pivot": {"kind": it.get("pivotKind"), "attachment": it.get("attachment"), "attachTo": it.get("attachTo")},
                 "source": {"robloxAssetId": src_id, "robloxMade": bool(src_id), "free": True,
                            "built": "Roblox catalog item inserted with InsertService" if src_id else "original, built from Parts/CSG in Studio for this pack",
                            "decalTextures": overlays or None}}
            if it.get("kind") == "prop_handheld":
                e["hold"] = ("Roblox Tool with Grip = identity: Handle frame = OBJ frame. R6 hold: RightArm.CFrame * CFrame.new(0,-1,0) * "
                             "CFrame.Angles(-pi/2,0,0); with the tool_hold animation +Y points up and -Z forward.")
            if cat_name == "accessories":
                off = {"HatAttachment": [0, 0.6, 0], "HairAttachment": [0, 0.6, 0], "FaceFrontAttachment": [0, 0, -0.6]}.get(it.get("attachment"))
                e["attach"] = f"Head.CFrame * CFrame.new({off[0]}, {off[1]}, {off[2]}) ({it.get('attachment')}); in character space the head centre is (0, 4.5, 0)" if off else None
            cat[cat_name].append(e)
    for p in sorted((pack / "clothing").glob("*.png")):
        cat["clothing"].append({"path": f"clothing/{p.name}", "robloxImageAsset": UPLOADS["clothing"].get(p.stem), "size": [585, 559], "type": p.stem.split("_")[0]})
    for p in sorted((pack / "decals").glob("*.png")):
        cat["decals"].append({"path": f"decals/{p.name}", "robloxImageAsset": UPLOADS["decals"].get(p.stem)})
    anim = json.loads((pack / "animations" / "index.json").read_text(encoding="utf-8"))
    cat["counts"] = {"characters": len(cat["characters"]), "faces_per_character": cat["faces"]["count"], "accessories": len(cat["accessories"]),
                     "props": len(cat["props"]), "map": len(cat["map"]), "animations": anim["count"]}
    (pack / "catalog.json").write_text(json.dumps(cat, indent=1), encoding="utf-8")
    write_credits(pack, cat, anim, manifests)
    print("catalog:", cat["counts"])


def write_credits(pack, cat, anim, manifests):
    info = ROBLOX_INFO.get("info", {})

    def row(aid, name, used, made, free="Free", creator=None):
        i = info.get(str(aid), {})
        creator = creator or i.get("creator") or ("Roblox" if made == "Yes" else "")
        return f"| {aid} | {i.get('name') or name} | {creator} | {free} | {made} | {used} |"
    L = ["# Credits and asset sources", "",
         "Every Roblox asset used by the pack. **Roblox-made** means the creator is Roblox. **Ours** means an original image made for "
         "this pack and uploaded to the account `theshermanator9` (user 9114155701). No paid UGC and no Roblox logo or wordmark is used.", "",
         "## Roblox-made assets", "", "| Asset ID | Name | Creator | Free / owned | Roblox-made | Used for |", "|---|---|---|---|---|---|"]
    hair_ids = {"hair_leo": 63690008, "hair_max": 62234425, "hair_mia": 376527350, "beanie": 1103003368, "spiky_hair": 376524487, "long_hair": 376526888}
    for item, aid in hair_ids.items():
        used = f"accessories/{item}" + (f", characters/{item.split('_')[1].title()}" if item.startswith("hair_") else "")
        if item == "hair_leo":
            used += " (the character copy of the texture is brightened toward ginger)"
        L.append(row(aid, item, used, "Yes"))
    for mref in ROBLOX_INFO.get("meshTextureRefs", []):
        item, kind, aid = mref.split(" ")
        L.append(row(aid, f"{item} {kind}", f"accessories/{item} ({kind} of the item above)", "Yes"))
    L.append(row(144075659, "Smile", "default face on the Studio characters (rbxasset://textures/face.png); faces/happy.png is a vector redraw", "Yes"))
    L += ["| built-in | rbxasset://textures/SpawnLocation.png | Roblox | Free | Yes | map/spawn_location, map/checkpoint decal |",
          "| built-in | Roblox Wood material texture (Studio) | Roblox | Free | Yes | roblox_wood_diff.png on map/ladder and the sign / board posts (512 px copy of Studio's export) |",
          "| built-in | Roblox surfaces texture (studs / inlets) | Roblox | Free | Yes | roblox_studs_*.png / roblox_inlet_*.png on studded parts (cut from Studio's OBJ export) |",
          "| built-in | Classic R6 rig, R6 body-part mesh, head mesh (SpecialMesh Head) and R6 Animate script | Roblox | Free | Yes | characters (Players:CreateHumanoidModelFromDescription) |", ""]
    L += ["## Roblox default-template images (free, uploaded by user accounts)", "",
          "Roblox puts these images in its own default Baseplate template, but the asset creator is a user account, not the "
          "Roblox account, so they are marked not Roblox-made. They are free. Only the grid texture is baked into a pack OBJ.", "",
          "| Asset ID | Name | Creator | Free / owned | Roblox-made | Used for |", "|---|---|---|---|---|---|"]
    for aid, what in ((6444884337, "sky sides"), (6444884785, "sky bottom"), (6412503613, "sky top"), (6196665106, "sun"), (6444320592, "moon")):
        L.append(row(aid, what, f"lighting.json / LightingPreset ({what}) - reference only", "No"))
    L.append(row(6372755229, "baseplate grid texture", "map/baseplate_tile_grid (Tile_Grid overlay)", "No"))
    L.append("")
    L += ["## Roblox default R6 animations (KeyframeSequenceProvider)", "", "| Asset ID | Name | Creator | Free / owned | Roblox-made | File |", "|---|---|---|---|---|---|"]
    for a in anim["animations"]:
        if a["type"] == "roblox_default":
            L.append(f"| {a['assetId']} | {a['description']} | Roblox | Free | Yes | animations/{a['name']}.json |")
    L += ["", "## Our uploads (original images, account theshermanator9)", "", "| Asset ID | File | Free / owned | Roblox-made | Used for |", "|---|---|---|---|---|"]
    for k, v in UPLOADS["clothing"].items():
        L.append(f"| {v.split('//')[-1]} | clothing/{k}.png | Owned (ours) | No | {'Shirt' if k.startswith('shirt') else 'Pants'} template for {k.split('_')[1].title()} |")
    for k, v in UPLOADS["faces"].items():
        L.append(f"| {v.split('//')[-1]} | faces/{k}.png | Owned (ours) | No | face decal '{k}' (Studio face sheet) |")
    for k, v in UPLOADS["decals"].items():
        L.append(f"| {v.split('//')[-1]} | decals/{k}.png | Owned (ours) | No | decal on the {k.replace('_', ' ')} |")
    for k, v in UPLOADS["diagnostics"].items():
        L.append(f"| {v.split('//')[-1]} | (test image, not shipped) | Owned (ours) | No | one-off template-mapping test in the pilot export |")
    L += ["", "## Other", "", "- Luckiest Guy font (Apache 2.0, `roblox-shorts-studio/assets/fonts/`) for the text on the ADMIN, FREE COINS and podium decals.",
          "- Everything else (crown, halo badge, cap, headphones, top hat, all props and map items, faces, clothing templates, authored poses) is original work made for this pack.", ""]
    (pack / "CREDITS.md").write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
