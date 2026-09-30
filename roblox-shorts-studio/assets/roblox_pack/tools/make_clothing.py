"""Original classic-clothing templates (Shirt + Pants, 585 x 559) for Leo, Max and Mia.

Regions follow Roblox's classic template (verified against a Studio OBJ export): every region is drawn as seen
from outside the body, top = up. On the torso front the viewer's left is the character's right shoulder.

    python make_clothing.py <out_dir>

set_scale(n) renders the same designs at n x resolution (used by build_characters_local.py for the pack's own
character atlas; the uploaded Roblox templates are always 1x).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 585, 559
SCALE = 1


def set_scale(n):
    global SCALE
    SCALE = n
TORSO = {"U": (231, 8, 128, 64), "R": (165, 74, 64, 128), "F": (231, 74, 128, 128), "L": (361, 74, 64, 128), "B": (427, 74, 128, 128), "D": (231, 204, 128, 64)}
RARM = {"U": (217, 289, 64, 64), "L": (19, 355, 64, 128), "B": (85, 355, 64, 128), "R": (151, 355, 64, 128), "F": (217, 355, 64, 128), "D": (217, 485, 64, 64)}
LARM = {"U": (308, 289, 64, 64), "F": (308, 355, 64, 128), "L": (374, 355, 64, 128), "B": (440, 355, 64, 128), "R": (506, 355, 64, 128), "D": (308, 485, 64, 64)}

LOOKS = {
    "Leo": {"hoodie": "FF7B2C", "dark": "D45C16", "lining": "A9460D", "pants": "22325A", "pants_dark": "16213D", "accent": "FF7B2C", "emblem": "bolt"},
    "Max": {"hoodie": "16B8B2", "dark": "0E8F8A", "lining": "0A6A66", "pants": "1C2B4A", "pants_dark": "111A30", "accent": "16B8B2", "emblem": "star"},
    "Mia": {"hoodie": "A56DFF", "dark": "7F4BDB", "lining": "5F33B2", "pants": "2E2352", "pants_dark": "1E163A", "accent": "FF7BC5", "emblem": "heart"},
}
CREAM, SHOE, SOLE, LACE = (246, 240, 228, 255), (244, 244, 240, 255), (58, 58, 64, 255), (170, 170, 178, 255)


def rgb(h, a=255):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (c[3],)


class Region:
    """Drawing helper in a region's local pixel space."""

    def __init__(self, d, rect):
        self.d, (self.x, self.y, self.w, self.h) = d, rect
        self.S = SCALE

    def X(self, v):
        return (self.x + v) * self.S

    def Y(self, v):
        return (self.y + v) * self.S

    def rect(self, x0, y0, x1, y1, fill, outline=None, width=1):
        self.d.rectangle([self.X(x0), self.Y(y0), self.X(x1) - 1, self.Y(y1) - 1], fill=fill, outline=outline, width=width * self.S)

    def poly(self, pts, fill, outline=None):
        self.d.polygon([(self.X(a), self.Y(b)) for a, b in pts], fill=fill, outline=outline)

    def line(self, pts, fill, width=1):
        self.d.line([(self.X(a), self.Y(b)) for a, b in pts], fill=fill, width=width * self.S, joint="curve")

    def ellipse(self, x0, y0, x1, y1, fill, outline=None, width=1):
        self.d.ellipse([self.X(x0), self.Y(y0), self.X(x1), self.Y(y1)], fill=fill, outline=outline, width=width * self.S)

    def ribs(self, y0, y1, base, line, step=4):
        self.rect(0, y0, self.w, y1, base)
        for x in range(2, self.w, step):
            self.line([(x, y0 + 1), (x, y1 - 2)], line, 1)

    def edge_shade(self, k=0.9, px=5):
        """Darken the left/right edges slightly so faces read as rounded fabric."""
        n, x0, x1, y0, y1 = px * self.S, self.X(0), self.X(self.w) - 1, self.Y(0), self.Y(self.h) - 1
        for i in range(n):
            a = int(255 * (1 - k) * (1 - i / n))
            self.d.line([(x0 + i, y0), (x0 + i, y1)], fill=(0, 0, 0, a))
            self.d.line([(x1 - i, y0), (x1 - i, y1)], fill=(0, 0, 0, a))


def emblem(r, kind, cx, cy, s, fill, outline):
    if kind == "bolt":
        pts = [(0.15, -1.0), (-0.55, 0.12), (-0.02, 0.12), (-0.2, 1.0), (0.6, -0.2), (0.05, -0.2), (0.35, -1.0)]
    elif kind == "star":
        import math
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = 1.0 if i % 2 == 0 else 0.45
            pts.append((rr * math.cos(a), rr * math.sin(a) + 0.08))
    else:  # heart
        import math
        pts = []
        for i in range(40):
            t = 2 * math.pi * i / 40
            pts.append((16 * math.sin(t) ** 3 / 17, -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 17 + 0.1))
    P = [(cx + x * s, cy + y * s) for x, y in pts]
    r.poly(P, fill, outline)


def clip_to_regions(im):
    """Clear anything drawn outside the template regions."""
    mask = Image.new("L", im.size, 0)
    md = ImageDraw.Draw(mask)
    for regs in (TORSO, RARM, LARM):
        for x, y, w, h in regs.values():
            md.rectangle([x * SCALE, y * SCALE, (x + w) * SCALE - 1, (y + h) * SCALE - 1], fill=255)
    a = Image.composite(im.getchannel("A"), Image.new("L", im.size, 0), mask)
    im.putalpha(a)
    return im


def overlay(base, draw_fn):
    """Draw on a separate layer and alpha-composite (so translucent strokes blend instead of replacing)."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    base.alpha_composite(layer)


def shirt(look):
    im = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    hood, dark, lining = rgb(look["hoodie"]), rgb(look["dark"]), rgb(look["lining"])
    # torso
    for k, rect in TORSO.items():
        r = Region(d, rect)
        r.rect(0, 0, r.w, r.h, hood)
    f = Region(d, TORSO["F"])
    f.poly([(26, 0), (102, 0), (86, 16), (64, 22), (42, 16)], lining)                 # hood opening
    f.line([(24, 0), (42, 15), (64, 21), (86, 15), (104, 0)], dark, 6)             # hood rim
    for x in (54, 74):                                                              # drawstrings
        f.line([(x, 17), (x - 1, 50)], CREAM, 4)
        f.rect(x - 3, 49, x + 2, 56, (205, 200, 190, 255))
    f.poly([(30, 70), (98, 70), (108, 112), (20, 112)], shade(hood, 0.9), dark)      # kangaroo pocket
    f.line([(30, 70), (22, 104)], dark, 2)
    f.line([(98, 70), (106, 104)], dark, 2)
    f.line([(36, 72), (92, 72)], shade(hood, 1.08), 2)
    f.ribs(114, 128, dark, shade(dark, 0.82))                                       # hem
    emblem(f, look["emblem"], 97, 38, 10, (255, 255, 255, 255), dark)              # character's left chest
    b = Region(d, TORSO["B"])
    b.ellipse(14, -46, 114, 58, lining)                                              # hood lying on the back
    b.ellipse(18, -40, 110, 52, hood, dark, 3)
    b.line([(64, 6), (64, 50)], dark, 2)
    b.ribs(114, 128, dark, shade(dark, 0.82))
    for side in ("R", "L"):
        s = Region(d, TORSO[side])
        s.rect(0, 0, s.w, 10, dark)
        s.ribs(114, 128, dark, shade(dark, 0.82))
    u = Region(d, TORSO["U"])
    u.ellipse(34, 8, 94, 50, dark)                                                  # hood rim round the neck
    u.ellipse(42, 14, 86, 44, lining)
    u.rect(30, 0, 98, 12, dark)
    Region(d, TORSO["D"]).ribs(0, 64, dark, shade(dark, 0.82), step=5)
    # sleeves: hoodie down to a ribbed cuff, bare hand below
    for arm in (RARM, LARM):
        for k in ("L", "B", "R", "F"):
            r = Region(d, arm[k])
            r.rect(0, 0, r.w, 96, hood)
            r.ribs(96, 108, dark, shade(dark, 0.82))
            r.line([(0, 2), (r.w, 2)], shade(hood, 0.92), 3)
        Region(d, arm["U"]).rect(0, 0, 64, 64, hood)
    # soft edge shading on the big faces
    def shading(dd):
        for rect in TORSO.values():
            Region(dd, rect).edge_shade(0.88, 5)
        for rect in [RARM[k] for k in "LBRF"] + [LARM[k] for k in "LBRF"]:
            Region(dd, (rect[0], rect[1], rect[2], 108)).edge_shade(0.88, 5)     # sleeve only, not the hand
    overlay(im, shading)
    return im


def pants(look):
    im = Image.new("RGBA", (W * SCALE, H * SCALE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    p, pd, acc = rgb(look["pants"]), rgb(look["pants_dark"]), rgb(look["accent"])
    # torso: waistband and hips (normally hidden under the hoodie)
    for k in ("F", "B", "R", "L"):
        r = Region(d, TORSO[k])
        r.rect(0, 64, r.w, 128, p)
        r.rect(0, 64, r.w, 74, pd)
    Region(d, TORSO["D"]).rect(0, 0, 128, 64, p)
    # legs: pants to the ankle, then sneakers
    for leg in (RARM, LARM):
        for k in ("L", "B", "R", "F"):
            r = Region(d, leg[k])
            r.rect(0, 0, r.w, 98, p)
            r.rect(0, 92, r.w, 98, pd)                                               # hem
            r.rect(0, 98, r.w, 128, SHOE)                                            # sneaker upper
            r.rect(0, 120, r.w, 128, SOLE)                                           # sole
            r.rect(0, 117, r.w, 120, acc)                                            # sole stripe
            if k == "F":
                for i, y in enumerate(range(101, 115, 4)):                           # laces
                    r.line([(22, y), (42, y + 3)], LACE, 2)
                    r.line([(42, y), (22, y + 3)], LACE, 2)
                r.line([(24, 50), (32, 54), (40, 50)], pd, 2)                        # knee crease
            elif k == "B":
                r.rect(26, 98, 38, 112, acc)                                         # heel tab
            else:
                r.poly([(10, 112), (30, 102), (54, 102), (34, 112)], acc)           # side stripe
                r.line([(32, 0), (32, 92)], pd, 2)                                   # side seam
        Region(d, leg["U"]).rect(0, 0, 64, 64, p)
        sole = Region(d, leg["D"])
        sole.rect(0, 0, 64, 64, SOLE)
        for y in range(6, 64, 8):
            sole.line([(6, y), (58, y)], shade(SOLE, 1.35), 2)

    def shading(dd):
        for rect in [RARM[k] for k in "LBRF"] + [LARM[k] for k in "LBRF"]:
            Region(dd, (rect[0], rect[1], rect[2], 98)).edge_shade(0.86, 5)
    overlay(im, shading)
    return im


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for name, look in LOOKS.items():
        clip_to_regions(shirt(look)).save(out / f"shirt_{name.lower()}.png", optimize=True)
        clip_to_regions(pants(look)).save(out / f"pants_{name.lower()}.png", optimize=True)
        print("wrote", name)


if __name__ == "__main__":
    main()
