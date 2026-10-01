"""Build characters/<Name>/ from the Studio characters' rig data, the pack's clothing designs and meshes Studio exported.

Studio only writes a character's clothing atlas, head mesh and face decal into an OBJ while its viewport is rendering,
so this builds the same result from parts that do not need the renderer:

  * Torso / arms / legs: Roblox's R6 body-part mesh (a box with a 0.065 stud bevel on every edge, as in Studio's own
    export), with UVs into a 1024 x 1024 atlas at 128 px per stud.
  * The atlas is composited the way Roblox composites classic clothing: body colour, then Pants (torso + legs), then
    Shirt (torso + arms), using the pack's own templates rendered at 2x (clothing/*.png are the 1x uploads).
  * Head and Face: Studio's exported R6 head mesh (SpecialMesh Head, scale 1.25) and its face-decal mesh
    (tools/builtin_meshes/r6_head.obj, centred on the head; cut from a rendered Studio export).
  * Hair: the matching accessories/hair_<name> export, raised to the head's HairAttachment (0, 5.1, 0).

    python build_characters_local.py <pack_dir>
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

import make_clothing as mc
from process_export import FACE_AXES, Writer, safe, srgb_from_rgb255

S = 2                      # clothing render scale -> 128 px per stud
ATLAS = 1024
BEVEL = 0.065
FACE_D = 0.999
R6_HEAD = Path(__file__).resolve().parent / "builtin_meshes" / "r6_head.obj"
HEAD = np.array([0.0, 4.5, 0.0])
HAIR_ATTACHMENT = np.array([0.0, 5.1, 0.0])
HAIR_TINT = {"Leo": (1.8, 1.65, 1.0, 20)}   # per-channel gain + offset on the hair texture (character copy only)
# Luminance -> colour ramp for the hair texture (character copy only): Skye's signature pink waves from Roblox's red
# Belle Of Belfast hair. Stops are (t, r, g, b), t = texture luminance between its 2nd and 98th percentile.
HAIR_RAMP = {"Skye": [(0.0, 150, 40, 95), (0.45, 232, 96, 160), (0.8, 255, 160, 205), (1.0, 255, 214, 236)]}
FACE_STYLE = {"Skye": "glam"}               # faces/<style>/<expression>.png instead of faces/<expression>.png

PARTS = {  # R6 rest layout in character space (feet centre at the origin, facing -Z, +X = character's right)
    "Torso": ((0.0, 3.0, 0.0), (2.0, 2.0, 1.0)),
    "Left Arm": ((-1.5, 3.0, 0.0), (1.0, 2.0, 1.0)),
    "Right Arm": ((1.5, 3.0, 0.0), (1.0, 2.0, 1.0)),
    "Left Leg": ((-0.5, 1.0, 0.0), (1.0, 2.0, 1.0)),
    "Right Leg": ((0.5, 1.0, 0.0), (1.0, 2.0, 1.0)),
}
FACE_OF = {(2, -1): "Front", (2, 1): "Back", (1, 1): "Top", (1, -1): "Bottom", (0, 1): "Right", (0, -1): "Left"}
LETTER = {"Front": "F", "Back": "B", "Top": "U", "Bottom": "D", "Right": "R", "Left": "L"}

# Atlas layout in pixels (x, y, w, h) at 128 px per stud. Side faces sit in the same order as on the classic template,
# so neighbouring regions are neighbouring faces.
LAYOUT = {
    "Torso": {"R": (0, 0, 128, 256), "F": (128, 0, 256, 256), "L": (384, 0, 128, 256), "B": (512, 0, 256, 256),
              "U": (0, 896, 256, 128), "D": (256, 896, 256, 128)},
    "Right Arm": {"L": (0, 256, 128, 256), "B": (128, 256, 128, 256), "R": (256, 256, 128, 256), "F": (384, 256, 128, 256),
                  "U": (0, 768, 128, 128), "D": (128, 768, 128, 128)},
    "Left Arm": {"F": (512, 256, 128, 256), "L": (640, 256, 128, 256), "B": (768, 256, 128, 256), "R": (896, 256, 128, 256),
                 "U": (256, 768, 128, 128), "D": (384, 768, 128, 128)},
    "Right Leg": {"L": (0, 512, 128, 256), "B": (128, 512, 128, 256), "R": (256, 512, 128, 256), "F": (384, 512, 128, 256),
                  "U": (512, 768, 128, 128), "D": (640, 768, 128, 128)},
    "Left Leg": {"F": (512, 512, 128, 256), "L": (640, 512, 128, 256), "B": (768, 512, 128, 256), "R": (896, 512, 128, 256),
                 "U": (768, 768, 128, 128), "D": (896, 768, 128, 128)},
}
HEAD_SWATCH = (512, 896, 128, 128)          # skin colour for the head (so one atlas swap recolours the whole body)
TEMPLATE = {"Torso": mc.TORSO, "Right Arm": mc.RARM, "Left Arm": mc.LARM, "Right Leg": mc.RARM, "Left Leg": mc.LARM}
BODY_KEY = {"Head": "head", "Torso": "torso", "Left Arm": "leftArm", "Right Arm": "rightArm", "Left Leg": "leftLeg", "Right Leg": "rightLeg"}


# ------------------------------------------------------------------ geometry
def face_uv(face, local, half, rect):
    """Atlas UV of a point in part space, mapped through <face>'s region (the region covers the whole face)."""
    ax, sgn, ua, urev, va, vrev = FACE_AXES[face]
    a = (local[ua] + half[ua]) / (2 * half[ua])
    b = (local[va] + half[va]) / (2 * half[va])
    a = 1 - a if urev else a
    b = 1 - b if vrev else b
    a, b = min(max(a, 0.0), 1.0), min(max(b, 0.0), 1.0)
    x, y, w, h = rect
    return np.array([(x + a * w) / ATLAS, 1 - (y + (1 - b) * h) / ATLAS])


def bevel_box(size, rects):
    """Roblox's R6 body-part mesh: 6 inset faces, 12 edge strips and 8 corner triangles (44 triangles).
    rects: face name -> atlas rect. Returns triangles [(p, uv, n) x 3] in part space, wound counter-clockwise."""
    half = np.array(size) / 2
    verts = {}                                           # (axis, sign, s_a, s_b) -> position

    def other(axis):
        return [i for i in range(3) if i != axis]

    def vert(axis, sign, signs):                         # signs: dict axis -> +-1 for the two in-plane axes
        p = np.zeros(3)
        p[axis] = sign * half[axis]
        for i in other(axis):
            p[i] = signs[i] * (half[i] - BEVEL)
        return p

    def owner(faces):
        side = [f for f in faces if f[0] != 1]           # prefer side faces over top/bottom
        z = [f for f in side if f[0] == 2]               # and front/back over left/right
        return (z or side or faces)[0]

    tris = []

    def add(poly, own):
        fname = FACE_OF[own]
        pts = [(p, face_uv(fname, p, half, rects[fname]), n) for (p, n) in poly]
        centre = np.mean([p for p, _, _ in pts], axis=0)
        for i in range(1, len(pts) - 1):
            t = [pts[0], pts[i], pts[i + 1]]
            nrm = np.cross(t[1][0] - t[0][0], t[2][0] - t[0][0])
            if np.dot(nrm, centre) < 0:                      # convex, centred on the origin: outward = away from centre
                t = [t[0], t[2], t[1]]
            tris.append(t)

    def normal(axis, sign):
        n = np.zeros(3); n[axis] = sign
        return n

    # faces
    for axis in range(3):
        for sign in (-1, 1):
            a, b = other(axis)
            quad = [(vert(axis, sign, {a: sa, b: sb}), normal(axis, sign)) for sa, sb in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            add(quad, (axis, sign))
    # edge strips
    for i in range(3):
        for j in range(i + 1, 3):
            k = 3 - i - j
            for si in (-1, 1):
                for sj in (-1, 1):
                    A = [(vert(i, si, {j: sj, k: sk}), normal(i, si)) for sk in (-1, 1)]
                    B = [(vert(j, sj, {i: si, k: sk}), normal(j, sj)) for sk in (1, -1)]
                    add(A + B, owner([(i, si), (j, sj)]))
    # corners
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                s = {0: sx, 1: sy, 2: sz}
                tri = [(vert(ax, s[ax], {o: s[o] for o in other(ax)}), normal(ax, s[ax])) for ax in range(3)]
                add(tri, owner([(0, sx), (1, sy), (2, sz)]))
    return tris


def translate(tris, offset):
    return [[(p + offset, uv, n) for (p, uv, n) in t] for t in tris]


def obj_tris(faces, offset, uv=None):
    out = []
    for f in faces:
        pts = [(p + offset, t if uv is None else uv, n) for (p, t, n) in f]
        for i in range(1, len(pts) - 1):
            out.append([pts[0], pts[i], pts[i + 1]])
    return out


def read_pack_obj(path):
    """Minimal reader for the pack's own OBJ files ('o' objects)."""
    V, VT, VN, objs, cur = [], [], [], {}, None
    for line in open(path, encoding="utf-8"):
        p = line.split()
        if not p:
            continue
        if p[0] == "v":
            V.append([float(x) for x in p[1:4]])
        elif p[0] == "vt":
            VT.append([float(x) for x in p[1:3]])
        elif p[0] == "vn":
            VN.append([float(x) for x in p[1:4]])
        elif p[0] == "o":
            cur = objs.setdefault(" ".join(p[1:]), [])
        elif p[0] == "f":
            cur.append([tuple(int(x) for x in c.split("/")) for c in p[1:]])
    V, VT, VN = np.array(V), np.array(VT), np.array(VN)
    return {name: [[(V[a - 1], VT[b - 1], VN[c - 1]) for (a, b, c) in f] for f in faces] for name, faces in objs.items()}


# ------------------------------------------------------------------ textures
def build_atlas(rig):
    """-> (composite, body, clothing) 1024 x 1024 RGBA images."""
    body = Image.new("RGBA", (ATLAS, ATLAS), (0, 0, 0, 0))
    colours = rig["bodyColors"]
    for part, faces in LAYOUT.items():
        c = tuple(colours[BODY_KEY[part]]) + (255,)
        for rect in faces.values():
            x, y, w, h = rect
            body.paste(c, (x, y, x + w, y + h))
    x, y, w, h = HEAD_SWATCH
    body.paste(tuple(colours["head"]) + (255,), (x, y, x + w, y + h))
    clothing = Image.new("RGBA", (ATLAS, ATLAS), (0, 0, 0, 0))
    look = mc.LOOKS.get(rig["name"])
    if look and rig.get("clothing"):
        mc.set_scale(S)
        shirt = mc.clip_to_regions(mc.shirt(look))
        pants = mc.clip_to_regions(mc.pants(look))
        mc.set_scale(1)
        layers = {"Torso": [pants, shirt], "Right Arm": [shirt], "Left Arm": [shirt], "Right Leg": [pants], "Left Leg": [pants]}
        for part, faces in LAYOUT.items():
            for letter, (x, y, w, h) in faces.items():
                tx, ty, tw, th = TEMPLATE[part][letter]
                box = (tx * S, ty * S, (tx + tw) * S, (ty + th) * S)
                tile = Image.new("RGBA", (tw * S, th * S), (0, 0, 0, 0))
                for layer in layers[part]:
                    tile.alpha_composite(layer.crop(box))
                if tile.size != (w, h):
                    tile = tile.resize((w, h), Image.LANCZOS)
                clothing.paste(tile, (x, y))
    composite = body.copy()
    composite.alpha_composite(clothing)
    return composite, body, clothing


# ------------------------------------------------------------------ main
def build(pack, name, report):
    out = pack / "characters" / name
    rig = json.loads((out / "rig.json").read_text(encoding="utf-8"))
    stem = safe(name)
    composite, body, clothing = build_atlas(rig)
    composite.save(out / f"{stem}_composite.png", optimize=True)
    body.save(out / f"{stem}_body.png", optimize=True)
    clothing.save(out / f"{stem}_clothing.png", optimize=True)

    w = Writer(name, out, f"Roblox R6 character {name}. Built by tools/build_characters_local.py from the Studio model's rig, "
                          f"Roblox's R6 part meshes and Studio's exported head/face meshes. Studs, +Y up, faces -Z, feet centre "
                          f"at the origin. Objects are the R6 part names.", stem=name)
    head = read_pack_obj(R6_HEAD)
    sx, sy, sw, sh = HEAD_SWATCH
    swatch_uv = np.array([(sx + sw / 2) / ATLAS, 1 - (sy + sh / 2) / ATLAS])
    w.add_object("Head", [(w.add_material("head", Kd=(1, 1, 1), map_Kd=f"{stem}_composite.png"),
                           obj_tris(head["Head"], HEAD, uv=swatch_uv))])
    face_tris = obj_tris(head["Face"], HEAD)
    faces_dir = pack / "faces" / FACE_STYLE[name] if name in FACE_STYLE else pack / "faces"
    shutil.copyfile(faces_dir / "happy.png", out / "face.png")
    w.add_object("Face", [(w.add_material("face", Kd=(1, 1, 1), d=FACE_D, map_Kd="face.png", Ks=(0, 0, 0)), face_tris)])
    for part, (centre, size) in PARTS.items():
        rects = {fname: LAYOUT[part][LETTER[fname]] for fname in FACE_AXES}
        tris = translate(bevel_box(size, rects), np.array(centre))
        w.add_object(part, [(w.add_material(safe(part), Kd=(1, 1, 1), map_Kd=f"{stem}_composite.png"), tris)])
    for acc in rig.get("accessories", []):
        item = acc.get("packItem", "").split("/")[-1]
        src = pack / "accessories" / item
        if not item or not src.exists():
            report.append(f"  {name}: accessory {acc.get('name')} has no pack item")
            continue
        objs = read_pack_obj(src / f"{item}.obj")
        tex = next(src.glob("*.png"), None)
        if tex and name in HAIR_RAMP:
            a = np.array(Image.open(tex).convert("RGBA")).astype(float)
            L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
            lo, hi = np.percentile(L, 2), np.percentile(L, 98)
            tt = np.clip((L - lo) / (hi - lo), 0, 1)
            stops = np.array(HAIR_RAMP[name], dtype=float)
            for c in range(3):
                a[..., c] = np.interp(tt, stops[:, 0], stops[:, c + 1])
            Image.fromarray(a.astype("uint8")).save(out / f"{stem}_hair.png", optimize=True)
        elif tex and name in HAIR_TINT:                  # brief: Leo has ginger hair; Pal Hair's texture is dark amber
            k = np.array(HAIR_TINT[name][:3]); add = HAIR_TINT[name][3]
            a = np.array(Image.open(tex).convert("RGBA")).astype(float)
            a[..., :3] = np.clip(a[..., :3] * k + add, 0, 255)
            Image.fromarray(a.astype("uint8")).save(out / f"{stem}_hair.png", optimize=True)
        elif tex:
            w.textures[f"{stem}_hair.png"] = tex
        mat = w.add_material("hair", Kd=(1, 1, 1), map_Kd=f"{stem}_hair.png" if tex else None)
        for oname, faces in objs.items():
            tris = []
            for f in faces:
                pts = [(p + HAIR_ATTACHMENT, t, n) for (p, t, n) in f]
                for i in range(1, len(pts) - 1):
                    tris.append([pts[0], pts[i], pts[i + 1]])
            w.add_object(acc.get("objectNameInCharacterObj", "Hair"), [(mat, tris)])
    path = w.write()
    report.append(f"{name}: {path.relative_to(pack)} objects={[o[0] for o in w.objects]}")

    # one head OBJ per expression (same mesh and UVs; only face.png differs)
    face_names = [f["name"] for f in json.loads((pack / "faces" / "faces.json").read_text(encoding="utf-8"))["faces"]]
    tmp = out / "faces" / "_tmp"
    hw = Writer("head", tmp, f"Classic R6 head for {name} with a decal face layer; same UVs for every expression. "
                             f"Character space: head centre at (0, 4.5, 0); Neck joint at (0, 4, 0).")
    hw.add_object("Head", [(hw.add_material("skin", Kd=srgb_from_rgb255(rig["bodyColors"]["head"])),
                            obj_tris(head["Head"], HEAD, uv=np.zeros(2)))])
    hw.add_object("Face", [(hw.add_material("face", Kd=(1, 1, 1), d=FACE_D, map_Kd="face.png", Ks=(0, 0, 0)), face_tris)])
    hw.write()
    for fn in face_names:
        d = out / "faces" / fn
        d.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(tmp / "head.obj", d / "head.obj")
        shutil.copyfile(tmp / "head.mtl", d / "head.mtl")
        shutil.copyfile(faces_dir / f"{fn}.png", d / "face.png")
    shutil.rmtree(tmp)
    report.append(f"  {name}: {len(face_names)} face folders")

    rig["textures"] = {
        "composite": f"{stem}_composite.png",
        "body": f"{stem}_body.png",
        "clothing": f"{stem}_clothing.png",
        "face": "face.png",
        "hair": (f"{stem}_hair.png" + (" (the Roblox hair texture brightened toward ginger for this character; the original is in "
                                       "accessories/)" if name in HAIR_TINT else
                                       " (the Roblox hair texture recoloured to pink for this character; the original is in accessories/)"
                                       if name in HAIR_RAMP else "")) if rig.get("accessories") else None,
        "faceStyle": FACE_STYLE.get(name, "classic"),
        "note": "composite = body colours + Pants + Shirt, 128 px per stud. body/clothing are the two layers on their own "
                "(recolour gags: tint body, keep clothing). Head uses a skin swatch in the same atlas. Swap face.png "
                "(or map faces/<expression>/face.png) to change expression.",
    }
    rig["build"] = "tools/build_characters_local.py (see README: Studio does not export clothing atlases or head meshes while its window is not rendering)"
    (out / "rig.json").write_text(json.dumps(rig, indent=1), encoding="utf-8")


def main(pack):
    pack = Path(pack)
    report = []
    for name in ("Leo", "Max", "Mia", "Noob", "Skye"):
        build(pack, name, report)
    return report


if __name__ == "__main__":
    for line in main(sys.argv[1]):
        print(line)
