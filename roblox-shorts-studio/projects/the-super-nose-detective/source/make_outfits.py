"""70s Miami outfits as character atlases (same layout as the pack's <name>_composite.png, 128 px per stud).

    python3 source/make_outfits.py      # -> web/outfits/max_miami.png, leo_chief.png, skye_70s.png

The clip swaps the body material's map for these (head swatch kept, so skin and face are unchanged).
Max: pink palm-print shirt (open collar, short sleeves), brown shoulder-holster straps (no gun), white trousers and
loafers, gold badge on the belt. Leo (the Chief): navy blazer, white shirt, red tie, gold badge, grey trousers.
Skye: coral 70s halter top with white flowers, white flares.
"""
import random
from pathlib import Path
from PIL import Image, ImageDraw

P = Path(__file__).resolve().parent.parent
PACK = P.parent.parent / 'assets/roblox_pack/characters'
OUT = P / 'web/outfits'
# Atlas layout (build_characters_local.py LAYOUT): part -> face -> (x, y, w, h). Front tiles: viewer's left = character's right.
LAYOUT = {
    'Torso': {'R': (0, 0, 128, 256), 'F': (128, 0, 256, 256), 'L': (384, 0, 128, 256), 'B': (512, 0, 256, 256), 'U': (0, 896, 256, 128), 'D': (256, 896, 256, 128)},
    'Right Arm': {'L': (0, 256, 128, 256), 'B': (128, 256, 128, 256), 'R': (256, 256, 128, 256), 'F': (384, 256, 128, 256), 'U': (0, 768, 128, 128), 'D': (128, 768, 128, 128)},
    'Left Arm': {'F': (512, 256, 128, 256), 'L': (640, 256, 128, 256), 'B': (768, 256, 128, 256), 'R': (896, 256, 128, 256), 'U': (256, 768, 128, 128), 'D': (384, 768, 128, 128)},
    'Right Leg': {'L': (0, 512, 128, 256), 'B': (128, 512, 128, 256), 'R': (256, 512, 128, 256), 'F': (384, 512, 128, 256), 'U': (512, 768, 128, 128), 'D': (640, 768, 128, 128)},
    'Left Leg': {'F': (512, 512, 128, 256), 'L': (640, 512, 128, 256), 'B': (768, 512, 128, 256), 'R': (896, 512, 128, 256), 'U': (768, 768, 128, 128), 'D': (896, 768, 128, 128)},
}
SIDES = 'FBLR'
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def base(name):
    return Image.open(PACK / name / f'{name.lower()}_composite.png').convert('RGBA')


def fill(d, rect, col, y0=0.0, y1=1.0):
    x, y, w, h = rect
    d.rectangle([x, y + round(h * y0), x + w - 1, y + round(h * y1) - 1], fill=col)


def pattern(im, rect, cols, seed, y0=0.0, y1=1.0, n=7):
    """Palm-leaf / hibiscus print inside the rect (between y0 and y1 of its height)."""
    d = ImageDraw.Draw(im); x, y, w, h = rect; r = random.Random(seed)
    top, bot = y + h * y0, y + h * y1
    for _ in range(int(n * w * (bot - top) / (128 * 128))):
        cx, cy, s = x + r.random() * w, top + r.random() * (bot - top), 10 + r.random() * 12
        c = r.choice(cols)
        if r.random() < 0.55:      # leaf: a fan of thin ellipses
            for k in range(5):
                a = -1.2 + k * 0.6
                ex, ey = cx + s * 0.9 * __import__('math').sin(a), cy - s * 0.9 * __import__('math').cos(a)
                d.line([cx, cy, ex, ey], fill=c, width=4)
        else:                      # flower: five dots and a centre
            for k in range(5):
                a = k * 1.2566
                d.ellipse([cx + s * 0.5 * __import__('math').cos(a) - 5, cy + s * 0.5 * __import__('math').sin(a) - 5,
                           cx + s * 0.5 * __import__('math').cos(a) + 5, cy + s * 0.5 * __import__('math').sin(a) + 5], fill=c)
            d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=cols[0])
    # keep the print inside the tile
    return im


def clip_rect(im, src, rect, y0, y1):
    x, y, w, h = rect
    box = (x, y + round(h * y0), x + w, y + round(h * y1))
    im.paste(src.crop(box), box[:2])


def max_miami():
    im = base('Max'); d = ImageDraw.Draw(im)
    skin, pink, white, brown, gold = hexc('#F0B774'), hexc('#D9628F'), hexc('#F3F0E8'), hexc('#6B3E22'), hexc('#E8B931')
    prints = [hexc('#F6A9C6'), hexc('#9B3561'), hexc('#F3D3E0')]
    for arm in ('Right Arm', 'Left Arm'):
        for rect in LAYOUT[arm].values(): fill(d, rect, skin)
    # Shirt on the torso (above the belt) and the top 40% of the arms; white trousers below.
    shirt = Image.new('RGBA', im.size)
    sd = ImageDraw.Draw(shirt)
    for f, rect in LAYOUT['Torso'].items():
        if f == 'D': continue
        fill(sd, rect, pink, 0, 1 if f == 'U' else 0.86); pattern(shirt, rect, prints, hash(f) & 999, 0, 1 if f == 'U' else 0.86)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(sd, rect, pink, 0, 0.42); pattern(shirt, rect, prints, len(arm) + ord(f), 0, 0.42)
            elif f == 'U': fill(sd, rect, pink); pattern(shirt, rect, prints, 5)
    # Clip the print back to the shirt areas (pattern strokes can spill past a tile edge).
    for f, rect in LAYOUT['Torso'].items():
        if f == 'D': continue
        clip_rect(im, shirt, rect, 0, 1 if f == 'U' else 0.86)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: clip_rect(im, shirt, rect, 0, 0.42)
            elif f == 'U': clip_rect(im, shirt, rect, 0, 1)
            # sleeve hem
            if f in SIDES: fill(d, rect, hexc('#B84A76'), 0.40, 0.43)
    # Trousers + belt on the torso, trousers + loafers on the legs.
    for f, rect in LAYOUT['Torso'].items():
        if f in SIDES: fill(d, rect, brown, 0.86, 0.91); fill(d, rect, white, 0.91, 1)
        if f == 'D': fill(d, rect, white)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, white, 0, 0.9); fill(d, rect, hexc('#E2DCCC'), 0.9, 0.97); fill(d, rect, hexc('#8A8478'), 0.97, 1)
            elif f == 'U': fill(d, rect, white)
            else: fill(d, rect, hexc('#8A8478'))
        x, y, w, h = LAYOUT[leg]['F']; d.line([x + w // 2, y + 10, x + w // 2, y + h * 0.88], fill=hexc('#DDD8CC'), width=3)   # crease
    # Front details: open collar showing skin, collar points, buttons, holster straps, badge on the belt.
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 46, y), (cx + 46, y), (cx, y + 92)], fill=skin)
    d.polygon([(cx - 46, y), (cx - 20, y + 4), (cx - 6, y + 70), (cx - 34, y + 34)], fill=hexc('#F3B5CD'))
    d.polygon([(cx + 46, y), (cx + 20, y + 4), (cx + 6, y + 70), (cx + 34, y + 34)], fill=hexc('#F3B5CD'))
    for by in (112, 150, 188): d.ellipse([cx - 4, y + by - 4, cx + 4, y + by + 4], fill=hexc('#F7E7EE'))
    for sx in (x + 30, x + w - 30):                           # straps down from the shoulders
        d.line([sx, y, sx + (10 if sx < cx else -10), y + 200], fill=brown, width=12)
    for f in ('R', 'L'):                                       # the holster under the character's left arm, strap on the right
        rx, ry, rw, rh = LAYOUT['Torso'][f]
        d.line([rx + rw // 2, ry, rx + rw // 2, ry + 200], fill=brown, width=12)
        if f == 'L': d.rounded_rectangle([rx + 30, ry + 120, rx + 98, ry + 196], 10, fill=hexc('#5A3219'))
    bx, by = x + w - 70, y + int(h * 0.86) - 6                  # gold badge on the belt (character's left)
    d.polygon([(bx, by), (bx + 34, by), (bx + 40, by + 18), (bx + 17, by + 46), (bx - 6, by + 18)], fill=gold, outline=hexc('#A57E12'))
    d.ellipse([bx + 10, by + 12, bx + 24, by + 26], fill=hexc('#C99A1E'))
    x, y, w, h = LAYOUT['Torso']['B']
    d.line([x + 20, y, x + w - 20, y + 200], fill=brown, width=12); d.line([x + w - 20, y, x + 20, y + 200], fill=brown, width=12)
    return im


def leo_chief():
    im = base('Leo'); d = ImageDraw.Draw(im)
    navy, navy2, shirt, tie, grey, black, gold = hexc('#1F2B48'), hexc('#18223A'), hexc('#F4F4F2'), hexc('#A3222E'), hexc('#4A505C'), hexc('#1A1A1E'), hexc('#E8B931')
    for arm in ('Right Arm', 'Left Arm'):
        for rect in LAYOUT[arm].values(): fill(d, rect, hexc('#F2C89A'))
    for f, rect in LAYOUT['Torso'].items():
        fill(d, rect, navy if f != 'D' else grey)
        if f in SIDES: fill(d, rect, grey, 0.9, 1)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, navy, 0, 0.84); fill(d, rect, shirt, 0.84, 0.89)
            elif f == 'U': fill(d, rect, navy)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, grey, 0, 0.9); fill(d, rect, black, 0.9, 1)
            else: fill(d, rect, grey if f == 'U' else black)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 50, y), (cx + 50, y), (cx + 10, y + 150), (cx - 10, y + 150)], fill=shirt)                 # shirt V
    d.polygon([(cx - 50, y), (cx - 30, y), (cx - 4, y + 150), (cx - 40, y + 70)], fill=navy2)                    # lapels
    d.polygon([(cx + 50, y), (cx + 30, y), (cx + 4, y + 150), (cx + 40, y + 70)], fill=navy2)
    d.polygon([(cx - 9, y + 6), (cx + 9, y + 6), (cx + 12, y + 120), (cx, y + 140), (cx - 12, y + 120)], fill=tie)
    d.rectangle([cx - 10, y, cx + 10, y + 12], fill=hexc('#7E1822'))
    for by in (170, 205): d.ellipse([cx - 6, y + by - 6, cx + 6, y + by + 6], fill=hexc('#C9A23A'))
    bx, by = x + w - 78, y + 70                                                                                   # chest badge
    d.polygon([(bx, by), (bx + 36, by), (bx + 42, by + 20), (bx + 18, by + 48), (bx - 6, by + 20)], fill=gold, outline=hexc('#A57E12'))
    d.line([x + 30, y + 150, x + 86, y + 150], fill=navy2, width=4)                                               # pocket
    return im


def skye_70s():
    im = base('Skye'); d = ImageDraw.Draw(im)
    coral, white, cream, skin = hexc('#F2724B'), hexc('#F6F2EA'), hexc('#FFE6C8'), hexc('#EAB892')
    for f, rect in LAYOUT['Torso'].items():
        if f == 'D': fill(d, rect, white); continue
        fill(d, rect, coral, 0, 1 if f == 'U' else 0.88); pattern(im, rect, [cream, white], ord(f), 0.05, 0.85, 5)
        if f in SIDES: fill(d, rect, hexc('#E8B931'), 0.86, 0.9); fill(d, rect, white, 0.9, 1)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(x, y), (cx - 40, y), (x, y + 60)], fill=skin); d.polygon([(x + w, y), (cx + 40, y), (x + w, y + 60)], fill=skin)   # halter shoulders
    for f in ('L', 'R'):
        rx, ry, rw, rh = LAYOUT['Torso'][f]; fill(d, (rx, ry, rw, rh), skin, 0, 0.18)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            fill(d, rect, skin)
            if f in SIDES: fill(d, rect, hexc('#E8B931'), 0.62, 0.68)          # gold bangle
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, white, 0, 0.93); fill(d, rect, hexc('#C9A86A'), 0.93, 1)
            else: fill(d, rect, white if f == 'U' else hexc('#C9A86A'))
    return im


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (('max_miami', max_miami), ('leo_chief', leo_chief), ('skye_70s', skye_70s)):
        fn().save(OUT / f'{name}.png', optimize=True); print('wrote', OUT / f'{name}.png')
