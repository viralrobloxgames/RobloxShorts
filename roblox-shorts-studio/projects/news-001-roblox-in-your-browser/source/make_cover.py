"""ViralRoblox News cover: Skye surprised, the story card in a TV frame, a 2-3 word headline, series band on top.

    python source/make_cover.py    -> delivery/Roblox_Without_The_App_cover.jpg (+ _grid.jpg, the TikTok 3:4 check)

Everything that matters sits inside y 290..1560, x 60..1020 (TikTok's profile grid shows y 240..1680).
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from compose_frames import P, W, H, LG, SEG, HOT, PLUM, PLUM_D, WHITE, RED, YEL, font, load_still, FACE

HEADLINE = [('NO APP', YEL), ('NEEDED?!', WHITE)]


def main():
    base = load_still('M_surprised')
    fx, fy = FACE['M']; z = 1.45
    w, h = W / z, H / z
    x0, y0 = fx + 130 / z - w / 2, fy + 60 / z - h / 2  # face lands left of centre, a little high
    cover = base.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))
    d = ImageDraw.Draw(cover, 'RGBA')
    # dark fade behind the headline
    fade = Image.new('L', (1, H)); [fade.putpixel((0, y), max(0, min(200, (y - 1050) * 200 // 350))) for y in range(H)]
    cover.paste(Image.new('RGB', (W, H), PLUM_D), (0, 0), fade.resize((W, H)))
    # series band
    d.rounded_rectangle((60, 300, 1020, 420), 26, fill=PLUM + (240,), outline=HOT, width=6)
    tw = font(LG, 64).getlength('ViralRoblox')
    d.text((90, 362), 'ViralRoblox', font=font(LG, 64), fill=WHITE, anchor='lm')
    bx = round(90 + tw + 24)
    d.rounded_rectangle((bx, 322, bx + 220, 402), 16, fill=RED); d.text((bx + 110, 364), 'NEWS', font=font(LG, 60), fill=WHITE, anchor='mm')
    d.rounded_rectangle((850, 322, 995, 402), 16, fill=WHITE); d.text((922, 364), '#1', font=font(LG, 62), fill=PLUM, anchor='mm')
    # story card in a TV frame, top right
    card = Image.open(P / 'source/evidence/wall_story_card.png').convert('RGB').resize((470, 264), Image.LANCZOS)
    tv = Image.new('RGBA', (510, 330), (0, 0, 0, 0)); td = ImageDraw.Draw(tv)
    td.rounded_rectangle((0, 0, 509, 304), 26, fill=(12, 6, 18), outline=HOT, width=8)
    td.polygon([(225, 304), (285, 304), (300, 329), (210, 329)], fill=(12, 6, 18))
    tv.paste(card, (20, 20))
    tv = tv.rotate(5, expand=True, resample=Image.BICUBIC)
    sh = Image.new('RGBA', tv.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (0, 0), tv.split()[3]); sh = sh.filter(ImageFilter.GaussianBlur(12))
    cover.paste(sh, (500, 470), sh); cover.paste(tv, (490, 455), tv)
    # headline, two lines, inside the safe band
    y = 1270
    for text, col in HEADLINE:
        f = font(LG, 190 if len(text) <= 6 else 170)
        d.text((W // 2, y), text, font=f, fill=col, anchor='mm', stroke_width=14, stroke_fill=PLUM_D)
        y += 170
    out = P / 'delivery'; out.mkdir(exist_ok=True)
    cover.save(out / 'Roblox_Without_The_App_cover.jpg', quality=90)
    cover.crop((0, 240, W, 1680)).save(out / 'Roblox_Without_The_App_cover_grid.jpg', quality=85)
    print('cover written')


if __name__ == '__main__':
    main()
