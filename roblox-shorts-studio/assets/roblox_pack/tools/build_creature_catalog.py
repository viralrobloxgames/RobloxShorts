"""Add the creatures and eggs built by build_creatures.py to catalog.json and CREDITS.md, and write creatures/index.json.

Run after build_catalog.py (which rewrites both files from scratch):

    python build_creature_catalog.py <pack_dir>
"""
import json
import sys
from pathlib import Path

from build_catalog import bbox

PLACE = 'the user\'s own Roblox place "Hunt For Eggs!" (placeId 129859645860144), ServerStorage.Assets.Prehistoric'
MARK = "## Creatures and eggs (from the user's game)"

# What each family of models in the place is, by how it is built.
def family(meta):
    src = meta["sourceName"]
    if src.startswith("PetLOD/"):
        return "low-detail static pet (no joints)"
    if meta["bones"]:
        return "skinned mesh with bones (exported in its rest pose; the bones are listed in rig.json)"
    if meta["joints"]:
        return "Motor6D rig of rigid parts"
    return "static model"


DESC = {
    "trex": "The game's T-Rex guardian (green with a tan belly, red crest and neon-yellow eyes): 23 movable bodies with a jaw (mouth), two neck "
            "segments, head, 3-joint arms, 4-joint legs and a 4-segment tail. Hero creature of 'Stealing a T-Rex Egg'.",
    "egg_trex": "The game's Tyrannosaurus egg: blocky cream egg with gold bands, built from Parts.",
    "egg_basic": "Classic tan egg made of five stacked discs, rigged (E1U/E2U/E3/E2D/E1D) so the top and bottom can split to hatch.",
    "egg_prism": "Smooth pink-white Prism egg (textured mesh) on a pale blue glass ring: the game's showpiece egg.",
}


def main(pack):
    pack = Path(pack)
    cat = json.loads((pack / "catalog.json").read_text(encoding="utf-8"))
    creatures, eggs = [], []
    for meta_path in sorted(pack.glob("creatures/*/item.json")) + sorted(pack.glob("props/egg_*/item.json")):
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        d = meta_path.parent
        name = d.name
        obj = d / f"{name}.obj"
        rel = d.relative_to(pack).as_posix()
        e = {"name": name, "path": f"{rel}/{name}.obj",
             "description": DESC.get(name) or f"{meta['sourceName']} from the game: {family(meta)}.",
             "objects": meta["objects"], "dimensions": bbox(obj),
             "pivot": {"kind": "bottom_centre", "facing": "-Z" if meta["facingKnown"] else "as authored (no head/tail parts to measure)"},
             "rigged": meta["rigged"], "joints": meta["joints"], "bones": meta["bones"],
             "textures": sorted(p.name for p in d.glob("*.png")),
             "source": {"place": PLACE, "model": meta["sourcePath"], "robloxMade": False, "meshIds": meta["meshIds"], "textureIds": meta["textureIds"]}}
        if meta["rigged"]:
            e["rig"] = f"{rel}/rig.json"
        (creatures if rel.startswith("creatures/") else eggs).append(e)
    cat["creatures"] = creatures
    egg_names = {e["name"] for e in eggs}
    cat["props"] = sorted([p for p in cat["props"] if p["name"] not in egg_names] + eggs, key=lambda p: p["name"])
    cat.setdefault("counts", {})["creatures"] = len(creatures)
    cat["counts"]["props"] = len(cat["props"])
    cat["counts"]["eggs"] = len(eggs)
    (pack / "catalog.json").write_text(json.dumps(cat, indent=1), encoding="utf-8")
    (pack / "creatures" / "index.json").write_text(json.dumps(
        {"count": len(creatures), "conventions": "1 stud = 1 unit, +Y up, front faces -Z, origin = bottom centre. One OBJ object per rigid body; "
                                                 "rig.json gives each body's parent and joint pivot.",
         "creatures": [{"name": c["name"], "path": c["path"], "rig": c.get("rig"), "size": c["dimensions"]["size"], "joints": c["joints"],
                        "bones": c["bones"], "description": c["description"]} for c in creatures]}, indent=1), encoding="utf-8")

    credits = (pack / "CREDITS.md").read_text(encoding="utf-8")
    if MARK in credits:
        credits = credits[:credits.index(MARK)].rstrip() + "\n"
    n_mesh = len({m for e in creatures + eggs for m in e["source"]["meshIds"]})
    n_tex = len({t for e in creatures + eggs for t in e["source"]["textureIds"]})
    L = ["", MARK, "",
         f"`creatures/*` ({len(creatures)} models) and `props/egg_*` ({len(eggs)} eggs) were exported from {PLACE}, the game the "
         "'Steal an Egg' shorts are about. They are the models that game uses for its guardians, pets and eggs (Toolbox model packs the "
         "user added to their game, including the folder \"Prehistoric Animals Pack - Uqel\"); they are **not Roblox-made and not original "
         "to this pack**. Use them for videos about this game.", "",
         f"The models reference {n_mesh} mesh assets and {n_tex} texture assets; every ID is listed per item in `catalog.json` "
         "(`source.meshIds`, `source.textureIds`) and in each item's `item.json`.", "",
         "| Item | Studio model | Built as | Mesh IDs | Texture IDs |", "|---|---|---|---|---|"]
    for e in creatures + eggs:
        meta = json.loads((pack / Path(e["path"]).parent / "item.json").read_text(encoding="utf-8"))
        L.append(f"| {e['path'].rsplit('/', 1)[0]} | {meta['sourcePath'].split('.')[-1]} | {family(meta)} | {len(e['source']['meshIds'])} | {len(e['source']['textureIds'])} |")
    (pack / "CREDITS.md").write_text(credits + "\n".join(L) + "\n", encoding="utf-8")
    print(f"creatures: {len(creatures)}, eggs: {len(eggs)}, mesh ids: {n_mesh}, texture ids: {n_tex}")


if __name__ == "__main__":
    main(sys.argv[1])
