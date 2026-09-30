"""Check the pack before committing: OBJs open with named objects, MTL materials/textures exist, file names have no
spaces, textures <= 1024 px (faces excepted), all faces line up on every head, JSON parses, feet on the ground.

    python validate_pack.py <pack_dir>      (writes <pack_dir>/validation.json, exit code 1 on errors)
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SKIP = {"_studio_raw", "tools"}
R6 = ["Head", "Face", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"]


def parse_obj(path):
    V, VT, objs, cur, mtllib, mats = [], [], {}, None, None, set()
    for line in open(path, encoding="utf-8"):
        p = line.split()
        if not p:
            continue
        if p[0] == "v":
            V.append([float(x) for x in p[1:4]])
        elif p[0] == "vt":
            VT.append([float(x) for x in p[1:3]])
        elif p[0] == "o":
            cur = objs.setdefault(line[2:].strip(), {"faces": [], "mtls": set()})
        elif p[0] == "usemtl":
            cur["mtls"].add(p[1]); mats.add(p[1])
        elif p[0] == "mtllib":
            mtllib = line[7:].strip()
        elif p[0] == "f":
            cur["faces"].append([tuple(int(x) if x else 0 for x in c.split("/")) for c in p[1:]])
    return np.array(V), np.array(VT), objs, mtllib, mats


def parse_mtl(path):
    mats, cur = {}, None
    for line in open(path, encoding="utf-8"):
        p = line.split()
        if not p:
            continue
        if p[0] == "newmtl":
            cur = mats.setdefault(p[1], {})
        elif cur is not None and p[0] in ("map_Kd", "norm", "map_d", "map_Bump", "bump"):
            cur[p[0]] = line.split(None, 1)[1].strip()
    return mats


def point_at_uv(V, VT, faces, uv):
    """3D point on a triangle mesh where the texture coordinate equals uv (first hit)."""
    for f in faces:
        for i in range(1, len(f) - 1):
            tri = [f[0], f[i], f[i + 1]]
            a, b, c = (VT[t[1] - 1] for t in tri)
            m = np.array([[b[0] - a[0], c[0] - a[0]], [b[1] - a[1], c[1] - a[1]]])
            if abs(np.linalg.det(m)) < 1e-12:
                continue
            s, t = np.linalg.solve(m, np.array(uv) - a)
            if s >= -1e-6 and t >= -1e-6 and s + t <= 1 + 1e-6:
                pa, pb, pc = (V[k[0] - 1] for k in tri)
                return pa + s * (pb - pa) + t * (pc - pa)
    return None


def main(pack):
    pack = Path(pack)
    errors, warnings, info = [], [], {}
    files = [p for p in pack.rglob("*") if p.is_file() and not (set(p.relative_to(pack).parts) & SKIP)]
    for p in files:
        if " " in p.name:
            errors.append(f"space in file name: {p.relative_to(pack)}")
    objs = [p for p in files if p.suffix == ".obj"]
    info["obj_files"] = len(objs)
    face_meta = json.loads((pack / "faces" / "faces.json").read_text(encoding="utf-8"))
    eye_uv = face_meta["eye_centres_uv"]
    obj_summary = {}
    for p in objs:
        rel = str(p.relative_to(pack)).replace("\\", "/")
        try:
            V, VT, O, mtllib, mats = parse_obj(p)
        except Exception as e:                           # noqa: BLE001
            errors.append(f"{rel}: cannot parse ({e})"); continue
        if not O:
            errors.append(f"{rel}: no named objects"); continue
        for name, o in O.items():
            if not o["faces"]:
                errors.append(f"{rel}: object '{name}' has no faces")
        if not mtllib or not (p.parent / mtllib).exists():
            errors.append(f"{rel}: mtllib {mtllib} missing"); continue
        M = parse_mtl(p.parent / mtllib)
        for m in mats - set(M):
            errors.append(f"{rel}: material {m} not in {mtllib}")
        for m, d in M.items():
            for k, tex in d.items():
                if not (p.parent / tex).exists():
                    errors.append(f"{rel}: {mtllib} {m} {k} -> missing {tex}")
        lo, hi = V.min(0), V.max(0)
        obj_summary[rel] = {"objects": list(O), "bbox_min": np.round(lo, 3).tolist(), "bbox_max": np.round(hi, 3).tolist(),
                            "size": np.round(hi - lo, 3).tolist(), "vertices": len(V)}
        if rel.startswith("characters/") and rel.count("/") == 2:            # characters/<Name>/<Name>.obj
            missing = [n for n in R6 if n not in O]
            if missing:
                errors.append(f"{rel}: missing R6 objects {missing}")
            if abs(lo[1]) > 0.02:
                errors.append(f"{rel}: feet not on y=0 (min y {lo[1]:.3f})")
    info["objs"] = obj_summary
    # textures
    for p in files:
        if p.suffix.lower() != ".png":
            continue
        rel = str(p.relative_to(pack)).replace("\\", "/")
        w, h = Image.open(p).size
        is_face = rel.startswith("faces/") or rel.endswith("/face.png")
        if max(w, h) > 1024 and not is_face:
            errors.append(f"{rel}: texture {w}x{h} exceeds 1024")
    # faces line up: identical head meshes per character, same face size, eyes on the front of the head
    align = {}
    for cdir in sorted((pack / "characters").glob("*/faces")):
        name = cdir.parent.name
        hashes, sizes = set(), set()
        for fdir in sorted(d for d in cdir.iterdir() if d.is_dir()):
            hashes.add(hashlib.sha1((fdir / "head.obj").read_bytes() + (fdir / "head.mtl").read_bytes()).hexdigest())
            sizes.add(Image.open(fdir / "face.png").size)
        n = sum(1 for d in cdir.iterdir() if d.is_dir())
        if len(hashes) != 1:
            errors.append(f"characters/{name}/faces: head.obj/head.mtl differ between expressions")
        if len(sizes) != 1:
            errors.append(f"characters/{name}/faces: face.png sizes differ {sizes}")
        some = next(d for d in cdir.iterdir() if d.is_dir())
        V, VT, O, _, _ = parse_obj(some / "head.obj")
        eyes = [point_at_uv(V, VT, O["Face"]["faces"], uv) for uv in eye_uv]
        head_c = (V.min(0) + V.max(0)) / 2
        ok = all(e is not None and e[2] < head_c[2] - 0.3 for e in eyes)
        if not ok:
            errors.append(f"characters/{name}: eyes do not land on the front of the head: {eyes}")
        align[name] = {"expressions": n, "identical_head_meshes": len(hashes) == 1, "face_png_sizes": [list(s) for s in sizes],
                       "eye_positions_character_space": [np.round(e, 3).tolist() if e is not None else None for e in eyes]}
    info["face_alignment"] = align
    # JSON
    for p in files:
        if p.suffix == ".json":
            try:
                json.loads(p.read_text(encoding="utf-8"))
            except Exception as e:                       # noqa: BLE001
                errors.append(f"{p.relative_to(pack)}: bad JSON ({e})")
    total = sum(p.stat().st_size for p in files)
    info["total_bytes"] = total
    info["files"] = len(files)
    result = {"errors": errors, "warnings": warnings, **info}
    (pack / "validation.json").write_text(json.dumps(result, indent=1), encoding="utf-8")
    print(f"{len(files)} files, {total / 1e6:.1f} MB, {len(objs)} OBJs, {len(errors)} errors, {len(warnings)} warnings")
    for e in errors[:60]:
        print("ERROR", e)
    for name, a in align.items():
        print("faces", name, a["expressions"], "identical", a["identical_head_meshes"], "eyes", a["eye_positions_character_space"])
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
