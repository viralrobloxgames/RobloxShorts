"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/thief_clip.js; change both together."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def zip_(t, g=0.45): A('swish_4', t, g); T(900, t, 0.06, 0.35, sweep=-700)
def roar(t, g=0.5, d=1.2): T(220, t, g * 0.3, d, sweep=-110, square=True); T(120, t + 0.02, g * 0.4, d * 1.1, sweep=-50, square=True); A('horror/reveal_hit', t, g * 0.8)
def stomp(t, g=0.4): A('impact_4', t, g); T(55, t, 0.12, 0.25, square=True)
def pop(t, g=0.3): A('click', t, g); T([1319, 1568], t + 0.03, 0.07, 0.1)
def cash(a, b):
    t = a
    while t < b: T([1568, 2093][int((t - a) / 0.09) % 2], t, 0.04, 0.05); t += 0.09

B = dict(bush=W['tonight'] - 0.3, zipIn=W['hooded'] - 0.25, grab0=W['grabs'] - 0.15, grab1=W['every'] + 0.55, freeze=W['checked'] - 0.15, pop=W['mine'] - 0.15,
         chase=W['chased'] - 0.1, gone=W['gone'] - 0.25, night2=W['night2'] - 0.45, limbo0=W['limboed'] - 0.5, limbo1=W['under'] + 0.35, empty2=W['under'] + 0.6,
         night3=W['night3'] - 0.45, apple=W['bribed'] - 0.25, take=W['apple'] - 0.05, zip3=W['apple'] + 0.45, think=W['stopped'] - 0.3, buy=W['spent'] - 0.1,
         egg=W['mythic'] - 0.05, timer=W['hatches'] - 0.2, sign=W['sign'] - 0.15, theft=W['right'] - 0.35, grab=W['grabbed'] - 0.1, ran=W['ran'] - 0.1,
         sit=W['didnt'] - 0.3, hatch=W['hatched'] - 0.05, roar=W['giant'] - 0.1, owner=W['owner'] - 0.35, bend=W['picked'] - 0.3, lift=W['hood'] + 0.15,
         carry=W['carried'] - 0.1, arrive=W['me'] + 0.1, hoodOff=W['hoodoff'] - 0.05, max=W['max'] - 0.1, quote=W['said'] - 0.15, tread=W['pays'] - 0.45,
         fast=W['fifty2'] - 0.1, paid=W['seconds'] + 0.2, broke=W['broke'] - 0.1, cta=W['follow'])

# Night bed under the stake-out; the thief vanishing in the hook; "again" sting.
A('horror/night_bed', 0, 0.25); A('horror/night_bed', B['bush'] + 6, 0.2)
zip_(0.05, 0.35); T([392, 330], W['again'], 0.08, 0.25, square=True)
A('horror/leaves_step', B['bush'] + 0.1, 0.4)
T([880, 880], W['midnight'] - 0.1, 0.08, 0.12)                      # clock ding-ding
for i in range(3): A('horror/footstep', W['footsteps'] + i * 0.22, 0.5)
# The zip round the pedestals: whooshes and a pop per egg.
zip_(B['zipIn']); zip_(B['grab0'] - 0.05, 0.35)
for i in range(10): pop(B['grab0'] + (B['grab1'] - B['grab0']) * (i + 0.5) / 10, 0.18)
T([523, 659, 784, 1047], W['fifty'], 0.1, 0.12, square=True)
A('horror/leaves_step', B['pop'], 0.5); T([330, 262], W['nine'] + 0.1, 0.09, 0.3, square=True)
zip_(B['chase'] + 0.15, 0.55); A('swish_1', B['gone'], 0.4); T([392, 349, 330, 294], B['gone'] + 0.1, 0.07, 0.14, square=True)
# Night 2: laser hum, the limbo whoosh, eggs gone.
T(120, B['night2'], 0.05, 2.5, square=True); T([784, 988], W['laser'], 0.06, 0.12)
A('swish_2', B['limbo0'] + 0.1, 0.4); T(600, B['limbo0'] + 0.1, 0.06, 0.8, sweep=-400)
zip_(B['empty2'] - 0.25, 0.35)
# Night 3: capybara munch, apple ping, zip.
pop(B['apple'], 0.2)
for i in range(5): A('click', B['take'] + 0.15 + i * 0.16, 0.18)
T([523, 392], W['bribed'], 0.08, 0.25, square=True); zip_(B['zip3'], 0.4)
# The idea, the shop, the egg pops in, timer ticks.
T([1047, 1319, 1568], W['stopped'], 0.07, 0.12)
cash(B['buy'] + 0.1, B['egg'] - 0.1); A('drum_hit', B['egg'], 0.4); pop(B['egg'] + 0.02, 0.35); T([1047, 1319, 1568, 2093], B['egg'] + 0.05, 0.08, 0.1)
A('swish_3', B['sign'], 0.3); A('impact_1', B['sign'] + 0.25, 0.3)
t = B['timer']
while t < B['theft']: A('click', t, 0.07); t += 0.5
# The theft and the run: zip in, grab, ticking speeds up into 3-2-1.
zip_(B['theft']); pop(B['grab'], 0.3)
t = B['ran']
while t < W['three'] - 0.1: A('click', t, 0.08); t += 0.33
for k in ('three', 'two', 'one'): A('drum_hit', W[k], 0.35); T(880 if k != 'one' else 1175, W[k], 0.09, 0.15, square=True)
# Hatch, roar, footsteps of the walk back, shake, hood off, reveal.
A('impact_2', B['hatch'], 0.6); A('impact_4', B['hatch'] + 0.02, 0.45); T([1047, 1319, 1568, 2093], B['hatch'] + 0.05, 0.1, 0.1)
roar(B['roar'] + 0.1, 0.55, 1.3)
T([784, 988, 1175], B['owner'] + 0.05, 0.1, 0.14)
A('swish_2', B['lift'], 0.35); T([523, 659], B['lift'] + 0.05, 0.07, 0.2)
t = B['carry'] + 0.3
while t < B['arrive']: stomp(t, 0.4); t += 0.6
for i in range(4): A('swish_1', B['hoodOff'] - 0.2 + i * 0.1, 0.25)
A('swish_3', B['hoodOff'] + 0.1, 0.4)
for i in range(10): A('click', B['hoodOff'] + 0.3 + i * 0.05, 0.12)
A('impact_1', B['hoodOff'] + 0.75, 0.45)
A('horror/reveal_hit', W['max'] - 0.05, 0.45); T([392, 466], W['max'], 0.07, 0.4)
T([330, 294], W['keeping'], 0.06, 0.3, square=True)
# Treadmill: belt hum, the fast payback (cash run), bang.
T(90, B['tread'] + 0.3, 0.04, B['fast'] - B['tread'], square=True)
T(140, B['fast'], 0.06, B['paid'] - B['fast'] + 0.3, sweep=500, square=True); cash(B['fast'], B['paid'])
T([1047, 1319, 1568, 2093], B['paid'], 0.12, 0.12)
T(1800, B['broke'] - 0.4, 0.05, 0.4, sweep=-1200)
A('impact_4', B['broke'], 0.7); A('impact_2', B['broke'] + 0.03, 0.55); A('drum_hit', B['broke'] + 0.05, 0.5); T(70, B['broke'], 0.16, 0.6, square=True)
A('impact_1', B['broke'] + 1.3, 0.45)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
