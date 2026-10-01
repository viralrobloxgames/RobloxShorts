"""Glam variant of the pack's face set, for the ViralRoblox News presenter (Skye) and any other polished character.

Every expression is rebuilt from the master eye and mouth layers (faces/layers/), so eyes stay at the Roblox Smile
positions and faces still swap mid-shot without a jump. On top of each face it adds:

  * lashes: three flicks on the upper outer edge of each eye, placed on the eye's real top edge (so they follow cut
    or closed lids), skipped for eyes that aren't eyes (spirals, hearts, shades, X's);
  * eye sparkle: a large and a small white highlight, only where the eye is a solid dark oval;
  * berry lips: the mouth's black ink is recoloured, tongue and teeth keep their colours;
  * soft blush on both cheeks.

    python make_glam_faces.py <pack_dir> [style,...]   -> faces/glam/<expression>.png (1024 px) + faces/glam/glam_sheet.png
                                                     and faces/glam_doll/ (same faces laid out for a doll-style mesh head)

Layouts move and scale the three layers (eyes with lashes and sparkle, blush, mouth) in texture pixels:
  glam      - Roblox Smile positions, for classic R6 heads (the pack cast)
  glam_doll - bigger eyes set lower, blush and mouth to match, for Skye's doll head (the Roblox Studio model in
              Workspace.ViralNews.Skye, where the face is a Decal on the head's front)
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

LIPS = (158, 34, 84)
LASH = (0, 0, 0, 255)
BLUSH = (255, 112, 150, 95)
NO_LASHES = {"dizzy", "love", "cool", "knocked_out"}
SS = 4                                           # supersampling for the overlay strokes


def layer_overlay(px, eye_centres, eyes_alpha, name):
    """-> (blush, features): blush goes under the eyes and mouth, lashes and sparkles on top. Drawn at px * SS."""
    s = px * SS / 128.0
    blush = Image.new("RGBA", (px * SS, px * SS), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blush)
    for cx in (40.0, 89.0):
        bd.ellipse([(cx - 8) * s, (55 - 4) * s, (cx + 8) * s, (55 + 4) * s], fill=BLUSH)
    im = Image.new("RGBA", (px * SS, px * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    a = eyes_alpha
    for i, (cx, cy) in enumerate(eye_centres):
        outer = -1 if i == 0 else 1                 # texture-left eye's outer side is to the left
        # the eye's own pixels: inside a slightly enlarged ellipse around the Smile eye
        def solid(x, y):
            X, Y = int(round(x * px / 128)), int(round(y * px / 128))
            if not (0 <= X < px and 0 <= Y < px):
                return False
            if ((x - cx) / 5.2) ** 2 + ((y - cy) / 10.5) ** 2 > 1:
                return False
            return a[Y, X] > 128
        cols = [cx + outer * f * 3.95 for f in (0.95, 0.6, 0.2)]
        tops = []
        for x in cols:
            top = next((y / 10 for y in range(int((cy - 11) * 10), int((cy + 11) * 10)) if solid(x, y / 10)), None)
            tops.append(top)
        if name not in NO_LASHES and all(t is not None for t in tops):
            for j, (x, t) in enumerate(zip(cols, tops)):
                ang = math.radians((35, 55, 75)[j])     # outer lash flicks out the most
                L = (3.4, 3.0, 2.4)[j]
                ex, ey = x + outer * L * math.cos(ang), t - L * math.sin(ang)
                d.line([(x * s, (t + 0.4) * s), (ex * s, ey * s)], fill=LASH, width=int(1.4 * s))
                d.ellipse([(ex - 0.6) * s, (ey - 0.6) * s, (ex + 0.6) * s, (ey + 0.6) * s], fill=LASH)
        # sparkle only on a solid dark oval (an open eye)
        if solid(cx + 1.3, cy - 3.6) and solid(cx - 1.1, cy + 3.4) and solid(cx, cy):
            d.ellipse([(cx + 1.3 - 1.45) * s, (cy - 3.6 - 1.45) * s, (cx + 1.3 + 1.45) * s, (cy - 3.6 + 1.45) * s], fill=(255, 255, 255, 255))
            d.ellipse([(cx - 1.1 - 0.7) * s, (cy + 3.4 - 0.7) * s, (cx - 1.1 + 0.7) * s, (cy + 3.4 + 0.7) * s], fill=(255, 255, 255, 235))
    blush = blush.resize((px, px), Image.LANCZOS).filter(ImageFilter.GaussianBlur(px / 90))
    return blush, im.resize((px, px), Image.LANCZOS)


LAYOUTS = {
    "glam": None,
    "glam_doll": {"eyes": {"scale": 1.3, "from": (516, 286), "to": (516, 545)},
                  "blush": {"scale": 1.0, "from": (516, 440), "to": (516, 668)},
                  "mouth": {"scale": 0.95, "from": (516, 716), "to": (516, 790)}},
}


def place(img, spec):
    """Scale a layer about spec['from'] and move that point to spec['to'] (same canvas size)."""
    if not spec:
        return img
    s, (fx, fy), (tx, ty) = spec["scale"], spec["from"], spec["to"]
    # output (x, y) samples input ((x - tx) / s + fx, (y - ty) / s + fy)
    return img.transform(img.size, Image.AFFINE, (1 / s, 0, fx - tx / s, 0, 1 / s, fy - ty / s), resample=Image.BICUBIC)


def berry_lips(mouth):
    m = np.array(mouth).astype(np.int32)
    ink = (m[..., 3] > 0) & (m[..., 0] < 70) & (m[..., 1] < 70) & (m[..., 2] < 70)
    m[ink, 0], m[ink, 1], m[ink, 2] = LIPS
    return Image.fromarray(m.astype(np.uint8), "RGBA")


def main(pack, only=None):
    pack = Path(pack)
    meta = json.loads((pack / "faces" / "faces.json").read_text(encoding="utf-8"))
    px = meta["size_px"]
    eyes_c = [tuple(e) for e in meta["eye_centres_grid"]]
    names = [f["name"] for f in meta["faces"]]
    for style, layout in LAYOUTS.items():
        if only and style not in only:
            continue
        out = pack / "faces" / style
        out.mkdir(parents=True, exist_ok=True)
        L = layout or {}
        for name in names:
            eyes = Image.open(pack / "faces" / "layers" / "eyes" / f"{name}.png").convert("RGBA")
            mouth = Image.open(pack / "faces" / "layers" / "mouth" / f"{name}.png").convert("RGBA")
            alpha = np.array(eyes.getchannel("A"))
            blush, features = layer_overlay(px, eyes_c, alpha, name)
            eye_layer = Image.new("RGBA", (px, px), (0, 0, 0, 0))
            eye_layer.alpha_composite(eyes)
            eye_layer.alpha_composite(features)
            face = Image.new("RGBA", (px, px), (0, 0, 0, 0))
            face.alpha_composite(place(blush, L.get("blush")))
            face.alpha_composite(place(berry_lips(mouth), L.get("mouth")))
            face.alpha_composite(place(eye_layer, L.get("eyes")))
            face.save(out / f"{name}.png", optimize=True)
        sheet(out, names, style)
        print(f"wrote {len(names)} {style} faces to {out}")


def sheet(out, names, style):
    """Contact sheet on a warm skin tone."""
    cell, cols = 200, 8
    rows = math.ceil(len(names) / cols)
    img = Image.new("RGBA", (cell * cols, (cell + 30) * rows), (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    for i, name in enumerate(names):
        x, y = (i % cols) * cell, (i // cols) * (cell + 30)
        img.paste((234, 184, 146, 255), (x, y + 30, x + cell, y + 30 + cell))
        f = Image.open(out / f"{name}.png").resize((cell, cell), Image.LANCZOS)
        img.alpha_composite(f, (x, y + 30))
        d.text((x + 6, y + 8), name, fill=(0, 0, 0, 255))
    img.convert("RGB").save(out / f"{style}_sheet.png", optimize=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2].split(",") if len(sys.argv) > 2 else None)
