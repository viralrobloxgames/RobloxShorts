"""Quick check render of a processed pack OBJ (no three.js needed): flat-shaded orthographic views, painter-sorted.

    python preview_obj.py <item.obj> <out.png> [--views side,front,three_quarter] [--size 640] [--explode body=dx,dy,dz ...]

Colours come from the MTL (Kd, or the texture's average colour). The origin is marked with a red cross and the ground
line is drawn, so pivot and facing (-Z = front) can be checked by eye.
"""
import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from process_export import read_mtl, read_obj


def load(obj_path):
    obj_path = Path(obj_path)
    V, VT, VN, faces, mats = [], [], [], [], []
    cur = None
    for line in open(obj_path, encoding="utf-8"):
        p = line.split()
        if not p:
            continue
        if p[0] == "v":
            V.append([float(x) for x in p[1:4]])
        elif p[0] == "usemtl":
            cur = p[1]
        elif p[0] == "f":
            idx = [int(c.split("/")[0]) - 1 for c in p[1:]]
            for k in range(1, len(idx) - 1):
                faces.append((idx[0], idx[k], idx[k + 1]))
                mats.append(cur)
    mtl = read_mtl(obj_path.with_suffix(".mtl"))
    colours = {}
    for name, m in mtl.items():
        kd = np.array([float(x) for x in m.get("Kd", "0.8 0.8 0.8").split()])
        tex = m.get("map_Kd")
        if tex and (obj_path.parent / tex).exists():
            im = np.array(Image.open(obj_path.parent / tex).convert("RGB").resize((16, 16))).reshape(-1, 3).mean(0) / 255
            kd = kd * im
        colours[name] = (kd, "Ke" in m)
    return np.array(V), np.array(faces), mats, colours


VIEWS = {"side": (90, 0), "front": (0, 0), "three_quarter": (35, 18), "back": (180, 0), "top": (0, 89)}


def render(V, F, mats, colours, yaw, pitch, size):
    y, p = math.radians(yaw), math.radians(pitch)
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(p), -math.sin(p)], [0, math.sin(p), math.cos(p)]])
    R = Rx @ Ry
    # camera looks down -Z of view space at the model's front (-Z of the model faces the camera when yaw = 0)
    P = (V * np.array([1, 1, -1])) @ R.T
    P[:, 0] *= -1
    lo, hi = P.min(0), P.max(0)
    span = max(hi[0] - lo[0], hi[1] - lo[1]) * 1.12
    c = (lo + hi) / 2
    S = 3
    px = lambda q: ((q[0] - c[0]) / span * size * S + size * S / 2, size * S / 2 - (q[1] - c[1]) / span * size * S)
    img = Image.new("RGB", (size * S, size * S), (200, 220, 240))
    d = ImageDraw.Draw(img)
    tri = P[F]
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    ln = np.linalg.norm(n, axis=1) + 1e-9
    light = np.array([0.35, 0.75, 0.55]); light /= np.linalg.norm(light)
    shade = 0.45 + 0.55 * np.abs((n / ln[:, None]) @ light)
    order = np.argsort(tri[:, :, 2].mean(1))
    for i in order:
        kd, neon = colours.get(mats[i], (np.array([0.8, 0.8, 0.8]), False))
        col = kd if neon else kd * shade[i]
        d.polygon([px(q) for q in tri[i]], fill=tuple(int(255 * min(1, max(0, v))) for v in col))
    o = px(np.zeros(3) @ R.T)
    d.line([o[0] - 14 * S, o[1], o[0] + 14 * S, o[1]], fill=(230, 30, 30), width=2 * S)
    d.line([o[0], o[1] - 14 * S, o[0], o[1] + 14 * S], fill=(230, 30, 30), width=2 * S)
    return img.resize((size, size), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("obj"); ap.add_argument("out")
    ap.add_argument("--views", default="side,front,three_quarter")
    ap.add_argument("--size", type=int, default=640)
    a = ap.parse_args()
    V, F, mats, colours = load(a.obj)
    views = a.views.split(",")
    sheet = Image.new("RGB", (a.size * len(views), a.size), (255, 255, 255))
    for k, v in enumerate(views):
        sheet.paste(render(V, F, mats, colours, *VIEWS[v], a.size), (k * a.size, 0))
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out)
    print(f"{a.out}: {len(V)} vertices, {len(F)} triangles, bbox {np.round(V.min(0), 2).tolist()} .. {np.round(V.max(0), 2).tolist()}")


if __name__ == "__main__":
    main()
