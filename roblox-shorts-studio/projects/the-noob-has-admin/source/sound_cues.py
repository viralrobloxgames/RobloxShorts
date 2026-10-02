"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def typing(a, b, g=0.12, step=0.06):
    t = a
    while t < b: A('click', t, g); t += step
wake = W['moved'] - 0.15
T([392, 494], 0.1, 0.06, 0.3); T(160, 1.0, 0.06, 1.5, sweep=-20, square=True)                      # sleepy hum
A('drum_hit', wake, 0.4); T([784, 988, 1175, 1568], wake + 0.05, 0.16, 0.12); T([2093, 2637], wake + 0.2, 0.06, 0.2)   # wakes up
A('click', wake + 0.6, 0.2); A('click', wake + 0.75, 0.2)                                          # knuckle cracks
typing(W['kick'] - 0.35, W['fling'], 0.08, 0.11)                                                   # Leo, slow
for at in [W['fling'], W['tiny'] + 0.3, W['fire'], W['speed']]:
    typing(at - 0.5, at - 0.06); A('click', at, 0.3)                                               # the noob, fast
A('swish_4', W['fling'] + 0.1, 0.5); T(500, W['fling'] + 0.1, 0.12, 1.4, sweep=900); A('impact_3', W['fling'] + 0.12, 0.4)
typing(W['giant'] - 0.7, W['giant'] - 0.02, 0.1, 0.09); T(110, W['giant'] + 0.05, 0.2, 1.0, sweep=200, square=True)
T(900, W['tiny'] + 0.35, 0.14, 0.45, sweep=-700); A('swish_2', W['tiny'] + 0.35, 0.3); T([2093, 2637], W['tiny'] + 0.75, 0.06, 0.12)
typing(W['invisible'] - 0.9, W['invisible'] - 0.25, 0.1, 0.09)
for i in range(6): T([1600 if i % 2 else 1200], W['invisible'] - 0.2 + i * 0.06, 0.04, 0.05)
A('impact_1', W['fire'] + 0.1, 0.35); T(300, W['fire'] + 0.1, 0.1, 1.6, sweep=-100, square=True)
for i in range(14): A('swish_1', W['fire'] + 0.3 + i * 0.2, 0.06)
T(1400, W['ran'] + 0.1, 0.07, 0.9, sweep=500)
for k, at in enumerate([W['freeze'], W['spin'], W['sit'], W['dance']]):
    typing(at - 0.3, at - 0.04, 0.12, 0.045); A('impact_2', at, 0.45); A('drum_hit', at, 0.3); T([523 * 2 ** (k / 4)], at + 0.02, 0.12, 0.15, square=True)
T(2200, W['freeze'] + 0.02, 0.06, 0.3, sweep=-1200)
for i in range(6): T([392, 494, 587, 494][i % 4], W['dance'] + 0.2 + i * 0.25, 0.05, 0.1, square=True)
for i in range(16): A('click', W['charged'] + 0.1 + i * 0.16, 0.07)
A('swish_3', W['speed'] + 0.05, 0.45); T(300, W['speed'] + 0.05, 0.12, 0.4, sweep=1200)
A('impact_4', W['intoEach'] + 0.05, 0.65); A('drum_hit', W['intoEach'] + 0.05, 0.5); T([2349, 2793, 3136], W['intoEach'] + 0.25, 0.06, 0.5)   # BONK
T([523, 494, 466], W['andMia'] - 0.1, 0.06, 0.25)
A('drum_hit', W['ten'], 0.4); T(140, W['ten'] + 0.05, 0.18, 0.4, square=True)
for i in range(6): A('click', W['walked'] + i * 0.3, 0.08)
T([1046], W['poked'], 0.12, 0.06)
T(400, W['fell'], 0.06, 0.5, sweep=-150); A('impact_4', W['fell'] + 0.55, 0.6); A('impact_2', W['fell'] + 0.57, 0.4)   # THUD
A('click', W['gg'] - 0.85, 0.15); A('click', W['gg'] - 0.6, 0.15); A('click', W['gg'] - 0.15, 0.3)
T([392, 330, 262], W['gg'] + 0.15, 0.1, 0.5)
T([1568], W['popped'] - 0.1, 0.1, 0.08); T(220, W['popped'] + 0.3, 0.12, 0.4, square=True)
A('impact_4', W['alt'], 0.6); A('drum_hit', W['alt'], 0.55); T(98, W['alt'] + 0.02, 0.25, 0.6, square=True)   # ALT ACCOUNT
A('swish_2', W['partThree'] - 0.3, 0.3); A('swish_1', W['didnt'] - 0.1, 0.3); T([523, 659, 784], W['didnt'], 0.1, 0.2)
A('swish_3', W['follow'] - 0.05, 0.35); T([1047, 1319, 1568], W['follow'], 0.12, 0.18)
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
