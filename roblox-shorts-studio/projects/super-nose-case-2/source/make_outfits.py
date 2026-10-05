"""The Vampire Case outfits as character atlases (same layout as the pack's <name>_composite.png, 128 px per stud).

    python3 source/make_outfits.py      # -> web/outfits/vlad.png, sister.png, gardener.png

Max and the Chief reuse Case 1's (projects/the-super-nose-detective/web/outfits). The head swatch (512, 896, 128, 128)
is painted too, so the vampires are pale; the face decal and hair are separate meshes and stay as they are.
Vlad (Leo's rig): black tailcoat, red waistcoat, white shirt and cravat, black trousers, pale hands.
His sister (Mia's rig): long black dress with a red sash, pale arms.
The gardener (the Noob's rig): green overalls over a cream shirt, big green gloves, brown boots.
"""
import importlib.util
from pathlib import Path
from PIL import ImageDraw

P = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('case1_outfits', P.parent / 'the-super-nose-detective/source/make_outfits.py')
c1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(c1)
LAYOUT, SIDES, hexc, fill, base = c1.LAYOUT, c1.SIDES, c1.hexc, c1.fill, c1.base
OUT = P / 'web/outfits'
HEAD = (512, 896, 128, 128)
PALE = hexc('#E4E2EC')


def vlad():
    im = base('Leo'); d = ImageDraw.Draw(im)
    black, black2, red, white, pale = hexc('#17151C'), hexc('#0E0D12'), hexc('#9C1B2A'), hexc('#F1EFEA'), PALE
    fill(d, HEAD, pale)
    for f, rect in LAYOUT['Torso'].items():
        fill(d, rect, black)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, black, 0, 0.82); fill(d, rect, white, 0.82, 0.87); fill(d, rect, pale, 0.87, 1)
            elif f == 'U': fill(d, rect, black)
            else: fill(d, rect, pale)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, black2, 0, 0.9); fill(d, rect, hexc('#050507'), 0.9, 1)
            else: fill(d, rect, black2)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 62, y), (cx + 62, y), (cx + 40, y + 200), (cx - 40, y + 200)], fill=red)                    # waistcoat
    d.polygon([(cx - 34, y), (cx + 34, y), (cx + 12, y + 70), (cx - 12, y + 70)], fill=white)                    # shirt
    d.polygon([(cx - 22, y + 8), (cx + 22, y + 8), (cx + 8, y + 56), (cx - 8, y + 56)], fill=hexc('#E2DCD0'))   # cravat
    d.polygon([(cx - 62, y), (cx - 40, y), (cx - 8, y + 150), (cx - 50, y + 90)], fill=black2)                   # lapels
    d.polygon([(cx + 62, y), (cx + 40, y), (cx + 8, y + 150), (cx + 50, y + 90)], fill=black2)
    for by in (110, 145, 180): d.ellipse([cx - 5, y + by - 5, cx + 5, y + by + 5], fill=hexc('#D9B44A'))
    d.ellipse([cx - 14, y + 74, cx + 14, y + 102], fill=hexc('#B3142A'), outline=hexc('#D9B44A'), width=3)       # ruby brooch
    return im


def sister():
    im = base('Mia'); d = ImageDraw.Draw(im)
    black, red, pale = hexc('#1A1620'), hexc('#8E1A2E'), PALE
    fill(d, HEAD, pale)
    for f, rect in LAYOUT['Torso'].items():
        fill(d, rect, black)
        if f in SIDES: fill(d, rect, red, 0.7, 0.78)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 70, y), (cx + 70, y), (cx, y + 70)], fill=pale)                                              # neckline
    d.ellipse([cx - 10, y + 58, cx + 10, y + 78], fill=hexc('#B3142A'))                                           # pendant
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, black, 0, 0.28); fill(d, rect, pale, 0.28, 1)
            elif f == 'U': fill(d, rect, black)
            else: fill(d, rect, pale)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, black, 0, 0.92); fill(d, rect, red, 0.92, 1)
            else: fill(d, rect, black if f == 'U' else red)
    return im


def gardener():
    im = base('Noob'); d = ImageDraw.Draw(im)
    green, green2, cream, glove, boot = hexc('#3E7B3A'), hexc('#2F622C'), hexc('#EFE3C2'), hexc('#5DB04B'), hexc('#6B4424')
    for f, rect in LAYOUT['Torso'].items():
        fill(d, rect, cream)
        if f in SIDES: fill(d, rect, green, 0.35, 1)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.rectangle([cx - 60, y + 40, cx + 60, y + 256], fill=green)                                                   # bib
    d.rectangle([cx - 40, y + 70, cx + 40, y + 130], fill=green2)                                                  # pocket
    for sx in (-1, 1):
        d.line([cx + sx * 56, y + 40, cx + sx * 80, y], fill=green, width=14)                                     # straps
        d.ellipse([cx + sx * 56 - 8, y + 42, cx + sx * 56 + 8, y + 58], fill=hexc('#D9B44A'))
    bx, by, bw, bh = LAYOUT['Torso']['B']
    for sx in (-1, 1): d.line([bx + bw // 2 + sx * 56, by + 90, bx + bw // 2 + sx * 80, by], fill=green, width=14)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, cream, 0, 0.55); fill(d, rect, glove, 0.55, 1)
            elif f == 'U': fill(d, rect, cream)
            else: fill(d, rect, glove)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, green, 0, 0.78); fill(d, rect, boot, 0.78, 1)
            else: fill(d, rect, green if f == 'U' else boot)
            if f in SIDES:
                for k in range(3): d.ellipse([rect[0] + 20 + 30 * k, rect[1] + 60 + 25 * k, rect[0] + 34 + 30 * k, rect[1] + 74 + 25 * k], fill=hexc('#6E5233'))   # soil
    return im


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (('vlad', vlad), ('sister', sister), ('gardener', gardener)):
        fn().save(OUT / f'{name}.png', optimize=True); print('wrote', OUT / f'{name}.png')
