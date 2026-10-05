"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/sfx_assets.py).
Key times mirror T in web/mia_clip.js. Effects follow the visible action: pencil on paper whenever someone draws,
the chime whenever a drawing comes to life."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(draw=W['draws1'] - 0.1, drawn=W['perfect'] - 0.25, alive=W['perfect'] + 0.05, land=W['perfect'] + 0.9, roar=W['roars'] - 0.05,
         run=W['screams'] - 0.45, cageDraw=W['draws2'] - 0.15, cage=W['cage'], cageLand=W['cage'] + 0.38, swat1=W['wobbly'] - 0.15,
         swat2=W['hold'] - 0.3, crouch=W['jumps'] - 0.55, leap=W['jumps'], out=W['out'] + 0.15, bat1=W['bats'], bat2=W['toy'] - 0.2,
         scrib=W['scribbles'] - 0.15, yarn=W['ball'], pounce=W['pounces'] - 0.2, roll=W['purrs'] - 0.25,
         dogPop=W['life'] - 0.3, throw=W['dog'] + 0.25, fetchGet=W['fetches'] - 0.45, bike0=W['bike'] - 0.25, bfShow=W['boyfriend'] - 0.35,
         leoUp=W['then'] - 0.1, grab1=W['grabs1'], leoBack=W['once'] + 0.15, no=W['no'] - 0.1, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.35: A(f'sfx/{n}.wav', t, g)
H = lambda n, t, g=0.35: A('horror/' + n, t, g)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})


def pencil(a, b, g=0.3):                                 # scratching for the whole time someone draws
    t = a
    while t < b - 0.2: S('pencil', t, g); t += 1.1


# The dog, the fetch, the bike, the boyfriend.
pencil(0.05, T['dogPop'], 0.28)
S('chime', T['dogPop'] - 0.05, 0.4); A('swish_1', T['dogPop'] + 0.05, 0.3); A('impact_3', T['dogPop'] + 0.6, 0.2)
A('swish_2', T['throw'], 0.4); A('click', T['throw'] + 0.5, 0.3)
for i in range(6): H('footstep', T['throw'] + 0.3 + i * 0.16, 0.12)
for i in range(6): H('footstep', T['fetchGet'] + 0.2 + i * 0.16, 0.12)
S('chime', T['bike0'] - 0.15, 0.3)
S('bonk', W['bonk1'], 0.7); S('bonk', W['bonk2'], 0.7)
S('chime', T['bfShow'] - 0.05, 0.3); TN([880, 1175], W['supportive'], 0.04, 0.12)
# Leo takes the pencil and draws the lion.
A('swish_3', T['grab1'], 0.35)
pencil(T['draw'], T['drawn'], 0.32)
S('chime', T['alive'], 0.45); A('swish_4', T['alive'] + 0.2, 0.3)
S('thud', T['land'], 0.45); S('roar', T['roar'], 0.7); S('flutter', T['roar'] + 0.15, 0.3)   # the papers fly
for i in range(14): H('footstep', T['run'] + i * 0.13, 0.16)
# The cage.
pencil(T['cageDraw'], T['cage'], 0.32)
S('chime', T['cage'] - 0.05, 0.35); A('swish_2', T['cage'] + 0.05, 0.3); S('clang', T['cageLand'], 0.55)
S('clang', T['swat1'] + 0.1, 0.3); S('clang', T['swat2'] + 0.1, 0.3)
S('roar', T['crouch'] - 0.1, 0.25); S('whoosh', T['leap'], 0.5); S('thud', T['out'], 0.6); A('impact_4', T['out'], 0.35)
# The boyfriend steps in: bop, bop.
A('impact_1', T['bat1'] + 0.1, 0.4); A('swish_4', T['bat1'] + 0.15, 0.3)
A('impact_2', T['bat2'] + 0.1, 0.4); A('swish_4', T['bat2'] + 0.15, 0.3)
# Yarn and the purr.
pencil(T['scrib'], T['yarn'], 0.35)
S('chime', T['yarn'] - 0.05, 0.4); A('impact_3', T['yarn'] + 0.38, 0.2)
A('swish_1', T['pounce'], 0.35)
S('purr', T['roll'] + 0.3, 0.5); S('purr', T['roll'] + 2.1, 0.35)
# Leo's back; "No."
for i in range(10): H('footstep', T['leoBack'] + 0.3 + i * 0.16, 0.12)
A('drum_hit', T['no'] + 0.15, 0.25)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
