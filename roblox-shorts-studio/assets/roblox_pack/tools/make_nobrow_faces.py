"""Brow-less copies of the pack faces (for a character whose eyebrows got burned off), plus 'singed': the shocked face
with no brows and two soot smudges where they were. Every ink band above the eyes is erased; eyes and mouth are untouched,
so the eye centres stay on the shared grid and faces still swap cleanly.

    python3 tools/make_nobrow_faces.py      # writes faces/nobrow_<face>.png and faces/singed.png
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

F = Path(__file__).resolve().parent.parent / 'faces'
EYE_TOP = 200            # the eyes start at about y 204-241 (of 1024) on every face; brows sit above them

def strip(name):
    im = Image.open(F / f'{name}.png').convert('RGBA'); a = np.array(im)
    ink = np.where(a[:, :, 3].max(1) > 40)[0]
    bands, s, p = [], ink[0], ink[0]
    for r in ink[1:]:
        if r != p + 1: bands.append((s, p)); s = r
        p = r
    bands.append((s, p))
    eyes = next(b for b in bands if b[1] > EYE_TOP + 60)          # the eye band reaches well below the brows
    a[:eyes[0] - 2, :, 3] = 0
    return Image.fromarray(a)

for n in ['scared', 'sad', 'determined', 'surprised', 'shocked', 'annoyed', 'smug', 'confused']:
    strip(n).save(F / f'nobrow_{n}.png')
s = strip('shocked'); soot = Image.new('RGBA', s.size, (0, 0, 0, 0)); d = ImageDraw.Draw(soot)
for cx in (418, 606):                                             # where the brows were (eye centres x ~ 422 / 606)
    d.ellipse([cx - 62, 128, cx + 62, 176], fill=(40, 34, 30, 150))
soot = soot.filter(ImageFilter.GaussianBlur(14))
Image.alpha_composite(soot, s).save(F / 'singed.png')
print('wrote', [p.name for p in sorted(F.glob('nobrow_*.png'))] + ['singed.png'])
