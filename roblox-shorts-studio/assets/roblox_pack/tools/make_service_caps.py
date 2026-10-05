"""Two uniform hats for the R6 pack (original, procedural), written in the pack's format (studs, +Y up, pivot at the
HatAttachment, Roblox front = -Z) with smooth vertex normals:

  officer_cap  - a general's peaked service cap: blue band, a crown that flares out to a wide flat top, a glossy black
                 visor at the front with a gold edge, a gold chin cord and a gold eagle badge over the visor.
  pillbox_hat  - an elevator operator's / bellhop's pillbox: a short red drum with gold bands, a gold top button and a
                 thin black chin strap at the back.

    python3 tools/make_service_caps.py          # from assets/roblox_pack

Fit rule: both are rigid hats ('seat' in web/lib/robloxPack.js ACCESSORY_FIT).
"""
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'accessories'
N = 64                                   # segments around


class Mesh:
    def __init__(self): self.V, self.F = [], {}

    def grid(self, obj, rows, wrap=True):
        """rows: list of point rows, stitched into quads (two triangles each); wrap closes each row into a ring."""
        base, n = len(self.V), len(rows[0])
        for r in rows: self.V.extend(r)
        tris = self.F.setdefault(obj, [])
        for i in range(len(rows) - 1):
            for j in range(n if wrap else n - 1):
                a0 = base + i * n + j; a1 = base + i * n + (j + 1) % n; b0 = a0 + n; b1 = a1 + n
                tris += [(a0, b0, a1), (a1, b0, b1)]
        return base

    def fan(self, obj, centre, ring_start, n, flip=False):
        c = len(self.V); self.V.append(centre)
        tris = self.F.setdefault(obj, [])
        for j in range(n):
            t = (c, ring_start + j, ring_start + (j + 1) % n)
            tris.append((t[0], t[2], t[1]) if flip else t)

    def box(self, obj, centre, size, rot_x=0.0):
        """A small box (badge plates, buttons), tilted about x by rot_x."""
        cx, cy, cz = centre; sx, sy, sz = (s / 2 for s in size); c, s = math.cos(rot_x), math.sin(rot_x)
        base = len(self.V)
        for x in (-sx, sx):
            for y in (-sy, sy):
                for z in (-sz, sz):
                    self.V.append((cx + x, cy + y * c - z * s, cz + y * s + z * c))
        idx = lambda x, y, z: base + x * 4 + y * 2 + z
        quads = [(idx(0, 0, 0), idx(0, 0, 1), idx(0, 1, 1), idx(0, 1, 0)), (idx(1, 0, 0), idx(1, 1, 0), idx(1, 1, 1), idx(1, 0, 1)),
                 (idx(0, 0, 0), idx(1, 0, 0), idx(1, 0, 1), idx(0, 0, 1)), (idx(0, 1, 0), idx(0, 1, 1), idx(1, 1, 1), idx(1, 1, 0)),
                 (idx(0, 0, 0), idx(0, 1, 0), idx(1, 1, 0), idx(1, 0, 0)), (idx(0, 0, 1), idx(1, 0, 1), idx(1, 1, 1), idx(0, 1, 1))]
        tris = self.F.setdefault(obj, [])
        for a, b, c2, d in quads: tris += [(a, b, c2), (a, c2, d)]

    def write(self, name, desc, mats, order):
        out = ROOT / name; out.mkdir(parents=True, exist_ok=True)
        sub = lambda p, q: (p[0] - q[0], p[1] - q[1], p[2] - q[2])
        cross = lambda u, w: (u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0])
        # smooth normals per object: vertices are never shared between objects, so each object shades on its own
        acc = [[0.0, 0.0, 0.0] for _ in self.V]
        for tris in self.F.values():
            for t in tris:
                n = cross(sub(self.V[t[1]], self.V[t[0]]), sub(self.V[t[2]], self.V[t[0]]))
                for k in t:
                    for c in range(3): acc[k][c] += n[c]
        nrm = []
        for n in acc:
            l = math.sqrt(sum(c * c for c in n)) or 1.0; nrm.append(tuple(c / l for c in n))
        mtl = [f'# Materials for {name}. Kd/Ks are sRGB. Original procedural hat (tools/make_service_caps.py).']
        for m, (c, ks, ns) in mats.items():
            mtl += [f'newmtl {m}', 'Kd %.4f %.4f %.4f' % c, 'Ks %.4f %.4f %.4f' % (ks, ks, ks), f'Ns {ns}', 'd 1.0000', 'illum 2', '']
        (out / f'{name}.mtl').write_text('\n'.join(mtl))
        lines = [f'# Roblox asset pack: {name} (accessories). {desc} Built by tools/make_service_caps.py. '
                 'Units: studs (1 stud = 1 unit). +Y up. Pivot (HatAttachment) at the origin. Front = -Z.', f'mtllib {name}.mtl', '']
        lines += ['v %.5f %.5f %.5f' % p for p in self.V] + ['vn %.5f %.5f %.5f' % n for n in nrm]
        for obj, m in order:
            lines += [f'o {obj}', f'usemtl {m}']
            lines += ['f %d//%d %d//%d %d//%d' % (t[0] + 1, t[0] + 1, t[1] + 1, t[1] + 1, t[2] + 1, t[2] + 1) for t in self.F[obj]]
        (out / f'{name}.obj').write_text('\n'.join(lines) + '\n')
        xs, ys, zs = zip(*self.V)
        print(name, len(self.V), 'verts', sum(len(t) for t in self.F.values()), 'tris',
              'x %.3f..%.3f y %.3f..%.3f z %.3f..%.3f' % (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)))


def ring(r, y, n=N, rz=None):
    rz = r if rz is None else rz
    return [(r * math.cos(2 * math.pi * j / n), y, rz * math.sin(2 * math.pi * j / n)) for j in range(n)]


# ------------------------------------------------------------------ officer_cap
m = Mesh()
# crown: a profile revolved around y (r, y); the band is straight, then it flares out to a wide, slightly domed top.
# Oval (a little deeper front to back, like a real service cap's top).
prof = [(0.66, -0.06), (0.67, 0.10), (0.68, 0.26), (0.74, 0.36), (0.86, 0.46), (0.95, 0.53), (0.97, 0.58), (0.95, 0.62), (0.80, 0.665), (0.45, 0.69), (0.0, 0.70)]
rows = [ring(r, y, rz=r * 1.06) for r, y in prof[:-1]]
b = m.grid('Crown', rows)
m.fan('Crown', (0.0, prof[-1][1], 0.0), b + (len(rows) - 1) * N, N, flip=True)
# inside: close the bottom of the band (faces down)
m.fan('Crown', (0.0, -0.06, 0.0), b, N)
# band: a darker strip just outside the crown's straight part
band = [ring(0.675, y, rz=0.675 * 1.06) for y in (-0.05, 0.25)]
band = [[(x * 1.015, y, z * 1.015) for x, y, z in r] for r in band]
band = [band[0], band[1], [(x * 0.99, y, z * 0.99) for x, y, z in band[1]]]
m.grid('Band', band)
# visor: a curved peak over the front (-Z), angled down; rows from the band outward, columns across +-70 degrees
VI = 25
def visor_pt(a, k, under=False):
    """a: angle across the front (-1..1), k: 0 at the band .. 1 at the edge."""
    th = -math.pi / 2 + a * math.radians(72)
    r0 = 0.68; reach = 0.48 * (1 - 0.55 * a * a)                    # longest at the centre, tapering to the sides
    r = r0 + reach * k
    y = -0.02 - 0.20 * k - 0.06 * k * k - (0.035 if under else 0.0)
    return (r * math.cos(th), y, r * math.sin(th) * 1.06)
cols = [i / (VI - 1) * 2 - 1 for i in range(VI)]
top = [[visor_pt(a, k) for a in cols] for k in (0.0, 0.33, 0.66, 1.0)]
under = [[visor_pt(a, k, True) for a in cols] for k in (1.0, 0.66, 0.33, 0.0)]
m.grid('Visor', top, wrap=False)
m.grid('Visor', under, wrap=False)
# the visor's gold edge: a thin strip along its outer rim
edge = [[visor_pt(a, 1.0)[0] * 1.0, visor_pt(a, 1.0)[1] + 0.012, visor_pt(a, 1.0)[2]] for a in cols]
edge2 = [[p[0] * 1.02, p[1] - 0.05, p[2] * 1.02] for p in edge]
m.grid('Gold', [[tuple(p) for p in edge], [tuple(p) for p in edge2]], wrap=False)
# chin cord: a gold strip across the front of the band, just above the visor
cord = [[(0.70 * math.cos(-math.pi / 2 + a * math.radians(70)), y, 0.70 * 1.06 * math.sin(-math.pi / 2 + a * math.radians(70))) for a in cols] for y in (0.02, 0.09)]
cord.append([(x * 0.985, y, z * 0.985) for x, y, z in cord[1]])
m.grid('Gold', cord, wrap=False)
for s in (-1, 1):                                                      # the cord's two buttons at the sides
    th = -math.pi / 2 + s * math.radians(70)
    m.box('Gold', (0.71 * math.cos(th), 0.055, 0.71 * 1.06 * math.sin(th)), (0.08, 0.08, 0.08))
# eagle badge on the front of the crown: a wide gold plate with two raised wings and a centre shield
fz = -0.88 * 1.0
m.box('Gold', (0.0, 0.38, fz + 0.02), (0.30, 0.12, 0.04), rot_x=-0.55)
m.box('Gold', (0.0, 0.42, fz + 0.0), (0.12, 0.20, 0.05), rot_x=-0.55)
for s in (-1, 1): m.box('Gold', (s * 0.14, 0.43, fz + 0.04), (0.12, 0.06, 0.04), rot_x=-0.55)
BLUE = (0.18, 0.24, 0.38); DARK = (0.08, 0.10, 0.16); BLACK = (0.03, 0.03, 0.035); GOLD = (0.95, 0.74, 0.25)
m.write('officer_cap', "Original general's peaked service cap (blue, black visor, gold cord and eagle badge).",
        {'crown': (BLUE, 0.05, 14), 'band': (DARK, 0.04, 12), 'visor': (BLACK, 0.55, 90), 'gold': (GOLD, 0.6, 60)},
        [('Crown', 'crown'), ('Band', 'band'), ('Visor', 'visor'), ('Gold', 'gold')])

# ------------------------------------------------------------------ pillbox_hat
m = Mesh()
R, H = 0.52, 0.46
rows = [ring(R * k, y) for k, y in [(1.0, -0.03), (1.0, H - 0.04), (0.97, H), (0.0, H + 0.005)]]
b = m.grid('Body', rows[:-1])
m.fan('Body', (0.0, H + 0.005, 0.0), b + 2 * N, N, flip=True)
m.fan('Body', (0.0, -0.03, 0.0), b, N)
for y0, y1 in [(-0.02, 0.06), (H - 0.12, H - 0.06)]:                 # two gold bands
    g = [ring(R * 1.02, y0), ring(R * 1.02, y1), ring(R * 1.005, y1)]
    m.grid('Gold', g)
# top button
btn = [ring(0.09, H), ring(0.09, H + 0.06), ring(0.05, H + 0.09)]
bb = m.grid('Gold', btn)
m.fan('Gold', (0.0, H + 0.095, 0.0), bb + 2 * N, N, flip=True)
# a small gold badge on the front (-Z)
m.box('Gold', (0.0, 0.22, -R - 0.015), (0.16, 0.12, 0.03))
RED = (0.72, 0.10, 0.12)
m.write('pillbox_hat', "Original elevator operator's pillbox hat (red with gold bands, top button and badge).",
        {'body': (RED, 0.06, 16), 'gold': (GOLD, 0.6, 60)}, [('Body', 'body'), ('Gold', 'gold')])
