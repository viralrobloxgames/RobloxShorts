"""Cut the pack's one-piece lion (creatures/animal_lion: a single mesh, bones listed but no skin weights) into hinged
rigid parts, written as creatures/animal_lion_parts/ (one OBJ object per part + rig.json bodies) so web/lib/creature.js
can pose it like the other rigged creatures: loadCreature('animal_lion_parts'), poseCreature(c, { Head: [0, 0, 0.3] }).

  python3 assets/roblox_pack/tools/cut_lion.py

Model space (as authored, before the loader's half turn): +Y up, the lion faces -X (head and toes at -X, tail at +X),
its left side is +Z. Every pivot has an identity frame, so pose angles are about the model axes:
  rz > 0  pitches nose / leg / jaw tip DOWN-FORWARD... precisely: rotates -X toward -Y (nose down, jaw open, a
          hanging leg swings back toward +X).  rz < 0 lifts the nose / swings a leg forward.
  rx      rolls about the body's long axis;  ry turns left/right (ry > 0 turns the nose toward +Z, the lion's left).
The cuts follow the model's own blocks (each solid block goes whole into one part), so nothing tears when a part turns;
the legs and tail are single blocks (no knee), so each turns as one piece. The face turns inside the fixed mane ring.
"""
from pathlib import Path
import json, shutil
import numpy as np

PACK = Path(__file__).resolve().parent.parent
SRC, NAME = PACK / 'creatures/animal_lion', 'animal_lion_parts'
DST = PACK / 'creatures' / NAME

lines = (SRC / 'animal_lion.obj').read_text().splitlines()
V = np.array([list(map(float, l.split()[1:4])) for l in lines if l.startswith('v ')])
faces = [l for l in lines if l.startswith('f ')]
FV = [[int(p.split('/')[0]) - 1 for p in f.split()[1:]] for f in faces]

# The model is 29 separate solid blocks (connected components). Each block goes whole into one part: cutting through a
# block (its triangles run the full length of a leg, say) tears it when the part turns.
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
count = {k: comp.count(k) for k in box}


def part_of_block(k):
    (x0, y0, z0), (x1, y1, z1) = box[k]; zc = (z0 + z1) / 2
    if x0 > 2.3: return 'Tail'                                          # the tail, one chain of blocks
    if x0 > 0.5 and x1 < 2.7: return 'RearL' if zc > 0 else 'RearR'     # rear leg + paw
    if x1 < -0.8 and y1 < 3.9 and abs(zc) > 0.5: return 'FrontL' if zc > 0 else 'FrontR'
    if x0 < -2.7 and x1 > 2.6: return 'Body'                            # the torso is one box
    if x1 < -4.4 and count[k] in (28, 36): return 'Jaw'                 # the muzzle blocks: the jaw drops open (nose stays)
    if x1 < -4.4 or (x0 < -4.5 and y0 > 3.4 and y1 < 6.3 and abs(zc) < 0.3 and z1 < 1.7):   # nose, upper muzzle, ears
        return 'Head'
    if x0 < -4.5 and z1 < 1.7 and y0 > 3.4: return 'Head'               # the head block itself
    return 'Mane'                                                       # every mane layer and the chest bib


# name: (parent, pivot in model space)
PARTS = {
    'Body': (None, (0.0, 3.1, 0)),
    'Mane': ('Body', (-1.5, 4.2, 0)),
    'Head': ('Body', (-2.4, 4.6, 0)),
    'Jaw': ('Head', (-4.45, 4.78, 0)),                                   # hinged at the muzzle's top back
    'Tail': ('Body', (2.45, 4.0, 0)),
    'FrontL': ('Body', (-1.65, 3.6, 1.2)), 'FrontR': ('Body', (-1.65, 3.6, -1.2)),
    'RearL': ('Body', (1.7, 3.9, 1.2)), 'RearR': ('Body', (1.7, 3.9, -1.2)),
}
assign = [part_of_block(k) for k in comp]
DST.mkdir(exist_ok=True)
head = [f'# {NAME}: the pack lion (creatures/animal_lion) cut into hinged parts by tools/cut_lion.py. Model space as the source.',
        f'mtllib {NAME}.mtl'] + [l for l in lines if l.startswith(('v ', 'vt ', 'vn '))]
body = []
for p in PARTS:
    fs = [f for f, a in zip(faces, assign) if a == p]
    if fs: body += [f'o {p}', 'usemtl tex_animal_lion_i033p001x', *fs]
(DST / f'{NAME}.obj').write_text('\n'.join(head + body) + '\n')
shutil.copy(SRC / 'animal_lion_i033p001x.png', DST)
(DST / f'{NAME}.mtl').write_text((SRC / 'animal_lion.mtl').read_text().replace('animal_lion\n', NAME + '\n'))
cf = lambda p: [p[0], p[1], p[2], 1, 0, 0, 0, 1, 0, 0, 0, 1]
rig = {'name': NAME, 'source': 'creatures/animal_lion cut by tools/cut_lion.py',
       'conventions': 'model space as animal_lion (+Y up, faces -X, left = +Z); pivots have identity frames: rz > 0 = nose/jaw/leg down-back, ry > 0 = turn to its left',
       'size': [11.8098, 7.1934, 5.791], 'root': 'Body',
       'bodies': [{'name': n, 'parent': par, 'joint': None if par is None else n + 'Hinge', 'pivot': cf(pv), 'rest': cf(pv), 'hasGeometry': n in assign}
                  for n, (par, pv) in PARTS.items()],
       'joints': [], 'attachments': [], 'animations': []}
(DST / 'rig.json').write_text(json.dumps(rig, indent=1))
from collections import Counter
print(NAME, dict(Counter(assign)))
