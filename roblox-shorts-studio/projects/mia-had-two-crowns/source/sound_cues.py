"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
# The duel's blasts and punches come from web/duel.js itself, so the sounds land exactly on the picture.
E = json.loads(subprocess.run(['node', '-e', "import('./web/duel.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def typing(a, b, g=0.12, step=0.07):
    t = a
    while t < b: A('click', t, g); t += step
A('impact_4', 0.12, 0.6); A('drum_hit', 0.12, 0.5); T([784, 988, 1175, 1568], 0.14, 0.16, 0.12)              # crown slams on Mia
A('swish_4', W['twice'] - 0.45, 0.4)                                                                            # whip pan
A('impact_4', W['twice'], 0.6); A('drum_hit', W['twice'], 0.5); T([988, 1175, 1568, 1976], W['twice'] + 0.02, 0.16, 0.14)   # ...and on the noob: x2
A('swish_3', W['twice'] + 0.85, 0.35)                                                                           # crash zoom out
for i in range(16): T([1400 if i % 2 else 1100], W['twice'] + 1.0 + i * 0.5, 0.035, 0.05)                        # clock ticking
T([523, 659], W['alt'] - 0.2, 0.08, 0.3); T(600, W['alt'], 0.06, 0.45, sweep=500)                              # SAME PLAYER
A('impact_1', W['teamed'] + 0.05, 0.45); T([523, 659, 784], W['teamed'] + 0.1, 0.12, 0.2, square=True)                                      # fist bump
typing(W['fling'] - 0.95, W['fling'] - 0.05); A('click', W['fling'], 0.3)
A('swish_4', W['fling'] + 0.15, 0.5); T(500, W['fling'] + 0.15, 0.12, 1.4, sweep=900); A('impact_3', W['fling'] + 0.17, 0.4)
T([523, 494, 466], W['noticed'], 0.06, 0.25)
T(180, W['froze'], 0.1, 0.25, square=True)                                                                                               # freeze-frame thunk
for i in range(5): A('click', W['noticed'] + 0.6 + i * 0.28, 0.08)
T([1046], W['poked'], 0.12, 0.06); T(400, W['poked'] + 0.05, 0.06, 0.5, sweep=-150); A('impact_4', W['poked'] + 0.55, 0.6); A('impact_2', W['poked'] + 0.57, 0.4)   # plank
A('drum_hit', W['onlyPlay'], 0.35); T([392, 523], W['onlyPlay'] + 0.05, 0.08, 0.3)
for i in range(14): A('click', W['attacked'] + i * 0.15, 0.07)                                                                          # charging
# Every account switch: a key-chord click + a short blip that rises as the switches speed up.
for k, at in enumerate([W['sw1'], W['sw2'], W['sw3']]): A('click', at, 0.35); A('click', at + 0.04, 0.3); T([700 + 80 * k], at, 0.1, 0.06, square=True)
t, gap, k = W['faster'] - 0.15, 0.42, 3
while t < W['freeze'] - 0.75: A('click', t, 0.3); T([700 + 60 * k], t, 0.08, 0.05, square=True); t += gap; gap = max(0.11, gap * 0.8); k += 1
for side in ('max', 'leo'):
    for t in E['blasts'][side]: A('impact_3', t, 0.4); A('swish_2', t + 0.02, 0.3); T(900, t, 0.08, 0.25, sweep=-600)        # POW: blasted back
    for t in E['hits'][side]: A('impact_1', t + 0.05, 0.16); T([330], t + 0.05, 0.05, 0.05, square=True)                 # punches on the frozen account
typing(W['freeze'] - 0.6, W['justFreeze'] + 0.25, 0.14, 0.09)
T([330, 262], W['wrong'], 0.12, 0.35, square=True)
T(2200, W['herself'], 0.08, 0.4, sweep=-1300); A('impact_1', W['herself'] + 0.3, 0.4); T([2637, 3136], W['herself'] + 0.3, 0.06, 0.2)  # ice
A('drum_hit', W['ten'], 0.4); T(140, W['ten'] + 0.05, 0.18, 0.4, square=True)
typing(W['meant'] - 0.2, W['typo'] + 0.6, 0.12, 0.08)
T([220, 208], W['typo'] + 0.1, 0.12, 0.4, square=True)                                                                                  # uh oh
for i, at in enumerate([W['newCrowns'] - 0.5, W['newCrowns'] - 0.35]): A('swish_1', at, 0.2); T([784 + i * 200, 1175 + i * 200], at + 0.5, 0.1, 0.1)
T([784, 988, 1175, 1568], W['newCrowns'] + 0.1, 0.14, 0.12)
T([392, 330], W['lasted'] + 0.2, 0.08, 0.3)
typing(W['kickMax'] - 0.1, W['enter'] - 0.05, 0.14, 0.06)
A('click', W['enter'], 0.5); A('click', W['enter'] + 0.02, 0.5)
A('impact_4', W['kicked'], 0.6); A('drum_hit', W['kicked'], 0.5); T(98, W['kicked'] + 0.02, 0.22, 0.5, square=True)
A('impact_2', W['roundOver'], 0.4); T([392, 330, 262], W['roundOver'] + 0.05, 0.1, 0.5)
T([784, 988, 1175, 1568], W['wins'], 0.16, 0.18)
for i in range(6): T([392, 494, 587, 494][i % 4], W['kicked'] + 0.5 + i * 0.25, 0.05, 0.1, square=True)                                # noob's victory dance
T([1568, 1976], W['joined'] - 0.1, 0.12, 0.15); A('swish_2', W['joined'] - 0.1, 0.3); T([1047, 1319, 1568, 2093], W['joined'] + 0.2, 0.1, 0.2)   # Skye joins
A('swish_3', W['follow'] - 0.05, 0.35); T([1047, 1319, 1568], W['follow'], 0.12, 0.18)
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
