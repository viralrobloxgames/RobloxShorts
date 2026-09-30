"""Build characters/<Name>/ from Studio's character batch export (see luau/stage_characters.luau).

Per character:
  <Name>.obj/.mtl  objects Head, Face, Torso, Left Arm, Right Arm, Left Leg, Right Leg (+ Hair), feet centre at the
                   origin, facing -Z. Body parts use Studio's own clothing composite atlas (<name>_composite.png).
                   Face is the classic decal mesh with a 1024 px face texture (face.png = happy); swap the texture
                   to change expression.
  <name>_body.png      the same atlas with body colours only (no clothing) - for recolour gags
  <name>_clothing.png  clothing layer only (transparent where the body colour shows)
  faces/<expression>/face.png + head.obj/.mtl  for all 32 faces (identical head mesh and UVs; only face.png differs)

    python build_characters.py <raw_dir> <obj_name> <manifest.json> <pack_dir>
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from process_export import Writer, cf_matrix, face_arrays, read_mtl, read_obj, safe, srgb_from_rgb255

FACE_D = 0.999


def group_index(groups):
    by_tag = {}
    import re
    for gname, g in groups.items():
        m = re.match(r"^(.*?)(\d+)$", gname)
        if m:
            by_tag.setdefault(m.group(1).lower(), []).append((int(m.group(2)), gname, g))
    for v in by_tag.values():
        v.sort()
    return by_tag


def centre(V, g):
    idx = sorted({a for f in g["faces"] for (a, _, _) in f})
    pts = V[np.array(idx) - 1]
    return (pts.min(0) + pts.max(0)) / 2


def main(raw_dir, obj_name, manifest_path, pack_dir):
    raw_dir, pack = Path(raw_dir), Path(pack_dir)
    V, VT, VN, groups = read_obj(raw_dir / obj_name)
    mtls = read_mtl(raw_dir / obj_name.replace(".obj", ".mtl"))
    man = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    by_tag = group_index(groups)
    faces_dir = pack / "faces"
    face_names = [f["name"] for f in json.loads((faces_dir / "faces.json").read_text(encoding="utf-8"))["faces"]]
    heads = {it["item"]: it for it in man["items"] if it["kind"] == "head"}
    atlases = {}
    report = []
    for it in man["items"]:
        if it["kind"] != "character":
            continue
        name, variant = it["item"], it["variant"]
        entries = by_tag.get(it["tag"], [])
        # which Studio group is which body part: nearest bounding-box centre
        assign = {}
        for p in it["parts"]:
            want = cf_matrix(p["cframe"])[:3, 3]
            best = min(entries, key=lambda e: np.linalg.norm(centre(V, e[2]) - want)) if entries else None
            if best is None or np.linalg.norm(centre(V, best[2]) - want) > 0.35:
                report.append(f"  {name}/{variant}: no group near {p['name']} ({want})")
                continue
            assign[p["name"]] = best
        atlas_src = None
        for pn, (_, gname, g) in assign.items():
            tex = mtls.get(g["mtl"], {}).get("map_Kd")
            if tex:
                atlas_src = raw_dir / tex
        atlases[(name, variant)] = atlas_src
        if variant != "clothed":
            continue
        out = pack / "characters" / name
        M = np.linalg.inv(cf_matrix(it["pivot"]))
        w = Writer(name, out, f"Roblox R6 character {name}, exported from Roblox Studio (Export Selection) and cleaned by "
                              f"tools/build_characters.py. Studs, +Y up, faces -Z, feet centre at the origin. Objects are the R6 part names.")
        comp = w.add_texture(atlas_src, name, "_composite_tmp") if atlas_src else None
        if comp:                                           # nicer file name: <name>_composite.png
            src = w.textures.pop(comp)
            comp = f"{safe(name)}_composite.png"
            w.textures[comp] = src
        for pn in ["Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]:
            if pn not in assign:
                continue
            _, gname, g = assign[pn]
            part = next(p for p in it["parts"] if p["name"] == pn)
            mat = w.add_material(safe(pn), Kd=(1, 1, 1) if comp else srgb_from_rgb255(part["color"]), map_Kd=comp)
            w.add_object(pn, [(mat, face_arrays(V, VT, VN, g["faces"], M))])
        # Face layer from the standalone head's decal mesh (same position as this character's head)
        h = heads.get(name)
        hg = by_tag.get(h["tag"], []) if h else []
        if len(hg) >= 2:
            shutil.copyfile(faces_dir / "happy.png", out / "face.png")
            mat = w.add_material("face", Kd=(1, 1, 1), d=FACE_D, map_Kd="face.png", Ks=(0.0, 0.0, 0.0))
            w.add_object("Face", [(mat, face_arrays(V, VT, VN, hg[1][2]["faces"], M))])
        else:
            report.append(f"  {name}: standalone head decal mesh missing")
        for a in it["accessories"]:
            ag = by_tag.get(a["tag"].lower(), [])
            if not ag:
                report.append(f"  {name}: accessory {a['name']} missing")
                continue
            g = ag[0][2]
            tex = mtls.get(g["mtl"], {}).get("map_Kd")
            t = w.add_texture(raw_dir / tex, "hair") if tex else None
            mat = w.add_material("hair", Kd=(1, 1, 1) if t else srgb_from_rgb255(a["color"]), map_Kd=t)
            w.add_object("Hair", [(mat, face_arrays(V, VT, VN, g["faces"], M))])
        path = w.write()
        report.append(f"{name}: {path.relative_to(pack)} objects={[o[0] for o in w.objects]}")
        # per-expression head OBJs
        if len(hg) >= 2:
            hw = Writer("head", out / "faces" / "_tmp", f"Classic R6 head for {name} with a decal face layer; same UVs for every expression. "
                                                        f"Character space: head centre at (0, 4.5, 0); Neck joint at (0, 4, 0).")
            skin = srgb_from_rgb255(h["parts"][0]["color"])
            hw.add_object("Head", [(hw.add_material("skin", Kd=skin), face_arrays(V, VT, VN, hg[0][2]["faces"], M))])
            hw.add_object("Face", [(hw.add_material("face", Kd=(1, 1, 1), d=FACE_D, map_Kd="face.png", Ks=(0, 0, 0)), face_arrays(V, VT, VN, hg[1][2]["faces"], M))])
            hw.write()
            for fn in face_names:
                d = out / "faces" / fn
                d.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(out / "faces" / "_tmp" / "head.obj", d / "head.obj")
                shutil.copyfile(out / "faces" / "_tmp" / "head.mtl", d / "head.mtl")
                shutil.copyfile(faces_dir / f"{fn}.png", d / "face.png")
            shutil.rmtree(out / "faces" / "_tmp")
            report.append(f"  {name}: {len(face_names)} face folders")
    # separate body-colour and clothing layers from the two atlases
    for (name, variant), src in atlases.items():
        if variant != "clothed" or not src:
            continue
        out = pack / "characters" / name
        body_src = atlases.get((name, "body"))
        comp = np.array(Image.open(src).convert("RGBA")).astype(int)
        if body_src:
            body = np.array(Image.open(body_src).convert("RGBA")).astype(int)
            Image.fromarray(body.astype("uint8")).save(out / f"{safe(name)}_body.png", optimize=True)
            diff = np.abs(comp[..., :3] - body[..., :3]).max(-1)
            layer = comp.copy()
            layer[..., 3] = np.where(diff > 10, 255, 0)
            Image.fromarray(layer.astype("uint8")).save(out / f"{safe(name)}_clothing.png", optimize=True)
            report.append(f"  {name}: body + clothing layers ({(diff > 10).mean() * 100:.1f}% of atlas is clothing)")
    return report


if __name__ == "__main__":
    for line in main(*sys.argv[1:5]):
        print(line)
