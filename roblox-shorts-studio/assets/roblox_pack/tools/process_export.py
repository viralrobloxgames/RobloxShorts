"""Turn a raw Roblox Studio OBJ batch export into clean per-item OBJ/MTL/PNG folders for three.js.

Studio's "Export Selection" writes one OBJ for the whole selection, names groups <PartOrModelName><n>, stores Kd in
linear colour, points every plastic part at a shared "surfaces" atlas with UVs that do not map studs sensibly, and
multiplies textured meshes by the part colour. This script, driven by the manifest the Luau export step printed:

  * splits the batch into items using the unique tags the export clones were renamed to,
  * names objects after the real parts (Head, Torso, Left Arm, ..., Blade, Board_Face, ...),
  * moves each item so its pivot is the origin (1 stud = 1 unit, +Y up, characters face -Z),
  * writes sRGB Kd colours, textures only where Roblox shows them (clothing atlas, mesh textures, decals),
    Roblox's stud / inlet tiles with per-stud UVs on studded faces, and emissive (Ke) for Neon,
  * gives decal / texture overlays alpha (d 0.999 so three.js MTLLoader enables transparency),
  * renames textures to <item>_<object>.png (no spaces) inside each item folder.

    python process_export.py <raw_dir> <obj_name> <manifest.json> <pack_dir>
"""
import json
import math
import re
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SURFACE_TILES = Path(__file__).resolve().parent / "surface_tiles"
BUILTIN = Path(__file__).resolve().parent / "builtin_textures"
PACK_ROOT = Path(__file__).resolve().parent.parent
PLAIN_MATERIALS = {"Plastic", "SmoothPlastic", "Neon", "Glass", "ForceField"}
# Roblox calls an accessory's main part "Handle"; name it after what it is in the pack's OBJ files.
HANDLE_NAMES = {"crown_admin": "Band", "admin_badge_halo": "Halo", "hair_leo": "Hair", "hair_max": "Hair", "hair_mia": "Hair", "hair_skye": "Hair",
                "beanie": "Beanie", "spiky_hair": "Hair", "long_hair": "Hair", "cap": "Dome", "headphones": "Headband",
                "top_hat": "Brim"}


def overlay_texture_file(texture_id):
    """Local PNG for a decal/texture id: our uploads (decals/faces), or a Studio built-in / default-template image."""
    up = json.loads((Path(__file__).resolve().parent / "uploads.json").read_text(encoding="utf-8"))
    for group, folder in (("decals", "decals"), ("faces", "faces"), ("clothing", "clothing")):
        for name, rid in up.get(group, {}).items():
            if rid == texture_id:
                return PACK_ROOT / folder / f"{name}.png"
    known = {"rbxasset://textures/SpawnLocation.png": "spawn_location.png", "rbxassetid://6372755229": "baseplate_grid.png",
             "rbxasset://textures/face.png": "roblox_smile_face.png"}
    if texture_id in known:
        return BUILTIN / known[texture_id]
    return None


# Decal quad on a box face, as Studio exports it: 0.005 studs out from the face, image upright and unmirrored seen
# from outside. For Front/Top (checked against Studio's own export) u runs from +X to -X and v from low to high Y / Z.
FACE_AXES = {  # face: (normal axis, sign, u axis, u reversed, v axis, v reversed)
    "Front": (2, -1, 0, True, 1, False), "Back": (2, 1, 0, False, 1, False),
    "Top": (1, 1, 0, True, 2, False), "Bottom": (1, -1, 0, True, 2, True),
    "Right": (0, 1, 2, True, 1, False), "Left": (0, -1, 2, False, 1, False),
}


def synth_overlay(part, ov, M):
    P = cf_matrix(part["cframe"])
    size = np.array(part["size"], dtype=float)
    ax, sgn, ua, urev, va, vrev = FACE_AXES[ov["face"]]
    h = size / 2
    corners = []
    for su in (-1, 1):
        for sv in (-1, 1):
            c = np.zeros(3)
            c[ax] = sgn * (h[ax] + 0.005)
            c[ua] = su * h[ua]
            c[va] = sv * h[va]
            u = (su + 1) / 2
            v = (sv + 1) / 2
            u = 1 - u if urev else u
            v = 1 - v if vrev else v
            if ov.get("class") == "Texture":
                u *= size[ua] / max(ov.get("studsPerTileU", 2), 1e-6)
                v *= size[va] / max(ov.get("studsPerTileV", 2), 1e-6)
            corners.append((c, np.array([u, v])))
    n_local = np.zeros(3); n_local[ax] = sgn
    W = M @ P
    R = W[:3, :3]
    pts = [((W @ np.append(c, 1.0))[:3], uv, R @ n_local) for c, uv in corners]
    a, b, c_, d = pts                      # (-,-) (-,+) (+,-) (+,+)
    tri1, tri2 = [a, c_, d], [a, d, b]
    # wind counter-clockwise when seen from outside
    if np.dot(np.cross(tri1[1][0] - tri1[0][0], tri1[2][0] - tri1[0][0]), R @ n_local) < 0:
        tri1, tri2 = tri1[::-1], tri2[::-1]
    return [tri1, tri2]


# ---------------------------------------------------------------- OBJ / MTL reading
def read_obj(path):
    V, VT, VN, groups, cur = [], [], [], {}, None
    for line in open(path, encoding="utf-8", errors="replace"):
        p = line.split()
        if not p:
            continue
        t = p[0]
        if t == "v":
            V.append([float(x) for x in p[1:4]])
        elif t == "vt":
            VT.append([float(x) for x in p[1:3]])
        elif t == "vn":
            VN.append([float(x) for x in p[1:4]])
        elif t == "g":
            cur = groups.setdefault(" ".join(p[1:]), {"mtl": None, "faces": []})
        elif t == "usemtl":
            cur["mtl"] = p[1]
        elif t == "f":
            face = []
            for c in p[1:]:
                s = c.split("/")
                face.append((int(s[0]), int(s[1]) if len(s) > 1 and s[1] else 0, int(s[2]) if len(s) > 2 and s[2] else 0))
            cur["faces"].append(face)
    return np.array(V), np.array(VT) if VT else np.zeros((0, 2)), np.array(VN) if VN else np.zeros((0, 3)), groups


def read_mtl(path):
    mats, cur = {}, None
    for line in open(path, encoding="utf-8", errors="replace"):
        p = line.split()
        if not p:
            continue
        if p[0] == "newmtl":
            cur = mats.setdefault(p[1], {})
        elif cur is not None:
            cur[p[0]] = " ".join(p[1:])
    return mats


# ---------------------------------------------------------------- helpers
def cf_matrix(c):
    """Roblox CFrame components (x,y,z, R00..R22) -> 4x4 matrix."""
    x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22 = c
    return np.array([[r00, r01, r02, x], [r10, r11, r12, y], [r20, r21, r22, z], [0, 0, 0, 1]], dtype=float)


def srgb_from_rgb255(rgb):
    return [round(v / 255.0, 4) for v in rgb]


def lin_to_srgb(x):
    x = max(0.0, min(1.0, x))
    return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055


def safe(name):
    return re.sub(r"[^A-Za-z0-9_]+", "_", name).strip("_").lower()


def ensure_surface_tiles(atlas_dir):
    """Cut Roblox's stud / inlet tiles (one 64 px cell = 1 stud) out of the surfaces atlas Studio exports."""
    SURFACE_TILES.mkdir(exist_ok=True)
    if (SURFACE_TILES / "roblox_studs_diff.png").exists():
        return
    diff = next(p for p in Path(atlas_dir).glob("*_diff.png") if Image.open(p).size == (128, 2048))
    nmap = Path(str(diff).replace("_diff.png", "_nmap.png"))
    d = np.array(Image.open(diff).convert("RGB")).astype(float)
    n = np.array(Image.open(nmap).convert("RGB"))
    for name, row in (("studs", 0), ("inlet", 1024)):
        cell = d[row:row + 64, 0:64]
        base = np.median(cell)
        tile = np.clip(cell * (255.0 / base), 0, 255).astype("uint8")        # flat area -> white, rings keep their shading
        Image.fromarray(tile).save(SURFACE_TILES / f"roblox_{name}_diff.png")
        Image.fromarray(n[row:row + 64, 0:64]).save(SURFACE_TILES / f"roblox_{name}_nmap.png")


# ---------------------------------------------------------------- item assembly
class Writer:
    def __init__(self, item_name, out_dir, header, stem=None):
        self.name, self.dir, self.header = item_name, Path(out_dir), header
        self.stem = stem or safe(item_name)          # file names: <stem>.obj / <stem>.mtl
        self.objects = []            # (object name, [(material, faces as list of (v,vt,vn) arrays)])
        self.materials = {}          # name -> dict of MTL lines
        self.textures = {}           # target file name -> source path
        self.dir.mkdir(parents=True, exist_ok=True)

    def add_material(self, name, **kw):
        self.materials[name] = kw
        return name

    def add_texture(self, src, obj_name, suffix=""):
        src = Path(src)
        target = f"{safe(self.name)}_{safe(obj_name)}{suffix}.png"
        self.textures[target] = src
        return target

    def add_object(self, name, parts):
        base, k = name, 2
        while any(o[0] == name for o in self.objects):
            name = f"{base}_{k}"; k += 1
        self.objects.append((name, parts))
        return name

    def write(self):
        V, VT, VN = [], [], []
        vi, ti, ni = {}, {}, {}
        lines = [f"# {self.header}", f"mtllib {self.stem}.mtl", ""]
        body = []
        for oname, parts in self.objects:
            body.append(f"o {oname}")
            for mtl, faces in parts:
                body.append(f"usemtl {mtl}")
                for f in faces:
                    idx = []
                    for (p, t, n) in f:
                        kp = tuple(np.round(p, 5)); kt = tuple(np.round(t, 5)); kn = tuple(np.round(n, 4))
                        if kp not in vi: vi[kp] = len(V) + 1; V.append(kp)
                        if kt not in ti: ti[kt] = len(VT) + 1; VT.append(kt)
                        if kn not in ni: ni[kn] = len(VN) + 1; VN.append(kn)
                        idx.append(f"{vi[kp]}/{ti[kt]}/{ni[kn]}")
                    body.append("f " + " ".join(idx))
        out = lines + [f"v {a:.5f} {b:.5f} {c:.5f}" for a, b, c in V] + [f"vt {a:.5f} {b:.5f}" for a, b in VT] + \
            [f"vn {a:.4f} {b:.4f} {c:.4f}" for a, b, c in VN] + [""] + body
        (self.dir / f"{self.stem}.obj").write_text("\n".join(out) + "\n", encoding="utf-8")
        m = [f"# Materials for {self.name}. Kd/Ks/Ke are sRGB. Textures sit next to this file."]
        for name, kw in self.materials.items():
            m.append(f"newmtl {name}")
            m.append("Kd {:.4f} {:.4f} {:.4f}".format(*kw.get("Kd", (1, 1, 1))))
            m.append("Ks {:.4f} {:.4f} {:.4f}".format(*kw.get("Ks", (0.05, 0.05, 0.05))))
            m.append(f"Ns {kw.get('Ns', 20)}")
            if "Ke" in kw:
                m.append("Ke {:.4f} {:.4f} {:.4f}".format(*kw["Ke"]))
            m.append(f"d {kw.get('d', 1.0):.4f}")
            m.append("illum 2")
            if kw.get("map_Kd"):
                m.append(f"map_Kd {kw['map_Kd']}")
            if kw.get("norm"):
                m.append(f"norm {kw['norm']}")
            m.append("")
        (self.dir / f"{self.stem}.mtl").write_text("\n".join(m), encoding="utf-8")
        for target, src in self.textures.items():
            shutil.copyfile(src, self.dir / target)
        return self.dir / f"{self.stem}.obj"


def face_arrays(V, VT, VN, faces, M):
    """Apply 4x4 M (world -> item space) to faces; return list of [(p, t, n), ...]."""
    R = M[:3, :3]
    out = []
    for f in faces:
        g = []
        for (a, b, c) in f:
            p = M @ np.append(V[a - 1], 1.0)
            n = R @ VN[c - 1] if c else np.zeros(3)
            g.append((p[:3], VT[b - 1] if b else np.zeros(2), n))
        out.append(g)
    return out


def split_studded(faces_item, part, M, faces_world):
    """Split a box part's faces into (smooth faces, studded top faces, inlet bottom faces) and give studded faces
    per-stud UVs in part space."""
    surf = part.get("surfaces", {})
    if part.get("class") not in ("Part", "SpawnLocation") or part.get("shape", "Block") != "Block":
        return faces_item, [], []
    want = {"Top": surf.get("Top"), "Bottom": surf.get("Bottom")}
    if want["Top"] not in ("Studs", "Inlet", "Universal") and want["Bottom"] not in ("Studs", "Inlet", "Universal"):
        return faces_item, [], []
    P = cf_matrix(part["cframe"])
    Pinv = np.linalg.inv(P)
    sx, sy, sz = part["size"]
    smooth, studs, inlet = [], [], []
    for fi, fw in zip(faces_item, faces_world):
        local = [(Pinv @ np.append(p, 1.0))[:3] for (p, _, _) in fw]
        ny = Pinv[:3, :3] @ np.mean([n for (_, _, n) in fw], axis=0)      # exported vertex normals, in part space
        ny = ny / (np.linalg.norm(ny) + 1e-9)
        kind = None
        if ny[1] > 0.9 and want["Top"] in ("Studs", "Universal"):
            kind = "studs"
        elif ny[1] > 0.9 and want["Top"] == "Inlet":
            kind = "inlet"
        elif ny[1] < -0.9 and want["Bottom"] in ("Inlet", "Universal"):
            kind = "inlet"
        elif ny[1] < -0.9 and want["Bottom"] == "Studs":
            kind = "studs"
        if not kind:
            smooth.append(fi)
            continue
        g = []
        for (p, t, n), L in zip(fi, local):
            uv = np.array([L[0] + sx / 2.0, L[2] + sz / 2.0])            # 1 UV unit = 1 stud, studs start at the edge
            g.append((p, uv, n))
        (studs if kind == "studs" else inlet).append(g)
    return smooth, studs, inlet


def process(raw_dir, obj_name, manifest_path, pack_dir, only=None):
    raw_dir, pack_dir = Path(raw_dir), Path(pack_dir)
    V, VT, VN, groups = read_obj(raw_dir / obj_name)
    mtls = read_mtl(raw_dir / obj_name.replace(".obj", ".mtl"))
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    ensure_surface_tiles(raw_dir)
    # index groups by tag
    by_tag = {}
    for gname, g in groups.items():
        m = re.match(r"^(.*?)(\d+)$", gname)          # Studio names groups <name><n>; our tags end in "x"
        if m:
            by_tag.setdefault(m.group(1).lower(), []).append((int(m.group(2)), gname, g))
    for v in by_tag.values():
        v.sort()
    results = []
    for item in manifest["items"]:
        if only and item["item"] not in only:
            continue
        out_dir = pack_dir / item["folder"]
        pivot = cf_matrix(item["pivot"])
        M = np.linalg.inv(pivot)
        header = (f"Roblox asset pack: {item['item']} ({item.get('category')}). Exported from Roblox Studio with Export Selection, "
                  f"then split/renamed/re-centred by tools/process_export.py. Units: studs (1 stud = 1 unit). +Y up. Pivot "
                  f"({item.get('pivotKind', 'bottom_centre')}) at the origin.")
        w = Writer(item["file"], out_dir, header)
        used_tags = set()
        for part in item["parts"]:
            tag = part["tag"].lower()
            entries = by_tag.get(tag, [])
            if part.get("groupIndex"):
                entries = [e for e in entries if e[0] == part["groupIndex"]]
            if not entries:
                results.append(f"  MISSING group for {item['item']}/{part['name']} (tag {tag})")
                continue
            used_tags.add(tag)
            if part["name"] == "Handle" and item["item"] in HANDLE_NAMES and "objectName" not in part:
                part = dict(part, name=HANDLE_NAMES[item["item"]])
            overlays = part.get("overlays", [])
            for n_idx, (k, gname, g) in enumerate(entries):
                faces_w = face_arrays(V, VT, VN, g["faces"], np.eye(4))
                faces_i = face_arrays(V, VT, VN, g["faces"], M)
                src_mtl = mtls.get(g["mtl"], {})
                src_tex = src_mtl.get("map_Kd")
                is_overlay = n_idx > 0 and overlays and not part.get("texturedMesh")
                if part.get("role") == "decal_mesh":                       # standalone head decal (faces)
                    is_overlay = n_idx > 0
                if is_overlay:
                    ov = overlays[min(n_idx - 1, len(overlays) - 1)]
                    oname = f"{part['name']}_{ov['name']}"
                    tex = w.add_texture(raw_dir / src_tex, oname) if src_tex else None
                    mat = w.add_material(safe(oname), Kd=srgb_from_rgb255(ov.get("color", [255, 255, 255])), d=max(0.001, min(0.999, 1 - ov.get("transparency", 0))),
                                         map_Kd=tex, Ks=(0.02, 0.02, 0.02))
                    w.add_object(oname, [(mat, faces_i)])
                    continue
                oname = part.get("objectName", part["name"])
                kd = srgb_from_rgb255(part["color"])
                d = 1 - part.get("transparency", 0)
                extra = {}
                if part.get("material") == "Neon":
                    extra["Ke"] = kd
                if part.get("material") in ("Metal", "Foil", "DiamondPlate") or part.get("reflectance", 0) > 0.05:
                    extra.update(Ks=(0.45, 0.45, 0.45), Ns=120)
                if part.get("texturedMesh") or part.get("atlas"):
                    tex = w.add_texture(raw_dir / src_tex, oname) if src_tex else None
                    mat = w.add_material(safe(oname), Kd=(1, 1, 1) if tex else kd, d=d, map_Kd=tex, **extra)
                    w.add_object(oname, [(mat, faces_i)])
                    continue
                smooth, studs, inlet = split_studded(faces_i, part, M, faces_w)
                chunks = []
                mat_tex = None
                if part.get("material") not in PLAIN_MATERIALS and src_tex and (raw_dir / src_tex).exists():
                    im = Image.open(raw_dir / src_tex)
                    if im.size != (128, 2048) and min(im.size) >= 256:          # a real Roblox material texture, not a placeholder
                        base = f"roblox_{safe(part['material'])}"
                        small = raw_dir / f"_{base}_diff_512.png"               # 512 px RGB: 1 tile covers 8 studs, plenty for Shorts
                        if not small.exists():
                            im.convert("RGB").resize((512, 512), Image.LANCZOS).save(small, optimize=True)
                        w.textures[f"{base}_diff.png"] = small
                        nm = src_tex.replace("_diff.png", "_nmap.png")
                        if (raw_dir / nm).exists() and min(Image.open(raw_dir / nm).size) >= 256:
                            w.textures[f"{base}_nmap.png"] = raw_dir / nm
                            extra = dict(extra, norm=f"{base}_nmap.png")
                        mat_tex = f"{base}_diff.png"
                if smooth:
                    chunks.append((w.add_material(safe(oname), Kd=kd, d=d, map_Kd=mat_tex, **extra), smooth))
                if studs:
                    w.textures["roblox_studs_diff.png"] = SURFACE_TILES / "roblox_studs_diff.png"
                    w.textures["roblox_studs_nmap.png"] = SURFACE_TILES / "roblox_studs_nmap.png"
                    chunks.append((w.add_material(safe(oname) + "_studs", Kd=kd, d=d, map_Kd="roblox_studs_diff.png", norm="roblox_studs_nmap.png", **extra), studs))
                if inlet:
                    w.textures["roblox_inlet_diff.png"] = SURFACE_TILES / "roblox_inlet_diff.png"
                    w.textures["roblox_inlet_nmap.png"] = SURFACE_TILES / "roblox_inlet_nmap.png"
                    chunks.append((w.add_material(safe(oname) + "_inlet", Kd=kd, d=d, map_Kd="roblox_inlet_diff.png", norm="roblox_inlet_nmap.png", **extra), inlet))
                w.add_object(oname, chunks)
            if overlays and len(entries) == 1 and not part.get("texturedMesh"):
                # Studio only writes decal/texture overlays once their images are loaded by the renderer; when they are
                # missing, rebuild the same quad from the part face and use the local copy of the image.
                for ov in overlays:
                    src = overlay_texture_file(ov["texture"])
                    oname = f"{part['name']}_{ov['name']}"
                    if not src or not src.exists():
                        results.append(f"  {item['item']}/{oname}: no local image for {ov['texture']}")
                        continue
                    tex = w.add_texture(src, oname)
                    mat = w.add_material(safe(oname), Kd=srgb_from_rgb255(ov.get("color", [255, 255, 255])),
                                         d=max(0.001, min(0.999, 1 - ov.get("transparency", 0))), map_Kd=tex, Ks=(0.02, 0.02, 0.02))
                    w.add_object(oname, [(mat, synth_overlay(part, ov, M))])
        path = w.write()
        results.append(f"{item['item']}: {path.relative_to(pack_dir)} objects={[o[0] for o in w.objects]}")
    return results


if __name__ == "__main__":
    raw, objn, man, pack = sys.argv[1:5]
    only = sys.argv[5].split(",") if len(sys.argv) > 5 else None
    for r in process(raw, objn, man, pack, only):
        print(r)
