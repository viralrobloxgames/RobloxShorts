"""Classic Roblox-style decal faces for the R6 pack.

Every face is drawn on the same 128-unit grid as Roblox's default "Smile" face (rbxasset://textures/face.png,
128 x 128), whose eyes sit at (52.24, 35.24) and (75.76, 35.24) and whose mouth is centred near (64, 89).
All expressions keep those eye centres, so faces can be swapped mid-shot without the eyes jumping.
Faces are rendered at 4096 px and downsampled to 1024 px (transparent PNG), with separate eye and mouth layers.

    python make_faces.py <out_dir> [--size 1024]
"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

GRID = 128.0
# Design space is symmetric about x = 64. Roblox centres its features on pixel centres, so everything is drawn
# shifted by OFFSET; in texture space the eyes land exactly where the Smile's eyes are (52.74, 35.74) / (76.26, 35.74).
OFFSET = 0.5
EYES = ((52.24, 35.24), (75.76, 35.24))          # design space; measured from Roblox's default Smile face
EYE_RX, EYE_RY = 3.95, 8.85
INK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)
TONGUE = (214, 84, 110, 255)
TEAR = (96, 196, 255, 255)
HEART = (255, 58, 92, 255)
ERASE = (0, 0, 0, 0)


class Canvas:
    """A supersampled RGBA layer addressed in 128-unit face coordinates."""

    def __init__(self, px):
        self.px = px
        self.s = px / GRID
        self.im = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def P(self, pts):
        return [((x + OFFSET) * self.s, (y + OFFSET) * self.s) for x, y in pts]

    def ellipse(self, cx, cy, rx, ry, fill=INK):
        s, cx, cy = self.s, cx + OFFSET, cy + OFFSET
        self.d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=fill)

    def poly(self, pts, fill=INK):
        self.d.polygon(self.P(pts), fill=fill)

    def stroke(self, pts, w, fill=INK):
        """Polyline with round caps and joins."""
        s, r = self.s, w * self.s / 2
        q = self.P(pts)
        if len(q) > 1:
            self.d.line(q, fill=fill, width=max(1, round(w * s)), joint="curve")
        for x, y in q:
            self.d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def arc(cx, cy, rx, ry, a0, a1, n=64):
    """Points on an ellipse; angles in degrees, 0 = +x, 90 = down (image space)."""
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def wave(x0, x1, y, amp, periods, n=80, tilt=0.0):
    return [(x0 + (x1 - x0) * i / n, y + tilt * (i / n - 0.5) + amp * math.sin(2 * math.pi * periods * i / n)) for i in range(n + 1)]


def heart(c, cx, cy, size, fill=HEART):
    pts = []
    for i in range(121):
        t = 2 * math.pi * i / 120
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size / 32, cy - y * size / 32 - size * 0.05))
    c.poly(pts, fill)


def spiral(c, cx, cy, r, turns=2.4, w=2.5):
    n = 220
    pts = [(cx + (0.6 + (r - 0.6) * i / n) * math.cos(2 * math.pi * turns * i / n),
            cy + (0.6 + (r - 0.6) * i / n) * math.sin(2 * math.pi * turns * i / n)) for i in range(n + 1)]
    c.stroke(pts, w)


# ---------------------------------------------------------------- eye kits
def eyes_default(c, rx=EYE_RX, ry=EYE_RY):
    for x, y in EYES:
        c.ellipse(x, y, rx, ry)


def lid_clip(c, lines):
    """Erase everything above a line per eye: lines = [((x0, y0), (x1, y1)), ...] in face units."""
    for (x0, y0), (x1, y1) in lines:
        c.poly([(x0, y0), (x1, y1), (x1, y1 - 30), (x0, y0 - 30)], ERASE)


def eyes_lidded(c, lid_y=34.2, lid_w=0.0, slant=0.0, half=5.0):
    """Half-lidded eyes: the top of each eye is cut flat (classic 'Chill' style); lid_w > 0 adds a lid line."""
    eyes_default(c)
    lines = []
    for i, (x, y) in enumerate(EYES):
        k = slant if i == 0 else -slant          # positive slant: lids lower toward the nose
        lines.append(((x - 6.5, lid_y - k * 6.5), (x + 6.5, lid_y + k * 6.5)))
    lid_clip(c, lines)
    for (x, _), ((x0, y0), (x1, y1)) in zip(EYES, lines if lid_w > 0 else []):
        k = (y1 - y0) / (x1 - x0)
        c.stroke([(x - half, lid_y + k * (x - half - (x0 + x1) / 2) + (y0 + y1) / 2 - lid_y),
                  (x + half, lid_y + k * (x + half - (x0 + x1) / 2) + (y0 + y1) / 2 - lid_y)], lid_w)


def eyes_closed_up(c, rx=5.0, ry=4.2, w=3.6, dy=1.5):
    """Closed happy eyes: upside-down U (arch)."""
    for x, y in EYES:
        c.stroke(arc(x, y + dy + ry / 2, rx, ry, 180, 360), w)


def eyes_closed_down(c, rx=5.0, ry=3.2, w=3.6, dy=0.0):
    """Closed relaxed eyes: U shape (sleep / blink)."""
    for x, y in EYES:
        c.stroke(arc(x, y + dy - ry / 2, rx, ry, 0, 180), w)


def brows(c, left, right, w=3.3):
    c.stroke(left, w)
    c.stroke(right, w)


def mirror(pts):
    return [(128 - x, y) for x, y in pts]


def brows_angry(c, w=3.7, steep=6.0, y=22.0):
    left = [(44.8, y - steep / 2), (58.2, y + steep / 2)]
    brows(c, left, mirror(left), w)


def brows_worried(c, w=3.3, steep=5.0, y=21.0):
    left = [(45.2, y + steep / 2), (57.8, y - steep / 2)]
    brows(c, left, mirror(left), w)


def brows_raised(c, w=3.0, y=19.0):
    for x, _ in EYES:
        c.stroke(arc(x, y + 3.2, 6.2, 3.2, 200, 340), w)


def angry_lids(c, steep=5.5, y=29.5):
    """Cut the tops of the eyes with lines that slope down toward the nose."""
    left = ((45.0, y - steep / 2), (59.5, y + steep / 2))
    right = ((83.0, y - steep / 2), (68.5, y + steep / 2))
    lid_clip(c, [left, ((right[1][0], right[1][1]), (right[0][0], right[0][1]))])


# ---------------------------------------------------------------- mouth kits
def mouth_smile_classic(c):
    """Vector redraw of Roblox's default Smile mouth (a deep U); parameters fitted to the 128 px original."""
    c.stroke(arc(64.3, 76.6, 18.7, 19.5, 8, 172, 96), 6.1)


def open_d(c, x0, x1, top, depth, sag=1.6, tongue=True, teeth=0.0):
    """Open 'D' mouth: gently smiling top edge, round bottom. Optional tongue and upper-teeth band."""
    cx, rx = (x0 + x1) / 2, (x1 - x0) / 2
    n = 48
    top_edge = [(x0 + (x1 - x0) * i / n, top + sag * math.sin(math.pi * i / n)) for i in range(n + 1)]
    bottom = arc(cx, top, rx, depth, 0, 180, n)
    shape = top_edge + list(bottom)
    c.poly(shape)
    if teeth > 0:
        band = top_edge + [(x, y + teeth) for x, y in reversed(top_edge)]
        # keep the teeth inside the mouth shape
        layer = Canvas(c.px)
        layer.poly(band, WHITE)
        mask = Canvas(c.px)
        mask.poly(shape, WHITE)
        c.im.paste(layer.im, (0, 0), Image.composite(layer.im, Image.new("RGBA", layer.im.size), mask.im.getchannel("A")).getchannel("A"))
    if tongue:
        layer = Canvas(c.px)
        layer.ellipse(cx, top + depth * 0.95, rx * 0.55, depth * 0.42, TONGUE)
        mask = Canvas(c.px)
        mask.poly(shape, WHITE)
        a = Image.composite(layer.im, Image.new("RGBA", layer.im.size), mask.im.getchannel("A")).getchannel("A")
        c.im.paste(layer.im, (0, 0), a)
    return shape


def frown(c, cx=64.0, cy=96.0, rx=11.0, ry=6.0, w=5.6):
    c.stroke(arc(cx, cy, rx, ry, 180, 360), w)


def flat(c, x0=56.5, x1=71.5, y=89.5, w=5.4):
    c.stroke([(x0, y), (x1, y)], w)


def toothy_grin(c, x0=43.5, x1=84.5, top=80.5, depth=19.0, curve=5.0, rows=True):
    """Epic-style grin: white crescent with black outline and tooth lines."""
    cx = (x0 + x1) / 2
    n = 60
    top_edge = [(x0 + (x1 - x0) * i / n, top + curve * math.sin(math.pi * i / n)) for i in range(n + 1)]
    bottom = [(x1 - (x1 - x0) * i / n, top + depth * math.sin(math.pi * i / n)) for i in range(n + 1)]
    shape = top_edge + bottom
    c.poly(shape, WHITE)
    # tooth lines clipped to the grin
    lines = Canvas(c.px)
    for k in range(1, 8):
        x = x0 + (x1 - x0) * k / 8
        lines.stroke([(x, top - 2), (x, top + depth + 2)], 1.9)
    if rows:
        mid = [(x0 + (x1 - x0) * i / n, top + (curve + depth) / 2 * math.sin(math.pi * i / n) * 0.78 + 0.5) for i in range(n + 1)]
        lines.stroke(mid, 1.9)
    mask = Canvas(c.px)
    mask.poly(shape, WHITE)
    a = Image.composite(lines.im, Image.new("RGBA", lines.im.size), mask.im.getchannel("A")).getchannel("A")
    c.im.paste(lines.im, (0, 0), a)
    c.stroke(shape + [shape[0]], 3.0)


# ---------------------------------------------------------------- faces
FACES = {}


def face(name, desc, aliases=(), group="expression"):
    def reg(fn):
        FACES[name] = {"fn": fn, "desc": desc, "aliases": list(aliases), "group": group}
        return fn
    return reg


@face("neutral", "Default eyes, flat mouth.")
def _(e, m):
    eyes_default(e); flat(m)


@face("happy", "Vector redraw of Roblox's default Smile face (asset 144075659).", ["smile"])
def _(e, m):
    eyes_default(e); mouth_smile_classic(m)


@face("surprised", "Bigger eyes, raised brows, small O mouth.")
def _(e, m):
    eyes_default(e, 4.4, 10.0); brows_raised(e, y=17.2); m.ellipse(64, 89, 5.8, 7.6)


@face("angry", "Slanted brows, lidded eyes, frown.")
def _(e, m):
    eyes_default(e); angry_lids(e); brows_angry(e); frown(m, cy=97.5, rx=10.5, ry=5.6)


@face("sad", "Worried brows, frown.")
def _(e, m):
    eyes_default(e, 3.8, 8.2); brows_worried(e, y=21.5); frown(m, cy=98.5, rx=12.0, ry=7.0)


@face("laugh", "Closed happy eyes, wide open mouth with tongue.", ["laughing"])
def _(e, m):
    eyes_closed_up(e, rx=5.6, ry=4.8, w=3.9); open_d(m, 46.5, 81.5, 79.0, 18.0, sag=2.2)


@face("smug", "Half-lidded eyes, one raised brow, sideways smirk.")
def _(e, m):
    eyes_lidded(e, lid_y=34.0)
    e.stroke(arc(75.76, 22.0, 6.4, 3.0, 200, 340), 3.0)
    m.stroke([(53.5, 90.2), (60.0, 91.8), (67.0, 91.0), (73.0, 88.4), (76.8, 84.6)], 5.0)


@face("evil_grin", "Angry brows, narrowed eyes, big toothy Epic-style grin.")
def _(e, m):
    eyes_default(e); angry_lids(e, steep=7.0, y=31.0); brows_angry(e, w=4.1, steep=7.5, y=23.0); toothy_grin(m)


@face("scheming", "Narrow sideways-lidded eyes, low brows, long sly grin.")
def _(e, m):
    eyes_lidded(e, lid_y=34.8, slant=0.28)
    e.poly([(40, 44.5), (90, 44.5), (90, 60), (40, 60)], ERASE)       # squint from below
    brows_angry(e, w=3.4, steep=4.0, y=25.0)
    m.stroke([(49.0, 87.0), (56.0, 90.6), (64.0, 91.6), (72.0, 89.4), (78.2, 84.8), (80.0, 82.0)], 4.8)


@face("scared", "Worried brows, big eyes with highlights, wobbly open mouth.", ["panic"])
def _(e, m):
    for x, y in EYES:
        e.ellipse(x, y, 4.8, 10.2)
        e.ellipse(x - 1.4, y - 4.0, 1.55, 1.9, WHITE)
    brows_worried(e, y=17.5, steep=6.0)
    top = wave(51.5, 76.5, 85.0, 1.3, 1.5)                  # left -> right, one and a half wobbles
    m.poly(top + arc(64.0, 85.0, 12.5, 12.0, 0, 180, 48))   # bottom: right -> left


@face("crying", "Squeezed shut eyes, tear streams, wailing mouth.")
def _(e, m):
    eyes_closed_up(e, rx=5.2, ry=3.4, w=3.7, dy=1.0)
    brows_worried(e, y=21.0, steep=5.5)
    for x, y in EYES:
        e.poly([(x - 2.6, y + 3.5), (x + 2.6, y + 3.5), (x + 4.4, y + 30.0), (x - 4.4, y + 30.0)], TEAR)
        e.ellipse(x, y + 31.0, 5.2, 5.0, TEAR)
        e.stroke([(x - 1.2, y + 8.0), (x - 2.2, y + 27.0)], 1.2, WHITE)
    top = arc(64.0, 96.0, 13.5, 11.0, 180, 360, 48)          # left -> right over the top
    m.poly(top + arc(64.0, 96.0, 13.5, 3.2, 0, 180, 48))     # bottom: right -> left


@face("dizzy", "Spiral eyes, wavy mouth.")
def _(e, m):
    for x, y in EYES:
        spiral(e, x, y, 8.4, 2.35, 2.5)
    m.stroke(wave(51.5, 76.5, 90.0, 2.3, 2.5), 4.6)


@face("confused", "One brow up, one flat, off-centre squiggle mouth.")
def _(e, m):
    eyes_default(e)
    e.stroke([(45.5, 23.8), (58.5, 22.6)], 3.2)
    e.stroke(arc(75.76, 19.2, 6.6, 3.4, 195, 345), 3.2)
    m.stroke(wave(57.0, 75.0, 90.0, 1.9, 1.5, tilt=-3.0), 4.4)


@face("annoyed", "Deadpan: flat brows, half-lidded eyes, short flat mouth.", ["deadpan"])
def _(e, m):
    eyes_lidded(e, lid_y=35.2)
    e.stroke([(45.5, 25.0), (58.5, 25.0)], 3.0)
    e.stroke([(69.5, 25.0), (82.5, 25.0)], 3.0)
    flat(m, 58.0, 70.0, 90.0, 4.8)


@face("shocked", "White eyes with tiny pupils, high brows, gasp.")
def _(e, m):
    for x, y in EYES:
        e.ellipse(x, y, 8.2, 9.6)
        e.ellipse(x, y, 5.9, 7.3, WHITE)
        e.ellipse(x, y + 0.4, 1.55, 1.85)
    brows_raised(e, y=14.0, w=3.0)
    m.ellipse(64.0, 91.0, 8.2, 10.4)


@face("determined", "Low slanted brows, lidded eyes, clenched teeth.")
def _(e, m):
    eyes_default(e); angry_lids(e, steep=4.0, y=30.5); brows_angry(e, w=4.3, steep=4.5, y=24.0)
    m.poly([(52.5, 84.0), (75.5, 84.0), (75.5, 94.0), (52.5, 94.0)], WHITE)
    for x in (58.3, 64.0, 69.7):
        m.stroke([(x, 84.5), (x, 93.5)], 1.8)
    m.stroke([(53.0, 89.0), (75.0, 89.0)], 1.8)
    m.stroke([(52.5, 84.0), (75.5, 84.0), (75.5, 94.0), (52.5, 94.0), (52.5, 84.0)], 2.8)


@face("wink", "One eye closed, classic smile.")
def _(e, m):
    x, y = EYES[0]
    e.ellipse(x, y, EYE_RX, EYE_RY)
    x, y = EYES[1]
    e.stroke(arc(x, y + 1.6 + 2.1, 5.4, 4.2, 180, 360), 3.7)
    mouth_smile_classic(m)


@face("sleeping", "Closed relaxed eyes, small open snoring mouth.", ["sleepy", "afk"])
def _(e, m):
    eyes_closed_down(e, rx=5.2, ry=3.0, w=3.6, dy=2.0)
    m.ellipse(64.0, 91.0, 3.6, 4.4)


@face("nervous", "Worried brows, wobbly smile, sweat drop.", ["nervous_sweat"])
def _(e, m):
    eyes_default(e, 3.8, 8.4); brows_worried(e, y=20.5, steep=4.5)
    pts = []
    for i in range(41):
        u = i / 40
        x = 50.0 + 28.0 * u
        y = 88.0 + 4.0 * math.sin(math.pi * u) + (1.5 if i % 4 in (1, 2) else -0.2) * math.sin(math.pi * u)
        pts.append((x, y))
    m.stroke(pts, 4.0)
    # sweat drop on the forehead, to the character's left
    e.poly([(90.0, 12.0), (86.0, 22.5), (94.0, 22.5)], TEAR)
    e.ellipse(90.0, 23.2, 4.1, 4.1, TEAR)
    e.ellipse(88.9, 22.2, 1.0, 1.4, WHITE)


@face("love", "Heart eyes, open smile.", ["heart_eyes"])
def _(e, m):
    for x, y in EYES:
        heart(e, x, y + 0.5, 15.5)
    open_d(m, 50.5, 77.5, 82.5, 12.5, sag=1.8)


@face("cool", "Black sunglasses with glints, confident smirk.", ["sunglasses"])
def _(e, m):
    for i, (x, y) in enumerate(EYES):
        lens = [(x - 9.6, 27.4), (x + 9.6, 27.4)] + arc(x, 33.0, 9.6, 9.2, 0, 180, 40)
        e.poly(lens)
        e.stroke([(x - 5.5, 36.0), (x - 1.5, 30.0)], 1.6, WHITE)
        e.stroke([(x - 2.5, 37.5), (x - 1.0, 35.2)], 1.3, WHITE)
    e.stroke([(61.0, 29.5), (67.0, 29.5)], 2.6)
    e.stroke([(42.8, 28.6), (36.5, 27.0)], 2.4)
    e.stroke([(85.2, 28.6), (91.5, 27.0)], 2.4)
    m.stroke([(54.5, 89.2), (62.0, 91.4), (69.0, 90.6), (74.2, 87.6), (76.6, 84.8)], 5.0)


@face("blink", "Eyes closed with the classic smile; use for blinks.", ["eyes_closed"])
def _(e, m):
    eyes_closed_down(e, rx=4.6, ry=1.8, w=3.4, dy=1.5)
    mouth_smile_classic(m)


@face("suspicious", "One narrowed eye with a low brow, one raised brow, small side mouth.")
def _(e, m):
    eyes_default(e)
    x0, y0 = EYES[0]
    lid_clip(e, [((x0 - 6.5, 33.2), (x0 + 6.5, 34.2))])
    e.stroke([(45.0, 26.2), (58.5, 27.8)], 3.2)
    e.stroke(arc(75.76, 19.0, 6.4, 3.3, 195, 345), 3.1)
    flat(m, 61.0, 71.5, 90.5, 4.6)


@face("shouting", "Angry brows, big open yelling mouth with teeth and tongue.", ["yelling"])
def _(e, m):
    eyes_default(e); angry_lids(e, steep=6.0, y=30.0); brows_angry(e, w=3.9, steep=6.5, y=22.0)
    open_d(m, 46.0, 82.0, 80.0, 22.0, sag=-1.0, teeth=4.0)


@face("knocked_out", "X eyes, small open mouth with tongue out.", ["ko", "dead"])
def _(e, m):
    for x, y in EYES:
        e.stroke([(x - 5.0, y - 5.4), (x + 5.0, y + 5.4)], 3.5)
        e.stroke([(x - 5.0, y + 5.4), (x + 5.0, y - 5.4)], 3.5)
    m.ellipse(64.0, 89.0, 6.2, 5.2)
    m.ellipse(66.0, 95.2, 3.6, 4.6, TONGUE)
    m.stroke([(66.0, 92.5), (66.0, 97.0)], 0.9, (150, 40, 60, 255))


@face("disgusted", "One squeezed eye, one lidded eye, wavy frown with tongue out.")
def _(e, m):
    x, y = EYES[0]
    e.stroke([(x - 5.0, y - 5.0), (x + 4.2, y), (x - 5.0, y + 5.0)], 3.4)
    x1, y1 = EYES[1]
    e.ellipse(x1, y1, EYE_RX, EYE_RY)
    lid_clip(e, [((x1 - 6.5, 33.0), (x1 + 6.5, 35.5))])
    e.stroke([(44.0, 24.5), (57.5, 28.5)], 3.2)
    e.stroke([(69.5, 26.0), (83.0, 23.5)], 3.2)
    m.ellipse(59.0, 95.0, 4.0, 5.2, TONGUE)
    m.stroke(wave(51.0, 77.0, 91.0, 1.8, 2.0, tilt=2.0), 4.4)


@face("squeezed", "Both eyes squeezed shut (> <), brows pinched down, gritted teeth.")
def _(e, m):
    x, y = EYES[0]
    e.stroke([(x - 5.0, y - 5.0), (x + 4.2, y), (x - 5.0, y + 5.0)], 3.4)
    x, y = EYES[1]
    e.stroke([(x + 5.0, y - 5.0), (x - 4.2, y), (x + 5.0, y + 5.0)], 3.4)
    brows_angry(e, w=3.6, steep=3.5, y=23.0)
    m.poly([(52.5, 85.0), (75.5, 85.0), (75.5, 93.0), (52.5, 93.0)], WHITE)
    for x in (58.3, 64.0, 69.7):
        m.stroke([(x, 85.5), (x, 92.5)], 1.8)
    m.stroke([(52.5, 85.0), (75.5, 85.0), (75.5, 93.0), (52.5, 93.0), (52.5, 85.0)], 2.8)


@face("talking", "Default eyes, medium open mouth.")
def _(e, m):
    eyes_default(e); open_d(m, 53.0, 75.0, 84.0, 11.5, sag=1.4)


# Lip-sync set: identical default eyes, only the mouth changes. All centred on x = 64.
@face("mouth_closed", "Lip-sync: closed (M, B, P) - soft smile line.", group="lipsync")
def _(e, m):
    eyes_default(e); m.stroke(arc(64.0, 84.5, 11.5, 5.8, 8, 172, 48), 5.4)


@face("mouth_small", "Lip-sync: small open (most consonants).", group="lipsync")
def _(e, m):
    eyes_default(e); open_d(m, 55.0, 73.0, 85.0, 8.0, sag=1.2, tongue=False)


@face("mouth_wide", "Lip-sync: wide open (A, I).", group="lipsync")
def _(e, m):
    eyes_default(e); open_d(m, 50.0, 78.0, 82.0, 17.0, sag=1.8)


@face("mouth_o", "Lip-sync: rounded O (O, U, W).", group="lipsync")
def _(e, m):
    eyes_default(e); m.ellipse(64.0, 90.0, 6.3, 8.4)


@face("mouth_e", "Lip-sync: wide smile showing teeth (E, EE).", group="lipsync")
def _(e, m):
    eyes_default(e); open_d(m, 48.0, 80.0, 83.0, 13.5, sag=2.4, tongue=False, teeth=3.6)


def render(name, px, ss=4):
    big = px * ss
    e, m = Canvas(big), Canvas(big)
    FACES[name]["fn"](e, m)
    eyes = e.im.resize((px, px), Image.LANCZOS)
    mouth = m.im.resize((px, px), Image.LANCZOS)
    full = Image.alpha_composite(eyes.copy(), mouth)
    return full, eyes, mouth


def sheet(images, names, cols, cell, bg=(245, 205, 48, 255)):
    rows = (len(images) + cols - 1) // cols
    pad = 30
    out = Image.new("RGBA", (cols * cell, rows * (cell + pad)), (255, 255, 255, 255))
    d = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    for i, (im, n) in enumerate(zip(images, names)):
        x, y = (i % cols) * cell, (i // cols) * (cell + pad)
        tile = Image.new("RGBA", (cell, cell), bg)
        tile.alpha_composite(im.resize((cell, cell), Image.LANCZOS))
        out.paste(tile, (x, y + pad))
        d.text((x + 6, y + 6), n, fill=(0, 0, 0, 255), font=font)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--size", type=int, default=1024)
    a = ap.parse_args()
    out = Path(a.out)
    (out / "layers" / "eyes").mkdir(parents=True, exist_ok=True)
    (out / "layers" / "mouth").mkdir(parents=True, exist_ok=True)
    fulls, names, meta = [], [], []
    for i, name in enumerate(FACES):
        full, eyes, mouth = render(name, a.size)
        full.save(out / f"{name}.png", optimize=True)
        eyes.save(out / "layers" / "eyes" / f"{name}.png", optimize=True)
        mouth.save(out / "layers" / "mouth" / f"{name}.png", optimize=True)
        fulls.append(full); names.append(name)
        f = FACES[name]
        meta.append({"index": i + 1, "name": name, "group": f["group"], "aliases": f["aliases"], "description": f["desc"],
                     "file": f"{name}.png", "eyes_layer": f"layers/eyes/{name}.png", "mouth_layer": f"layers/mouth/{name}.png"})
        print(f"{i + 1:2d} {name}")
    sheet(fulls, names, 8, 200).save(out / "face_sheet.png", optimize=True)
    tex = [(x + OFFSET, y + OFFSET) for x, y in EYES]
    info = {
        "size_px": a.size,
        "grid": "128-unit grid of Roblox's default Smile face (rbxasset://textures/face.png); multiply by size/128 for pixels",
        "eye_centres_grid": [list(p) for p in tex],
        "eye_centres_px": [[round(x * a.size / GRID, 2), round(y * a.size / GRID, 2)] for x, y in tex],
        "eye_centres_uv": [[round(x / GRID, 5), round(1 - y / GRID, 5)] for x, y in tex],
        "mouth_centre_grid": [64.0 + OFFSET, 89.0 + OFFSET],
        "ink": "#000000", "tongue": "#D6546E", "tear": "#60C4FF", "heart": "#FF3A5C",
        "faces": meta,
    }
    (out / "faces.json").write_text(json.dumps(info, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
