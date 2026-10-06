"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/penguin_clip.js. Effects: heel-click thuds on every salute and soft steps as the guards march,
a chime (with a rising tone) on each rank card, whooshes on the cuts between scenes, a flutter as the penguin is adopted,
a fanfare and two sword clangs for the knighting, drum hits under the 130 soldiers, squeaks for the waddle and a splash
for the dive. No noise-based effects (no applause or crowd: they crackle). SFX copied from Cliff Young, Every Lie Comes
True, Copy the Crown, He Sold The Eiffel Tower and Over The Falls In A Barrel."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(close=W['outranks'] - 0.2, y1972=W['started'] - 0.15, name=W['name1'] - 0.15, visits=W['every'] - 0.15, change=W['penguins'] - 0.15,
         knight=W['king'] - 0.15, march=W['hundred'] - 0.15, citation=W['citation'] - 0.15, statue=W['bronze'] - 0.35,
         brigadier=W['brigadier'] - 0.2, general=W['twentythree'] - 0.25, trained=W['trained'] - 0.15, dive=W['past'] + 0.1, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('squeak', W['inspects'] + 0.1, 0.18)
S('thud', W['salute1'] - 0.1, 0.35)                                          # the line salutes
S('chime', T['close'] + 0.1, 0.28); TN([1319], T['close'] + 0.15, 0.04, 0.15)   # MAJOR GENERAL card
for k in ['y1972', 'visits', 'change', 'knight', 'march', 'statue', 'dive', 'cta']: S('whoosh', T[k] - 0.05, 0.2)
for i in range(4): S('thud', W['norways'] - 0.1 + 0.2 + i * 0.4, 0.12)      # the 1972 guards march in (1.6 s at 5 units/s)
S('flutter', W['adopts'], 0.25)                                               # the penguin flaps: adopted
S('pop', W['nils'] - 0.2, 0.3)                                                # NILS OLAV
S('thud', W['lance'] - 0.1, 0.3)                                              # the salute
for k, f in [('lance', 523), ('corporal2', 587), ('sergeant1', 659), ('regimental', 784)]:
    S('chime', W[k] - 0.1, 0.25); TN([f], W[k] - 0.05, 0.04, 0.15)           # each promotion climbs a step
S('pop', T['change'] + 0.1, 0.25); S('pop', W['lookalike'] - 0.3, 0.25)       # NILS OLAV I / II
S('fanfare', W['king'] + 0.1, 0.3)
for t0 in (W['king'] + 0.2, W['knight'] - 0.1): S('clang', t0 + 0.17, 0.25)   # the sword touches each shoulder
S('chime', W['knight'] - 0.1, 0.25)                                           # SIR NILS OLAV card
A('drum_hit', W['hundred'] - 0.1, 0.3)
for i in range(int((T['citation'] - T['march']) / 0.5)): S('thud', T['march'] + 0.25 + i * 0.5, 0.12)   # 130 soldiers march in
S('pop', W['qualified'] - 0.2, 0.25)
S('chime', W['statue'] - 0.2, 0.25)
S('chime', W['brigadier'] - 0.1, 0.25); TN([880], W['brigadier'] - 0.05, 0.04, 0.15)
S('pop', T['general'] + 0.1, 0.2)                                             # the 2023 tag
S('fanfare', W['general'] - 0.15, 0.3)                                        # MAJOR GENERAL
S('thud', W['salute2'] - 0.1, 0.35)                                           # they still have to salute him
for i in range(3): S('squeak', W['waddles'] + i * 0.35, 0.18)
S('splash', T['dive'] + 0.45, 0.35)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
