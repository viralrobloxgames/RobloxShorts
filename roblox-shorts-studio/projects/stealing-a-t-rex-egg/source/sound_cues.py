"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/egg_clip.js; change both together."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def roar(t, g=0.5, d=1.0):           # low growl swept down, square rumble underneath
    T(240, t, g * 0.3, d, sweep=-90, square=True); T(130, t + 0.02, g * 0.4, d * 1.1, sweep=-40, square=True); A('horror/reveal_hit', t, g * 0.8)
def stomp(t, g=0.45): A('impact_4', t, g); T(60, t, 0.14, 0.25, square=True)
def bonk(t): A('impact_3', t, 0.6); A('drum_hit', t, 0.5); T([1568, 2093], t + 0.02, 0.1, 0.08); A('swish_4', t + 0.05, 0.5); T(500, t + 0.05, 0.1, 1.0, sweep=700)
def steps(a, b, every, g=0.4):
    t = a
    while t < b: stomp(t, g); t += every
def tiptoe(a, b):
    t = a
    while t < b: A('click', t, 0.06); t += 0.32

B = dict(grab=W['grabbed'] - 0.2, wake=W['woke'] - 0.25, roar=W['woke'] + 0.45, run1=W['problem'] - 0.05, bonk1=W['bonk1'], maxGrab=W['tried'],
         bonk2=W['bonk2'], bush=W['three'] - 0.4, chomp=W['ate'] + 0.05, bonkBush=W['bush2'] + 0.45, trapRun=W['stepped'] - 1.3, snap=W['stepped'],
         bonkTrap=W['stepped'] + 0.65, bump=W['teamwork'] + 0.15, plan=W['teamwork'] + 0.45, decoy=W['waving'] - 0.35, circle=W['chased'] - 0.35,
         grab2=W['grabbed2'] - 0.1, turn=W['turned'] - 0.1, jump=W['jumped'] - 0.1, whip=W['tail'] - 0.05, bonk3=W['bonk3'], cross=W['safe2'],
         wall=W['follow1'] - 0.15, place=W['hatched'] - 0.7, hatch=W['hatched'], high5=W['dollar'] + 0.2, mia=W['saw'] - 0.2, empty=W['took'] - 0.15,
         hatch12=W['hatched2'], hear=W['turns'] - 0.2, through=W['moms'], grabMia=W['mia2'] - 0.25, end=W['now'] - 0.15, cta=W['follow'])

# Asleep: snoring under the opening, Leo tiptoeing in, the grab.
for i in range(3): T(110, 0.4 + i * 1.6, 0.06, 0.8, sweep=40, square=True); T(160, 1.2 + i * 1.6, 0.04, 0.5, sweep=-60)
tiptoe(0.3, B['grab'] - 0.1)
A('click', B['grab'], 0.3); T([1319, 1568], B['grab'] + 0.05, 0.08, 0.12)
# Wakes, roars, chases, BONK 1.
T([523, 392], W['woke'] - 0.1, 0.1, 0.3); roar(B['roar'], 0.55, 1.2)
steps(B['run1'] + 0.3, B['bonk1'] - 0.3, 0.42); bonk(B['bonk1'])
A('impact_1', B['bonk1'] + 1.1, 0.35)                                                    # Leo lands
# Max laughs, tries, BONK 2 (higher, a long whistle up).
for i in range(6): T([392, 330][i % 2], W['laughed'] + 0.1 + i * 0.13, 0.05, 0.08, square=True)
A('swish_2', W['laughed'] + 0.55, 0.3); A('click', B['maxGrab'], 0.3); steps(B['maxGrab'] + 0.1, B['bonk2'] - 0.3, 0.38)
bonk(B['bonk2']); T(600, B['bonk2'] + 0.1, 0.1, 1.6, sweep=900)
# Try 3: the bush shuffles in, CHOMP, BONK.
for i in range(6): A('swish_1', B['bush'] + 0.2 + i * 0.4, 0.12)
T(180, B['chomp'] - 0.2, 0.12, 0.25, sweep=-80, square=True); A('impact_2', B['chomp'], 0.55); T([1047, 784], B['chomp'] + 0.05, 0.08, 0.1)
bonk(B['bonkBush'])
# Try 7: the bear trap SNAP on Max, BONK.
steps(B['trapRun'] + 0.2, B['snap'], 0.4, 0.3)
A('impact_3', B['snap'], 0.5); T(2400, B['snap'], 0.1, 0.12, sweep=-2000); T([330, 262], B['snap'] + 0.15, 0.1, 0.3, square=True)
bonk(B['bonkTrap'])
# Teamwork: dazed tweets, fist bump, the plan card.
for i in range(4): T([2093, 2637][i % 2], W['something'] - 0.2 + i * 0.22, 0.04, 0.07)
A('impact_1', B['bump'], 0.4); T([523, 659, 784], B['bump'] + 0.05, 0.1, 0.12, square=True)
A('swish_3', B['plan'], 0.3); T([784, 1047], B['plan'] + 0.1, 0.08, 0.12)
# The decoy: Max's dance beeps, the roar, the chase in circles.
for i in range(8): T([523, 659, 784, 659][i % 4], B['decoy'] + 0.6 + i * 0.22, 0.05, 0.1, square=True)
roar(W['dancing'], 0.4, 0.8)
steps(B['circle'] + 0.2, B['turn'], 0.4, 0.35)
# Leo grabs it; the T-rex turns (tension sting); Max on the tail; BONK 3 (highest).
A('click', B['grab2'], 0.3); T([1319, 1568], B['grab2'] + 0.05, 0.08, 0.12)
T(220, B['turn'], 0.1, 0.9, sweep=180, square=True); T([440, 466], B['turn'] + 0.2, 0.06, 0.4)
A('swish_2', B['jump'], 0.35); A('impact_1', B['jump'] + 0.45, 0.3); roar(B['whip'], 0.45, 0.6); A('swish_4', B['whip'] + 0.1, 0.4)
bonk(B['bonk3']); T(650, B['bonk3'] + 0.1, 0.1, 2.2, sweep=1100)
steps(B['bonk3'] + 0.5, B['wall'] - 0.2, 0.36, 0.45)
# Safe: the chime as Leo crosses, the T-rex smacks the wall.
T([784, 988, 1175, 1568], B['cross'], 0.14, 0.14)
A('impact_4', B['wall'], 0.6); A('impact_2', B['wall'] + 0.03, 0.4); T([1568, 1175], B['wall'] + 0.02, 0.08, 0.3); T(90, B['wall'], 0.14, 0.4, square=True)
# The hatch: wobble, crack, pop, money ping; high five.
for i in range(5): A('click', B['hatch'] - 0.5 + i * 0.1, 0.12)
A('impact_2', B['hatch'], 0.4); T([1047, 1319, 1568, 2093], B['hatch'] + 0.05, 0.12, 0.1); T([1568, 2093], W['dollar'], 0.08, 0.12)
A('impact_1', B['high5'] + 0.1, 0.45); T([659, 784], B['high5'] + 0.12, 0.08, 0.12, square=True)
# Mia's base: a cash-register run; the empty nest sting.
for i in range(10): T([1568, 2093][i % 2], W['mias'] + i * 0.12, 0.05, 0.06)
A('drum_hit', W['twelve'], 0.4); T([392, 330, 262], B['empty'], 0.1, 0.3)
# Twelve hatch at once, the babies cry, Mom hears.
for i in range(12): A('click', B['hatch12'] - 0.4 + i * 0.03, 0.1)
A('impact_2', B['hatch12'], 0.5); A('impact_4', B['hatch12'] + 0.02, 0.35)
for i in range(14): T(900 + (i % 5) * 90, W['cried'] - 0.2 + i * 0.12, 0.05, 0.18, sweep=-500)
roar(B['hear'] + 0.2, 0.5, 1.1)
# Mom walks through the safe zone (a buzz that doesn't stop her), takes the babies and Mia.
steps(B['hear'] + 0.6, B['grabMia'] - 0.3, 0.45, 0.45)
T([330, 349], B['through'], 0.1, 0.5, square=True); A('swish_3', B['through'], 0.4)
A('impact_1', B['grabMia'] + 0.1, 0.4); T([523, 392], B['grabMia'] + 0.15, 0.08, 0.25)
# The loop: snoring again; CTA.
for i in range(3): T(110, B['end'] + 0.3 + i * 1.5, 0.06, 0.8, sweep=40, square=True)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
