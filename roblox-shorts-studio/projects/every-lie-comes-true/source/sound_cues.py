"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/sfx_assets.py).
Key times mirror T in web/lie_clip.js. Effects are caused by visible action; the chime marks every lie coming true."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(cold=W['so1'] - 0.12, true1=W['ate'] + 0.45, boom=W['explodes'] - 0.04, hw=W['homework2'] - 0.05, dsk=W['desk'] + 0.05,
         true2=W['school'] + 0.45, zoom=W['now1'] - 0.1, true3=W['dollars1'] + 0.35, true4=W['cool'] + 0.3, crash=W['tree'] - 0.02,
         forget=W['stops'] - 0.2, remember=W['now3'] - 0.12, land=W['lands'] + 0.05, give=W['dollars2'] + 0.15, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.35: A(f'sfx/{n}.wav', t, g)
H = lambda n, t, g=0.35: A('horror/' + n, t, g)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})

# Cold open: the dragon chewing the desk, then the rewind.
S('chomp', 0.05, 0.45); S('chomp', 0.75, 0.35); S('roar', 0.2, 0.18)
S('rewind', T['cold'] - 0.42, 0.35)
# Classroom.
S('chime', T['true1'] - 0.05, 0.4)
S('roar', T['boom'] - 0.35, 0.3)                                 # approaching
S('glass', T['boom'], 0.6); A('impact_2', T['boom'], 0.5); A('impact_4', T['boom'] + 0.04, 0.4)
S('roar', T['boom'] + 0.1, 0.55)
S('chomp', T['hw'] - 0.02, 0.6); S('chomp', T['hw'] + 0.25, 0.3)
A('swish_3', T['dsk'] - 0.5, 0.3); S('chomp', T['dsk'] - 0.02, 0.7); A('impact_3', T['dsk'], 0.35)
for i in range(3): S('chomp', T['dsk'] + 0.4 + i * 0.3, 0.25)
# Track, cash, Mia.
S('chime', T['true2'] - 0.05, 0.4); S('whoosh', T['zoom'], 0.6); A('swish_4', T['zoom'] + 0.05, 0.35)
S('chime', T['true3'] - 0.15, 0.4); S('flutter', T['true3'], 0.5); TN([1319, 1760], T['true3'] + 0.1, 0.05, 0.1)
S('chime', T['true4'] - 0.05, 0.4); TN([880, 1109, 1319], W['waves'], 0.04, 0.14)
# The ride and the crash.
ride0 = T['crash'] - 49.65 / 17
for i in range(int((T['crash'] - ride0) / 0.45)): H('footstep', ride0 + i * 0.45, 0.12)       # pedal clicks
TN([1568, 2093], ride0 + 0.2, 0.05, 0.08)                                                 # bike bell
S('clang', T['crash'], 0.6); A('impact_1', T['crash'] + 0.12, 0.5); H('leaves_step', T['crash'] + 0.2, 0.45)
A('impact_3', T['crash'] + 0.9, 0.25)                                                     # flops down
for i in range(5): H('footstep', T['crash'] + 0.4 + i * 0.17, 0.3)                       # Max runs over
# The talk.
S('chime', T['forget'] - 0.05, 0.4); TN([440, 330], T['forget'] + 0.3, 0.05, 0.25, square=True)   # tag glitch
S('chime', T['remember'] - 0.05, 0.4)
S('roar', T['land'] - 1.4, 0.15); A('swish_2', T['land'] - 0.5, 0.4); S('thud', T['land'], 0.6); A('impact_4', T['land'], 0.5)
S('roar', T['land'] + 0.45, 0.25)
A('click', W['shuts'] + 0.05, 0.4)                                                        # mouth snaps shut
A('drum_hit', W['iDid'], 0.25)
H('desk_bell', T['give'] + 0.3, 0.25); S('flutter', T['give'] + 0.25, 0.12)
TN([523, 659, 784, 1047], W['record'], 0.06, 0.14)                                        # new record
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
