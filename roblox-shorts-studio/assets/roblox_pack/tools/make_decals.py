"""Original decal images for the accessories, props and map kit (uploaded to Roblox for Studio, and shipped as PNGs).

    python make_decals.py <out_dir>
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONT = Path(__file__).resolve().parents[2] / "fonts" / "LuckiestGuy-Regular.ttf"
NAVY, GOLD, WHITE, INK = (31, 42, 68, 255), (255, 210, 63, 255), (255, 255, 255, 255), (21, 36, 53, 255)


def font(px):
    return ImageFont.truetype(str(FONT), px)


def outlined_text(d, xy, text, f, fill, outline, width, anchor="mm"):
    d.text(xy, text, font=f, fill=fill, anchor=anchor, stroke_width=width, stroke_fill=outline)


def rounded(d, box, r, fill, outline=None, width=0):
    d.rounded_rectangle(box, r, fill=fill, outline=outline, width=width)


def admin_badge():
    im = Image.new("RGBA", (1024, 320), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rounded(d, (8, 8, 1016, 312), 70, NAVY, GOLD, 22)
    outlined_text(d, (512, 172), "ADMIN", font(210), GOLD, INK, 10)
    return im


def free_coins():
    im = Image.new("RGBA", (1024, 384), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    rounded(d, (8, 8, 1016, 376), 60, (232, 36, 52, 255), WHITE, 20)
    outlined_text(d, (512, 200), "FREE COINS", font(124), GOLD, INK, 8)
    for cx in (84, 940):
        d.ellipse((cx - 46, 146, cx + 46, 238), fill=GOLD, outline=(196, 142, 18, 255), width=9)
        d.ellipse((cx - 26, 166, cx + 26, 218), outline=(224, 170, 30, 255), width=7)
    return im


def blank_face(w, h, radius=0):
    im = Image.new("RGBA", (w, h), NAVY)
    d = ImageDraw.Draw(im)
    b = max(12, w // 56)
    d.rectangle((b // 2, b // 2, w - 1 - b // 2, h - 1 - b // 2), outline=GOLD, width=b)
    return im


def checker(n=8, px=512):
    im = Image.new("RGBA", (px, px), WHITE)
    d = ImageDraw.Draw(im)
    s = px // n
    for y in range(n):
        for x in range(n):
            if (x + y) % 2:
                d.rectangle((x * s, y * s, x * s + s - 1, y * s + s - 1), fill=(24, 24, 28, 255))
    return im


def podium_number(n):
    im = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    outlined_text(d, (256, 286), str(n), font(400), WHITE, INK, 16)
    return im


def arrows():
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y0 in (40, 168):               # two chevrons per tile, pointing to the top of the image
        d.polygon([(56, y0 + 64), (128, y0), (200, y0 + 64), (200, y0 + 96), (128, y0 + 36), (56, y0 + 96)], fill=(255, 214, 10, 255))
    return im


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    items = {
        "admin_badge": admin_badge(),
        "free_coins_sign": free_coins(),
        "sign_blank": blank_face(1024, 336),
        "board_blank": blank_face(1024, 640),
        "timer_blank": blank_face(1024, 576),
        "finish_checker": checker(),
        "podium_1": podium_number(1),
        "podium_2": podium_number(2),
        "podium_3": podium_number(3),
        "conveyor_arrows": arrows(),
    }
    for k, im in items.items():
        im.save(out / f"{k}.png", optimize=True)
        print(k, im.size)


if __name__ == "__main__":
    main()
