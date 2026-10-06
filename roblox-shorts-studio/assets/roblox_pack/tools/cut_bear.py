"""Cut the pack's one-piece bear (creatures/animal_bear: a single mesh, bones listed but no skin weights) into hinged
rigid parts, written as creatures/animal_bear_parts/ (one OBJ object per part + rig.json bodies) so web/lib/creature.js
can pose it like the other rigged creatures: loadCreature('animal_bear_parts'), poseCreature(c, { Head: [0, 0.3, 0] }).
Same method as tools/cut_lion.py.

  python3 assets/roblox_pack/tools/cut_bear.py

Model space (as authored, before the loader's half turn): +Y up, the bear faces -X (nose at -X, tail at +X), its left
side is +Z. Every pivot has an identity frame, so pose angles are about the model axes:
  rz > 0  turns a hanging leg's foot back toward +X (and the nose down); rz < 0 swings a leg forward / lifts the nose.
  ry      turns the head left (+) / right (-);  rx rolls.
The model is 22 solid blocks; each goes whole into one part (leg block + paw block move together as one piece).
"""
from pathlib import Path
import json, shutil
from collections import Counter
import numpy as np

PACK = Path(__file__).resolve().parent.parent
SRC, NAME = PACK / 'creatures/animal_bear', 'animal_bear_parts'
DST = PACK / 'creatures' / NAME

lines = (SRC / 'animal_bear.obj').read_text().splitlines()
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


def part_of_block(k):
    (x0, y0, z0), (x1, y1, z1) = box[k]; zc = (z0 + z1) / 2
    if x0 > 2.9: return 'Tail'                                          # the stubby tail at the back
    if x0 < -2.0 and x1 > 3.0: return 'Body'                            # the torso is one box
    if x0 > 1.0 and x1 < 3.6 and y1 < 4.3: return 'RearL' if zc > 0 else 'RearR'      # rear leg + paw
    if x0 > -2.1 and x1 < 0 and y1 < 3.4: return 'FrontL' if zc > 0 else 'FrontR'     # front leg + paw
    return 'Head'                                                       # head block, ears, eyes, muzzle, nose


# name: (parent, pivot in model space)
PARTS = {
    'Body': (None, (0.7, 3.0, 0)),
    'Head': ('Body', (-1.2, 5.0, 0)),
    'Tail': ('Body', (3.0, 3.4, 0)),
    'FrontL': ('Body', (-0.93, 3.1, 1.96)), 'FrontR': ('Body', (-0.93, 3.1, -1.96)),
    'RearL': ('Body', (2.29, 3.9, 2.01)), 'RearR': ('Body', (2.29, 3.9, -2.01)),
}
assign = [part_of_block(k) for k in comp]
DST.mkdir(exist_ok=True)
head = [f'# {NAME}: the pack bear (creatures/animal_bear) cut into hinged parts by tools/cut_bear.py. Model space as the source.',
        f'mtllib {NAME}.mtl'] + [l for l in lines if l.startswith(('v ', 'vt ', 'vn '))]
body = []
for p in PARTS:
    fs = [f for f, a in zip(faces, assign) if a == p]
    if fs: body += [f'o {p}', 'usemtl tex_animal_bear_i001p001x', *fs]
(DST / f'{NAME}.obj').write_text('\n'.join(head + body) + '\n')
shutil.copy(SRC / 'animal_bear_i001p001x.png', DST)
(DST / f'{NAME}.mtl').write_text((SRC / 'animal_bear.mtl').read_text().replace('animal_bear.', NAME + '.'))
cf = lambda p: [p[0], p[1], p[2], 1, 0, 0, 0, 1, 0, 0, 0, 1]
rig = {'name': NAME, 'source': 'creatures/animal_bear cut by tools/cut_bear.py',
       'conventions': 'model space as animal_bear (+Y up, faces -X, left = +Z); pivots have identity frames: rz > 0 = leg foot back / nose down, ry > 0 = turn to its left',
       'size': [9.2854, 7.2834, 5.4619], 'root': 'Body',
       'bodies': [{'name': n, 'parent': p, 'joint': None if p is None else n + 'Hinge', 'pivot': cf(pv), 'rest': cf(pv), 'hasGeometry': n in assign}
                  for n, (p, pv) in PARTS.items()],
       'joints': [], 'attachments': [], 'animations': []}
(DST / 'rig.json').write_text(json.dumps(rig, indent=1))
print(NAME, dict(Counter(assign)))
