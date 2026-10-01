"""ViralRoblox News LED-wall graphic: pink newsroom globe with light rays and a block-city skyline.

    python make_news_wall.py <pack>      -> <pack>/decals/news_wall_brand.png (1024x576, 16:9)

The anchor stands in front of the centre, so the globe sits behind her head. No logo on the wall: the vertical crop cuts
the wall's edges, and the logo is already on the desk, the LED band and the video overlay.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 1024, 576
HOT = (255, 79, 163)
PLUM = (58, 24, 82)
LIGHT = (255, 214, 234)


def radial(w, h, inner, outer, cx, cy, r):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = min(1.0, math.hypot(x - cx, (y - cy) * 1.15) / r)
            t = t * t * (3 - 2 * t)
            px[x, y] = tuple(int(inner[i] + (outer[i] - inner[i]) * t) for i in range(3))
    return img


def main(pack):
    pack = Path(pack).resolve()
    img = radial(W, H, (255, 120, 190), PLUM, W / 2, H * 0.46, W * 0.62)
    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    cx, cy = W / 2, H * 0.46
    # light rays
    for i in range(18):
        a0 = i / 18 * 2 * math.pi
        a1 = a0 + math.pi / 36
        pts = [(cx, cy)] + [(cx + 900 * math.cos(a), cy + 900 * math.sin(a)) for a in (a0, a1)]
        d.polygon(pts, fill=(255, 255, 255, 18))
    # globe: outline, latitudes, longitudes
    R = 230
    d.ellipse((cx - R, cy - R, cx + R, cy + R), fill=(255, 140, 200, 40), outline=LIGHT + (200,), width=5)
    for k in range(1, 6):
        yy = cy - R + k * (2 * R / 6)
        half = math.sqrt(max(0, R * R - (yy - cy) ** 2))
        d.ellipse((cx - half, yy - half * 0.12, cx + half, yy + half * 0.12), outline=LIGHT + (120,), width=3)
    for k in range(1, 6):
        rx = R * abs(math.cos(k * math.pi / 6))
        d.ellipse((cx - rx, cy - R, cx + rx, cy + R), outline=LIGHT + (120,), width=3)
    # orbit ring
    d.ellipse((cx - R * 1.45, cy - R * 0.32, cx + R * 1.45, cy + R * 0.32), outline=(255, 255, 255, 150), width=4)
    over = over.filter(ImageFilter.GaussianBlur(0.6))
    img = Image.alpha_composite(img.convert("RGBA"), over)
    # block-city skyline along the bottom
    sky = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s = ImageDraw.Draw(sky)
    x, seed = 0, 7
    while x < W:
        seed = (seed * 1103515245 + 12345) % 2**31
        bw = 34 + seed % 46
        bh = 70 + (seed // 97) % 120
        s.rectangle((x, H - bh, x + bw, H), fill=(74, 26, 104, 235))
        s.rectangle((x, H - bh, x + bw, H - bh + 3), fill=HOT + (255,))
        for wy in range(H - bh + 14, H - 8, 16):
            for wx in range(x + 6, x + bw - 8, 12):
                seed = (seed * 1103515245 + 12345) % 2**31
                if seed % 3 == 0:
                    s.rectangle((wx, wy, wx + 5, wy + 7), fill=(255, 200, 225, 200))
        x += bw + 4
    img = Image.alpha_composite(img, sky)
    out = pack / "decals" / "news_wall_brand.png"
    img.convert("RGB").save(out, optimize=True)
    print(f"wrote {out}")


if __name__ == "__main__":
    main(sys.argv[1])
