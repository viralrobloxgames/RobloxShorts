"""The Clown Case outfits as character atlases (same layout as the pack's <name>_composite.png, 128 px per stud).

    python3 source/make_outfits.py      # -> web/outfits/giggles.png, wife.png, scoop.png, crew.png

Max, the Chief and Skye reuse Case 1's (projects/the-super-nose-detective/web/outfits).
Mr. Giggles (Leo's rig): a sober navy suit, white shirt, red-and-white striped tie, white clown face, white gloves.
Mrs. Giggles (Mia's rig): a bright tangerine dress with a gold belt, gold bangles.
Big Scoop and his crew (the Noob's rig): white shirts under pink-and-white striped aprons (Scoop's apron says SCOOP).
"""
import importlib.util
from pathlib import Path
from PIL import ImageDraw, ImageFont

P = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('case1_outfits', P.parent / 'the-super-nose-detective/source/make_outfits.py')
c1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(c1)
LAYOUT, SIDES, hexc, fill, base = c1.LAYOUT, c1.SIDES, c1.hexc, c1.fill, c1.base
OUT = P / 'web/outfits'
HEAD = (512, 896, 128, 128)


def giggles():
    im = base('Leo'); d = ImageDraw.Draw(im)
    navy, navy2, white, glove = hexc('#1E2A4A'), hexc('#162038'), hexc('#F4F2EE'), hexc('#FBFBFB')
    fill(d, HEAD, hexc('#F7F5F2'))                                                                    # white face paint
    for f, rect in LAYOUT['Torso'].items(): fill(d, rect, navy)
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, navy, 0, 0.8); fill(d, rect, white, 0.8, 0.86); fill(d, rect, glove, 0.86, 1)
            elif f == 'U': fill(d, rect, navy)
            else: fill(d, rect, glove)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, navy2, 0, 0.9); fill(d, rect, hexc('#0B0B10'), 0.9, 1)
            else: fill(d, rect, navy2)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 40, y), (cx + 40, y), (cx + 14, y + 90), (cx - 14, y + 90)], fill=white)                    # shirt
    for i in range(7):                                                                                              # striped tie
        d.polygon([(cx - 14, y + 10 + i * 30), (cx + 14, y + 10 + i * 30), (cx + 16, y + 25 + i * 30), (cx - 16, y + 25 + i * 30)], fill=hexc('#D2283C'))
        d.polygon([(cx - 16, y + 25 + i * 30), (cx + 16, y + 25 + i * 30), (cx + 14, y + 40 + i * 30), (cx - 14, y + 40 + i * 30)], fill=white)
    d.polygon([(cx - 64, y), (cx - 40, y), (cx - 14, y + 150), (cx - 54, y + 90)], fill=navy2)                   # lapels
    d.polygon([(cx + 64, y), (cx + 40, y), (cx + 14, y + 150), (cx + 54, y + 90)], fill=navy2)
    d.ellipse([cx - 92, y + 40, cx - 66, y + 66], fill=hexc('#FFD23F'))                                           # VOTE badge
    return im


def wife():
    im = base('Mia'); d = ImageDraw.Draw(im)
    dress, dress2, gold = hexc('#FF8A2A'), hexc('#E86E12'), hexc('#E8B931')
    for f, rect in LAYOUT['Torso'].items():
        fill(d, rect, dress)
        if f in SIDES: fill(d, rect, gold, 0.6, 0.67)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    d.polygon([(cx - 64, y), (cx + 64, y), (cx, y + 64)], fill=hexc('#C98B5E'))                                   # neckline
    for k in range(5): d.ellipse([cx - 60 + k * 28, y + 150, cx - 44 + k * 28, y + 166], fill=hexc('#FFE08A'))     # polka belt studs
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES: fill(d, rect, dress, 0, 0.3); fill(d, rect, gold, 0.72, 0.8)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items():
            if f in SIDES: fill(d, rect, dress2, 0, 0.75)
            elif f == 'U': fill(d, rect, dress2)
    return im


def apron(name='SCOOP'):
    im = base('Noob'); d = ImageDraw.Draw(im)
    white, pink, pink2 = hexc('#FAF7F2'), hexc('#FF8FB8'), hexc('#F2F0EE')
    for f, rect in LAYOUT['Torso'].items(): fill(d, rect, white)
    x, y, w, h = LAYOUT['Torso']['F']; cx = x + w // 2
    for i in range(8): d.rectangle([cx - 90 + i * 24, y + 40, cx - 78 + i * 24, y + 256], fill=pink)              # striped apron
    d.rectangle([cx - 92, y + 30, cx + 92, y + 44], fill=hexc('#E0567F'))
    for sx in (-1, 1): d.line([cx + sx * 80, y + 34, cx + sx * 100, y], fill=hexc('#E0567F'), width=10)
    if name:
        d.rounded_rectangle([cx - 70, y + 110, cx + 70, y + 160], 10, fill=white)
        d.text((cx, y + 137), name, fill=hexc('#D2283C'), anchor='mm', font=ImageFont.truetype(str(P.parent.parent / 'assets/fonts/LuckiestGuy-Regular.ttf'), 34))
    for arm in ('Right Arm', 'Left Arm'):
        for f, rect in LAYOUT[arm].items():
            if f in SIDES or f == 'U': fill(d, rect, white, 0, 0.5)
    for leg in ('Right Leg', 'Left Leg'):
        for f, rect in LAYOUT[leg].items(): fill(d, rect, hexc('#3A3F55'))
    return im


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (('giggles', giggles), ('wife', wife), ('scoop', lambda: apron('SCOOP')), ('crew', lambda: apron(''))):
        fn().save(OUT / f'{name}.png', optimize=True); print('wrote', OUT / f'{name}.png')
