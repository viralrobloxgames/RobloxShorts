"""Turn a Studio OBJ batch staged by luau/stage_creatures.luau into pack folders: rigged creatures and eggs.

Each item becomes <pack>/<category>/<item>/<item>.obj/.mtl (+ textures) with ONE OBJ OBJECT PER RIGID BODY: every part
welded to a Motor6D-driven part is merged into that part's object (named after it: torso, head, mouth, leg_L, tail01,
...), so the renderer can turn each object about its joint. Materials are shared per colour. A model with joints or
bones also gets rig.json: bodies with their parent joint and pivot, the Motor6Ds (C0/C1), bones, attachments, the
original parts, and how the game's procedural gait (ReplicatedStorage.CreatureGait) reads the rig.

Pivot at the origin = bottom centre of the model (feet on the ground), front faces -Z, 1 stud = 1 unit, +Y up.

    python build_creatures.py <raw_dir> <obj_name> <manifest.json> <pack_dir> [item,item,...]
"""
import json
import sys
from pathlib import Path

import numpy as np

from process_export import Writer, cf_matrix, face_arrays, read_mtl, read_obj, safe, srgb_from_rgb255

import re

# How ReplicatedStorage.CreatureGait sorts Motor6D joints (by the driven part's name when the joint is called "Motor6D").
DOWNSTREAM = ("lower", "knee", "ankle", "foot", "elbow", "wrist", "hand", "toe")


def side_of(key):
    if "left" in key or re.search(r"_l$|_l\d", key):
        return -1
    if "right" in key or re.search(r"_r$|_r\d", key):
        return 1
    return None


def classify(joints, root):
    g = {"back": [], "front": [], "tail": [], "head": [], "jaw": [], "root": None, "downstream": []}
    for j in joints:
        key = (j["part1"] if j["name"] in ("Motor6D", "") else j["name"]).lower()
        s = side_of(key)
        if "tail" in key:
            g["tail"].append(j["part1"])
        elif "mouth" in key or "jaw" in key:
            g["jaw"].append(j["part1"])
        elif "head" in key or "neck" in key:
            g["head"].append(j["part1"])
        elif any(b in key for b in DOWNSTREAM) or re.search(r"_d$", key):
            g["downstream"].append(j["part1"])
        elif s and ("leg" in key or "hip" in key):
            g["back"].append({"body": j["part1"], "side": s})
        elif s and ("arm" in key or "shoulder" in key or "wing" in key):
            g["front"].append({"body": j["part1"], "side": s})
        elif j["part0"] == root:
            g["root"] = j["part1"]
    g["tail"].sort()
    return g


def feet_centre(bodies):
    """Ground point midway between the feet (x, 0, z) from the foot bodies' joint pivots; None when no feet are named."""
    feet = [b["pivot"] for b in bodies if re.search(r"foot|leg.*hand|toe", b["name"].lower())]
    if not feet:
        return None
    return [round(sum(f[0] for f in feet) / len(feet), 3), 0, round(sum(f[2] for f in feet) / len(feet), 3)]


def comp(m):
    """4x4 matrix -> Roblox CFrame components [x,y,z,R00..R22]."""
    return [round(float(v), 4) for v in (m[0, 3], m[1, 3], m[2, 3], *m[0, :3], *m[1, :3], *m[2, :3])]


def material_for(w, part, tex):
    kd = srgb_from_rgb255(part["color"])
    d = round(1 - part.get("transparency", 0), 3)
    neon = part.get("material") in ("Neon", "ForceField")
    if part.get("material") == "ForceField":
        d = min(d, 0.3)
    shiny = part.get("material") in ("Metal", "Foil", "DiamondPlate", "Glass") or part.get("reflectance", 0) > 0.05
    if tex:
        name = "tex_" + safe(Path(tex).stem)
        kw = dict(Kd=(1, 1, 1), d=d, map_Kd=tex)
    else:
        name = "c_{:02x}{:02x}{:02x}".format(*part["color"]) + ("_neon" if neon else "") + ("_shiny" if shiny else "") + (f"_a{int(d * 100)}" if d < 1 else "")
        kw = dict(Kd=kd, d=d)
    if neon:
        kw["Ke"] = kd
    if shiny:
        kw.update(Ks=(0.45, 0.45, 0.45), Ns=120)
    if name not in w.materials:
        w.add_material(name, **kw)
    return name


def build(raw_dir, obj_name, manifest_path, pack_dir, only=None):
    raw_dir, pack_dir = Path(raw_dir), Path(pack_dir)
    V, VT, VN, groups = read_obj(raw_dir / obj_name)
    mtls = read_mtl(raw_dir / obj_name.replace(".obj", ".mtl"))
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    by_tag = {}
    for gname, g in groups.items():
        m = re.match(r"^(.*?)(\d+)$", gname)
        if m:
            by_tag.setdefault(m.group(1).lower(), []).append((int(m.group(2)), gname, g))
    for v in by_tag.values():
        v.sort()
    report = []
    for item in manifest["items"]:
        if only and item["item"] not in only:
            continue
        out_dir = pack_dir / item["folder"]
        M = np.linalg.inv(cf_matrix(item["pivot"]))
        rigged = bool(item["joints"] or item["bones"])
        header = (f"Roblox asset pack: {item['item']} ({item['category']}), from the Studio model \"{item['sourceName']}\". Exported with Export "
                  f"Selection, split by tools/build_creatures.py: one object per rigid body. Units: studs. +Y up, front faces -Z, "
                  f"pivot (bottom centre) at the origin.")
        w = Writer(item["item"], out_dir, header)
        chunks = {}                 # body -> {material: faces}
        order = []
        missing, tex_count, overlays = 0, 0, 0
        for part in item["parts"]:
            entries = by_tag.get(part["tag"].lower(), [])
            if not entries:
                missing += 1
                continue
            body = part["body"]
            if part.get("material") == "ForceField":          # a see-through shimmer shell drawn over the real surface
                body = f"{body}_shimmer"
            if body not in chunks:
                chunks[body] = {}
                order.append(body)
            textured = bool(part.get("textureId") or part.get("surfaceAppearance") or (part.get("specialMesh") or {}).get("textureId"))
            for n_idx, (_, gname, g) in enumerate(entries):
                faces = face_arrays(V, VT, VN, g["faces"], M)
                src_tex = mtls.get(g["mtl"], {}).get("map_Kd")
                has_tex = src_tex and (raw_dir / src_tex).exists()
                if n_idx > 0:                                   # a decal Studio wrote as its own group
                    if not has_tex:
                        continue
                    overlays += 1
                    oname = f"{body}_decal{overlays}"
                    tex = w.add_texture(raw_dir / src_tex, oname)
                    mat = w.add_material(safe(oname), Kd=(1, 1, 1), d=0.999, map_Kd=tex, Ks=(0.02, 0.02, 0.02))
                    chunks.setdefault(oname, {})[mat] = faces
                    order.append(oname)
                    continue
                tex = None
                if textured and has_tex:
                    tex = w.add_texture(raw_dir / src_tex, part["tag"])
                    tex_count += 1
                mat = material_for(w, part, tex)
                chunks[body].setdefault(mat, []).extend(faces)
        for body in order:
            w.add_object(body, [(m, f) for m, f in chunks[body].items() if f])
        w.write()

        if rigged:
            parent = {j["part1"]: j for j in item["joints"]}
            bodies = []
            for b in item["bodies"]:
                j = parent.get(b["name"])
                bodies.append({"name": b["name"], "parent": j["part0"] if j else None, "joint": j["name"] if j else None,
                               "pivot": comp(M @ cf_matrix(j["world"])) if j else comp(M @ cf_matrix(b["cframe"])),
                               "rest": comp(M @ cf_matrix(b["cframe"])), "hasGeometry": b["name"] in chunks})
            rig = {
                "name": item["item"], "source": item["sourcePath"], "sourceName": item["sourceName"],
                "conventions": "1 stud = 1 unit, +Y up, front faces -Z, +X is the creature's right, origin = bottom centre (feet on the ground). "
                               "CFrames are Roblox components [x,y,z,R00,R01,R02,R10,R11,R12,R20,R21,R22] (row-major) in this model space. "
                               "Each OBJ object is one body. To pose: Part1 = Part0 * C0 * Transform * C1^-1, or simply rotate a body (and its "
                               "children) about its `pivot` (the joint's rest frame in model space: apply pivot * Transform * pivot^-1).",
                "size": item["size"], "root": item.get("root"), "feetCentre": feet_centre(bodies), "bodies": bodies,
                "joints": [{"name": j["name"], "part0": j["part0"], "part1": j["part1"], "c0": j["c0"], "c1": j["c1"],
                            "pivot": comp(M @ cf_matrix(j["world"]))} for j in item["joints"]],
                "bones": [{"name": b["name"], "parent": b["parent"], "parentIsBone": b["parentIsBone"], "cframe": b["cframe"],
                           "world": comp(M @ cf_matrix(b["world"]))} for b in item["bones"]],
                "attachments": [{"name": a["name"], "body": a["body"], "cframe": comp(M @ cf_matrix(a["world"]))} for a in item["attachments"]],
                "animations": item["animations"], "keyframeSequences": item["keyframeSequences"],
                "gait": classify(item["joints"], item.get("root")),
                "parts": [{"object": p["body"], "name": p["name"], "class": p["class"], "size": p["size"], "cframe": comp(M @ cf_matrix(p["cframe"])),
                           "color": p["color"], "material": p["material"], **({"meshId": p["meshId"]} if p.get("meshId") else {}),
                           **({"textureId": p["textureId"]} if p.get("textureId") else {})} for p in item["parts"]],
            }
            if not item["animations"] and not item["keyframeSequences"]:
                rig["animationNote"] = ("The model ships no Animation or KeyframeSequence. In the game it is animated from code "
                                        "(ReplicatedStorage.CreatureGait writes Motor6D.Transform: legs swing +-26 deg in antiphase about X, arms +-16 deg, "
                                        "tail sways +-11 deg about Y at half the stride rate shared down its segments, head bobs 6 deg at twice the rate, "
                                        "root bobs 0.55 studs with |sin|). `gait` lists the bodies each of those drives.")
            (out_dir / "rig.json").write_text(json.dumps(rig, indent=1), encoding="utf-8")
        meta = {"item": item["item"], "category": item["category"], "sourceName": item["sourceName"], "sourcePath": item["sourcePath"],
                "size": item["size"], "pivotKind": "bottom_centre", "rigged": rigged, "objects": order, "joints": len(item["joints"]),
                "bones": len(item["bones"]), "parts": len(item["parts"]), "facingKnown": item["facingKnown"],
                "meshIds": sorted({p["meshId"] for p in item["parts"] if p.get("meshId")}),
                "textureIds": sorted({t for p in item["parts"] for t in (p.get("textureId"), (p.get("surfaceAppearance") or {}).get("colorMap"),
                                                                           (p.get("specialMesh") or {}).get("textureId")) if t})}
        (out_dir / "item.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
        report.append(f"{item['item']}: {len(order)} objects, {len(w.materials)} materials, {tex_count} textures, {missing} parts missing, "
                      f"size {item['size']}, rigged={rigged}")
    return report


if __name__ == "__main__":
    raw, objn, man, pack = sys.argv[1:5]
    only = sys.argv[5].split(",") if len(sys.argv) > 5 else None
    for line in build(raw, objn, man, pack, only):
        print(line)
