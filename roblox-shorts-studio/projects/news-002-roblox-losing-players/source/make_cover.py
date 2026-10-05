"""ViralRoblox News #2 cover: Skye surprised, the player-count chart in a TV frame, a 2-line headline, series band on top.

    python source/make_cover.py    -> delivery/Roblox_Is_Losing_Players_cover.jpg (+ .png, + _grid.jpg, the TikTok 3:4 check)

Same fixed layout as News #1. Everything that matters sits inside y 290..1560, x 60..1020 (TikTok's grid shows y 240..1680).
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from compose_frames import P, W, H, LG, HOT, PLUM, PLUM_D, WHITE, RED, YEL, font, chart_frame, SHOTS  # noqa: E402
from skye2d import load_still, FACE  # noqa: E402

TITLE = 'Roblox_Is_Losing_Players'
HEADLINE = [('30 MILLION', YEL), ('GONE?!', WHITE)]


def story_card():
    """The chart shot, fully grown, cropped to its panel (no PiP)."""
    s0, s1, k, a = next(s for s in SHOTS if s[2] == 'chart' and s[3]['upto'] == 3)
    f = chart_frame(s0 + 2.0, s0, s1, a)
    return f.crop((52, 492, 1028, 1113))


def main():
    base = load_still('M_surprised')
    fx, fy = FACE['M']; z = 1.45
    w, h = W / z, H / z
    x0, y0 = fx + 130 / z - w / 2, fy + 60 / z - h / 2  # face lands left of centre, a little high
    cover = base.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))
    d = ImageDraw.Draw(cover, 'RGBA')
    fade = Image.new('L', (1, H)); [fade.putpixel((0, y), max(0, min(200, (y - 1050) * 200 // 350))) for y in range(H)]
    cover.paste(Image.new('RGB', (W, H), PLUM_D), (0, 0), fade.resize((W, H)))
    # series band
    d.rounded_rectangle((60, 300, 1020, 420), 26, fill=PLUM + (240,), outline=HOT, width=6)
    tw = font(LG, 64).getlength('ViralRoblox')
    d.text((90, 362), 'ViralRoblox', font=font(LG, 64), fill=WHITE, anchor='lm')
    bx = round(90 + tw + 24)
    d.rounded_rectangle((bx, 322, bx + 220, 402), 16, fill=RED); d.text((bx + 110, 364), 'NEWS', font=font(LG, 60), fill=WHITE, anchor='mm')
    d.rounded_rectangle((850, 322, 995, 402), 16, fill=WHITE); d.text((922, 364), '#2', font=font(LG, 62), fill=PLUM, anchor='mm')
    # story card in a TV frame, top right
    card = story_card().resize((470, 299), Image.LANCZOS)
    tv = Image.new('RGBA', (510, 365), (0, 0, 0, 0)); td = ImageDraw.Draw(tv)
    td.rounded_rectangle((0, 0, 509, 339), 26, fill=(12, 6, 18), outline=HOT, width=8)
    td.polygon([(225, 339), (285, 339), (300, 364), (210, 364)], fill=(12, 6, 18))
    tv.paste(card, (20, 20))
    tv = tv.rotate(5, expand=True, resample=Image.BICUBIC)
    sh = Image.new('RGBA', tv.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (0, 0), tv.split()[3]); sh = sh.filter(ImageFilter.GaussianBlur(12))
    cover.paste(sh, (500, 470), sh); cover.paste(tv, (490, 455), tv)
    # headline, two lines, inside the safe band
    y = 1270
    for text, col in HEADLINE:
        f = font(LG, 170 if len(text) > 6 else 190)
        d.text((W // 2, y), text, font=f, fill=col, anchor='mm', stroke_width=14, stroke_fill=PLUM_D)
        y += 170
    out = P / 'delivery'; out.mkdir(exist_ok=True)
    cover.save(out / f'{TITLE}_cover.jpg', quality=90); cover.save(out / f'{TITLE}_cover.png')
    cover.crop((0, 240, W, 1680)).save(out / f'{TITLE}_cover_grid.jpg', quality=85)
    print('cover written')


if __name__ == '__main__':
    main()
