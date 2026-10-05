"""Make a black-and-white collie from the pack's one-piece golden retriever (creatures/animal_golden_retriver: a single
mesh, bones listed but no skin weights): cut it into hinged rigid parts and recolour it, written as
creatures/animal_collie_parts/ (one OBJ object per part + rig.json bodies) so web/lib/creature.js can pose it like the
other rigged creatures: loadCreature('animal_collie_parts'), poseCreature(c, { Head: [0, 0.3, 0] }).
Same method as tools/cut_bear.py. Made for The Dog Who Found The World Cup (Pickles, a black-and-white collie).

  python3 assets/roblox_pack/tools/cut_collie.py

Model space (as authored, before the loader's half turn): +Y up, the dog faces -X (nose at -X, tail at +X), its left
side is +Z. Every pivot has an identity frame, so pose angles are about the model axes:
  rz > 0  turns a hanging leg's foot back toward +X (and the nose down); rz < 0 swings a leg forward / lifts the nose.
  ry      turns the head left (+) / right (-);  rx rolls (a head tilt).
The model is 20 solid blocks; each goes whole into one part (leg block + paw block move together as one piece).
Colours: the source has one gold fur texture for every block, so each block gets a material instead: black fur (head,
ears, back, haunches, tail), white fur (muzzle, legs, paws), a black nose and dark eyes with white eye patches.
"""
from pathlib import Path
import json
from collections import Counter
import numpy as np
from PIL import Image

PACK = Path(__file__).resolve().parent.parent
SRC, NAME = PACK / 'creatures/animal_golden_retriver', 'animal_collie_parts'
DST = PACK / 'creatures' / NAME
TEX = 'animal_golden_retriver_i034p001x.png'

lines = (SRC / 'animal_golden_retriver.obj').read_text().splitlines()
V = np.array([list(map(float, l.split()[1:4])) for l in lines if l.startswith('v ')])
faces = [l for l in lines if l.startswith('f ')]
FV = [[int(p.split('/')[0]) - 1 for p in f.split()[1:]] for f in faces]

par = list(range(len(V)))
def find(a):
    while par[a] != a: par[a] = par[par[a]]; a = par[a]
    return a
for t in FV:
    for v in t[1:]: par[find(v)] = find(t[0])
comp = [find(t[0]) for t in FV]
box = {}
for i, k in enumerate(comp):
    vs = V[FV[i]]; lo, hi = box.get(k, (vs.min(0), vs.max(0)))
    box[k] = (np.minimum(lo, vs.min(0)), np.maximum(hi, vs.max(0)))


def classify(k):
    """(part, material) for one block, from its bounding box ."""
    (x0, y0, z0), (x1, y1, z1) = box[k]; zc = (z0 + z1) / 2; side = 'L' if zc > 0 else 'R'
    if x0 > 1.0 and y0 > 2.0: return 'Tail', 'fur_black'                                  # the tail, up at the back
    if x0 < -1.5 and x1 > 1.4: return 'Body', 'fur_black'                                 # the torso is one box
    if y1 < 0.3: return ('Front' if x1 < 0 else 'Rear') + side, 'fur_white'               # paws
    if x0 > -1.9 and y1 < 2.6 and x1 < 0: return 'Front' + side, 'fur_white'              # front legs
    if x0 > -1.9 and y1 < 2.6 and x0 > 0: return 'Rear' + side, 'fur_black'               # rear legs (haunches)
    # the head and everything on it (all in front of x -1.9)
    if x0 < -2.75: return 'Head', 'nose'                                                  # the nose, at the tip
    if x1 - x0 < 0.2 and abs(zc) < 0.05: return 'Head', 'nose'                            # the mouth line
    if x1 - x0 < 0.2 and x0 < -2.45: return 'Head', 'eye'                                 # pupils (in front)
    if x1 - x0 < 0.2: return 'Head', 'eye_white'                                          # eye patches behind them
    if x0 < -2.6: return 'Head', 'fur_white'                                              # the muzzle
    return 'Head', 'fur_black'                                                            # head block and ears


# name: (parent, pivot in model space)
PARTS = {
    'Body': (None, (0.0, 2.0, 0)),
    'Head': ('Body', (-1.35, 2.55, 0)),
    'Tail': ('Body', (1.3, 2.45, 0)),
    'FrontL': ('Body', (-0.85, 2.15, 0.71)), 'FrontR': ('Body', (-0.85, 2.15, -0.71)),
    'RearL': ('Body', (0.85, 2.3, 0.7)), 'RearR': ('Body', (0.85, 2.3, -0.7)),
}
assign = [classify(k) for k in comp]
DST.mkdir(exist_ok=True)

# fur textures: the gold texture's light and shade, mapped onto black and onto white fur
src = np.asarray(Image.open(SRC / TEX).convert('RGB')).astype(float)
lum = src @ [0.299, 0.587, 0.114]; lum = (lum - lum.min()) / max(1e-6, lum.max() - lum.min())
for name, lo, hi, tint in [('fur_black', 26, 62, (1.0, 1.0, 1.08)), ('fur_white', 214, 250, (1.0, 0.99, 0.96))]:
    rgb = np.clip((lo + (hi - lo) * lum)[..., None] * np.array(tint), 0, 255).astype(np.uint8)
    Image.fromarray(rgb, 'RGB').save(DST / f'collie_{name}.png')

head = [f'# {NAME}: the pack golden retriever cut into hinged parts and recoloured as a collie by tools/cut_collie.py.',
        f'mtllib {NAME}.mtl'] + [l for l in lines if l.startswith(('v ', 'vt ', 'vn '))]
body = []
for p in PARTS:
    for mat in ['fur_black', 'fur_white', 'nose', 'eye', 'eye_white']:
        fs = [f for f, a in zip(faces, assign) if a == (p, mat)]
        if fs: body += [f'o {p}', f'usemtl {mat}', *fs]
(DST / f'{NAME}.obj').write_text('\n'.join(head + body) + '\n')
mtl = [f'# Materials for {NAME}. Kd is sRGB. Textures sit next to this file.']
for mat, kd, ns, tex in [('fur_black', '1 1 1', 12, 'collie_fur_black.png'), ('fur_white', '1 1 1', 12, 'collie_fur_white.png'),
                         ('nose', '0.06 0.06 0.07', 60, None), ('eye', '0.05 0.04 0.04', 80, None), ('eye_white', '0.96 0.95 0.92', 30, None)]:
    mtl += [f'newmtl {mat}', f'Kd {kd}', 'Ks 0.0500 0.0500 0.0500', f'Ns {ns}', 'd 1.0000', 'illum 2'] + ([f'map_Kd {tex}'] if tex else []) + ['']
(DST / f'{NAME}.mtl').write_text('\n'.join(mtl))
cf = lambda p: [p[0], p[1], p[2], 1, 0, 0, 0, 1, 0, 0, 0, 1]
rig = {'name': NAME, 'source': 'creatures/animal_golden_retriver cut and recoloured by tools/cut_collie.py',
       'conventions': 'model space as animal_golden_retriver (+Y up, faces -X, left = +Z); pivots have identity frames: rz > 0 = leg foot back / nose down, ry > 0 = turn to its left',
       'size': [5.6119, 4.2039, 2.8564], 'root': 'Body',
       'bodies': [{'name': n, 'parent': p, 'joint': None if p is None else n + 'Hinge', 'pivot': cf(pv), 'rest': cf(pv), 'hasGeometry': any(a[0] == n for a in assign)}
                  for n, (p, pv) in PARTS.items()],
       'joints': [], 'attachments': [], 'animations': []}
(DST / 'rig.json').write_text(json.dumps(rig, indent=1))
print(NAME, dict(Counter(f'{p}/{m}' for p, m in assign)))
