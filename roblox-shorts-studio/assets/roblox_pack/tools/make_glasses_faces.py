"""Copies of the pack faces with thick black glasses drawn on (for a character whose eyesight matters to the story), plus
'frosty' copies with iced-over lenses. The frames sit at the shared eye centres from faces.json, so they stay put when
the expression swaps, and are drawn under nothing: brows above y 200 stay visible, mouths are far below.

    python3 tools/make_glasses_faces.py      # writes faces/glasses_<face>.png and faces/glasses_frost_<face>.png
"""
import json, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

F = Path(__file__).resolve().parent.parent / 'faces'
EYES = json.loads((F / 'faces.json').read_text())['eye_centres_px']
W, H, R, INK = 176, 156, 46, 20          # lens box (px of 1024), corner radius, frame thickness


def frames(size, frost=False):
    im = Image.new('RGBA', size, (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    boxes = [(cx - W / 2, cy - H / 2, cx + W / 2, cy + H / 2) for cx, cy in EYES]
    for b in boxes:                                                  # a faint glassy tint (or frost) inside each lens
        d.rounded_rectangle(b, R, fill=(235, 245, 255, 200) if frost else (200, 225, 255, 38))
    if frost:                                                        # ice crystals on the frost
        for b in boxes:
            x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            for k in range(6):

                a = k * math.pi / 3 + 0.3
                d.line([(cx, cy), (cx + 52 * math.cos(a), cy + 46 * math.sin(a))], fill=(255, 255, 255, 255), width=7)
    for b in boxes:
        d.rounded_rectangle(b, R, outline=(0, 0, 0, 255), width=INK)
    (l, r) = boxes
    yb = EYES[0][1] - 18
    d.line([(l[2] - 4, yb), (r[0] + 4, yb)], fill=(0, 0, 0, 255), width=INK)                 # bridge
    d.line([(l[0] + 4, yb), (l[0] - 40, yb - 10)], fill=(0, 0, 0, 255), width=INK)            # arms toward the ears
    d.line([(r[2] - 4, yb), (r[2] + 40, yb - 10)], fill=(0, 0, 0, 255), width=INK)
    return im


NAMES = ['happy', 'neutral', 'surprised', 'scared', 'shocked', 'determined', 'smug', 'nervous', 'laugh', 'sad', 'annoyed',
         'confused', 'dizzy', 'talking', 'mouth_o', 'knocked_out']
out = []
for n in NAMES:
    face = Image.open(F / f'{n}.png').convert('RGBA')
    for frost in (False, True):
        if frost and n not in ('scared', 'shocked', 'nervous', 'surprised'):
            continue
        im = face.copy(); im.alpha_composite(frames(face.size, frost))
        name = f'glasses_frost_{n}.png' if frost else f'glasses_{n}.png'
        im.save(F / name); out.append(name)
print('wrote', len(out), 'faces:', ', '.join(out))
