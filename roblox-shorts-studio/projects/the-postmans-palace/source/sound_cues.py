"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/palace_clip.js: a bonk and a whoosh for the stumble, a pop as the stone goes in his pocket,
a chime for the dream, footsteps and stone clacks on the round, the wheelbarrow rumbling, crickets at night with the
village laughing, ticking years and thuds as the palace rises, a fanfare when it's finished, a bonk for the law, coins
at the souvenir stand. SFX: source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(pocket=W['kick'] - 0.1, dream=W['reminds'] - 0.15, round=W['so1'] - 0.1, pockets=W['first'] - 0.1, baskets=W['baskets'] - 0.25, barrow=W['brings'] - 0.15,
         night=W['night'] - 0.1, laugh=W['whole'] - 0.1, keeps=W['keeps'] - 0.1, walls=W['twenty'] - 0.1, deco=W['animals'] - 0.1, done=W['later'] - 0.1,
         carved=W['writes'] - 0.1, law=W['asks'] - 0.1, tomb=W['so2'] - 0.1, today=W['today'] - 0.1, famous=W['village2'] - 0.1, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
has = lambda n: (P / 'audio/sfx' / f'{n}.wav').is_file()
# the stumble and the stone
S('bonk' if has('bonk') else 'thud', 0.0, 0.4); A('swish_2', 0.05, 0.3); A('drum_hit', 0.0, 0.25)
S('pop', W['puts'] - 0.05, 0.4); TN([1047, 1568], W['puts'], 0.05, 0.12)
S('chime', T['dream'] + 0.05, 0.35); TN([784, 988, 1175, 1568], W['palace1'] - 0.05, 0.04, 0.16)
# the round: footsteps, stones clacking into pockets and the basket, the barrow rumbling
k = T['round']
while k < T['night'] - 0.1:
    if not (T['barrow'] <= k): S('footstep', k, 0.12)
    k += 0.42
for t0 in (W['pockets'], W['pockets'] + 0.25, W['baskets'] + 0.1, W['baskets'] + 0.4): A('click', t0, 0.25)
S('hangar_roll', T['barrow'] + 0.1, 0.18, dur=T['night'] - T['barrow']); S('pop', W['wheelbarrow'] - 0.1, 0.2)
# night: crickets, the lamp, laughter
S('crickets' if has('crickets') else 'night_bed', T['night'], 0.18, dur=T['walls'] - T['night'] + 0.1)
for d in (0.4, 0.9): A('click', T['night'] + d, 0.2)
S('applause', W['laughs'] - 0.15, 0.12, dur=1.2); A('impact_1', W['laughs'] - 0.1, 0.2)
S('thud', W['keeps'] + 0.1, 0.25)
# the years: ticks and thuds as it rises
k = T['walls']
while k < T['done'] - 0.1: A('click', k, 0.1); k += 0.12
for t0 in (W['outer'], W['animals'], W['giants'], W['towers']): S('thud', t0 - 0.05, 0.35); S('pop', t0 - 0.05, 0.2)
S('whoosh', T['walls'], 0.25); S('whoosh', T['deco'], 0.25)
# finished
S('fanfare', T['done'] + 0.05, 0.42); A('drum_hit', W['ten'] - 0.1, 0.3); A('drum_hit', W['hours'] - 0.5, 0.3)
A('swish_3', T['carved'], 0.25); TN([523, 659, 784], W['better'] - 0.05, 0.04, 0.14)
# the law, the tomb
S('bonk' if has('bonk') else 'thud', W['no'] - 0.05, 0.35); S('pop', W['law'] - 0.15, 0.25)
k = T['tomb'] + 0.2
while k < T['today'] - 0.2: S('thud', k, 0.12); k += 0.45
A('drum_hit', W['eight'] - 0.1, 0.3)
# today
S('chime', T['today'] + 0.05, 0.35); S('applause', W['protected'] - 0.1, 0.18, dur=2.0)
S('coins' if has('coins') else 'chime', W['famous'] - 0.1, 0.35)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
