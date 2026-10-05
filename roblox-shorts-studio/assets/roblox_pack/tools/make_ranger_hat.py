"""Park ranger campaign hat for the R6 pack (original, procedural): a wide flat brim, a tall crown with the four-dent
"Montana pinch" peak, and a dark band. Written as accessories/ranger_hat/ranger_hat.obj + .mtl in the pack's
format (studs, +Y up, pivot at the HatAttachment, Roblox front = -Z) with smooth vertex normals.

    python3 tools/make_ranger_hat.py            # from assets/roblox_pack
    python3 tools/make_ranger_hat.py --burnt    # the scorched museum copy (accessories/ranger_hat_burnt/)

Fit rule: ranger_hat is a rigid hat ('seat' in web/lib/robloxPack.js ACCESSORY_FIT).
"""
import argparse
import math
from pathlib import Path

ap = argparse.ArgumentParser(); ap.add_argument('--burnt', action='store_true'); a = ap.parse_args()
NAME = 'ranger_hat_burnt' if a.burnt else 'ranger_hat'
OUT = Path(__file__).resolve().parent.parent / 'accessories' / NAME
N = 64                                   # segments around

def smoothstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)

def crown(th, v):
    """Crown surface: v 0 (base) .. 1 (peak). Straight sides that taper, then four dents pinch the top to a peak."""
    dent = math.cos(2 * (th - math.pi / 4)) ** 2           # 1 at 45/135/225/315 degrees (the four dents), 0 between
    if v < 0.62:
        k = v / 0.62; r = 0.70 - 0.10 * k; y = 0.60 * k
    else:
        k = (v - 0.62) / 0.38; r = 0.60 * (1 - k) ** 1.15; y = 0.60 + 0.20 * math.sin(k * math.pi / 2)
    p = smoothstep(0.35, 1.0, v)
    r *= 1 - 0.26 * p * dent                               # the dents pull in ...
    y -= 0.10 * p * dent * (1 if v < 0.99 else 0)          # ... and down; the very peak stays up
    return r * math.cos(th), y, r * math.sin(th)

V, F, NRM = [], {}, []
def add_grid(obj, rows):
    """rows: list of rings (each a list of N (x,y,z)); stitched into quads (as two triangles), wrapping around."""
    base = len(V)
    for ring in rows: V.extend(ring)
    tris = F.setdefault(obj, [])
    for i in range(len(rows) - 1):
        for j in range(N):
            a0 = base + i * N + j; a1 = base + i * N + (j + 1) % N; b0 = a0 + N; b1 = a1 + N
            tris += [(a0, b0, a1), (a1, b0, b1)]

def ring(r, y): return [(r * math.cos(2 * math.pi * j / N), y, r * math.sin(2 * math.pi * j / N)) for j in range(N)]

# brim: flat disc with a rounded edge, 0.07 thick, radius 1.22; a slight droop at the front and back
def droop(x, z): return -0.05 * (z / 1.22) ** 2
brim = []
for r, dy in [(0.66, -0.035), (1.16, -0.035), (1.22, 0.0), (1.16, 0.035), (0.66, 0.035)]:   # under side first: faces out
    brim.append([(x, y + dy + droop(x, z), z) for x, y, z in ring(r, 0.0)])
b0 = len(V); add_grid('Brim', brim)
# close the brim's inner hole under the crown (a flat cap at the bottom, facing down)
cb = len(V); V.append((0.0, -0.035, 0.0))
F['Brim'] += [(cb, b0 + j, b0 + (j + 1) % N) for j in range(N)]

# crown
rows = [[crown(2 * math.pi * j / N, i / 24) for j in range(N)] for i in range(25)]
add_grid('Crown', rows)
# band: a short ring just outside the crown base
band = [[(x * 1.03, y, z * 1.03) for x, y, z in ring(0.70 - 0.10 * (yy / 0.6), yy)] for yy in (0.02, 0.17)]
band = [band[0], band[1], [(x * 0.985, y, z * 0.985) for x, y, z in band[1]]]
add_grid('Band', band)

# smooth normals per object (area-weighted face normals, shared within an object)
def sub(p, q): return (p[0] - q[0], p[1] - q[1], p[2] - q[2])
def cross(u, w): return (u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0])
acc = [[0.0, 0.0, 0.0] for _ in V]
for tris in F.values():
    for t in tris:
        n = cross(sub(V[t[1]], V[t[0]]), sub(V[t[2]], V[t[0]]))
        for k in t:
            for c in range(3): acc[k][c] += n[c]
for n in acc:
    l = math.sqrt(sum(c * c for c in n)) or 1.0; NRM.append(tuple(c / l for c in n))

TAN = (0.66, 0.53, 0.33); BAND = (0.24, 0.16, 0.10)
if a.burnt: TAN = (0.36, 0.29, 0.20); BAND = (0.10, 0.08, 0.07)
OUT.mkdir(parents=True, exist_ok=True)
mtl = [f'# Materials for {NAME}. Kd/Ks are sRGB. Original procedural hat (tools/make_ranger_hat.py).']
for m, c in [('brim', TAN), ('crown', TAN), ('band', BAND)]:
    mtl += [f'newmtl {m}', 'Kd %.4f %.4f %.4f' % c, 'Ks 0.0300 0.0300 0.0300', 'Ns 12', 'd 1.0000', 'illum 2', '']
(OUT / f'{NAME}.mtl').write_text('\n'.join(mtl))
lines = [f'# Roblox asset pack: {NAME} (accessories). Original park ranger campaign hat built by tools/make_ranger_hat.py. '
         'Units: studs (1 stud = 1 unit). +Y up. Pivot (HatAttachment) at the origin.', f'mtllib {NAME}.mtl', '']
lines += ['v %.5f %.5f %.5f' % p for p in V] + ['vn %.5f %.5f %.5f' % n for n in NRM]
for obj, m in [('Brim', 'brim'), ('Crown', 'crown'), ('Band', 'band')]:
    lines += [f'o {obj}', f'usemtl {m}']
    lines += ['f %d//%d %d//%d %d//%d' % (t[0] + 1, t[0] + 1, t[1] + 1, t[1] + 1, t[2] + 1, t[2] + 1) for t in F[obj]]
(OUT / f'{NAME}.obj').write_text('\n'.join(lines) + '\n')
xs, ys, zs = zip(*V)
print(NAME, len(V), 'verts', sum(len(t) for t in F.values()), 'tris', 'x %.3f..%.3f y %.3f..%.3f z %.3f..%.3f' % (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)))
