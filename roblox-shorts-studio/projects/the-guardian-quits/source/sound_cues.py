"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/guardian_clip.js; change both together."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def roar(t, g=0.5, d=1.0): T(240, t, g * 0.3, d, sweep=-90, square=True); T(130, t + 0.02, g * 0.4, d * 1.1, sweep=-40, square=True); A('horror/reveal_hit', t, g * 0.8)
def stomp(t, g=0.4): A('impact_4', t, g); T(60, t, 0.12, 0.25, square=True)
def steps(a, b, every, g=0.4):
    t = a
    while t < b: stomp(t, g); t += every
def bonk(t, g=1.0): A('impact_3', t, 0.6 * g); A('drum_hit', t, 0.5 * g); T([1568, 2093], t + 0.02, 0.1 * g, 0.08); T(500, t + 0.05, 0.08 * g, 0.8, sweep=-300)
def pop(t, g=0.3): A('click', t, g); T([1319, 1568], t + 0.03, 0.07, 0.1)

B = dict(grab=W['steals'] + 0.05, run=W['steals'] + 0.35, chase=W['chase'] - 0.3, cross=W['safe'] + 0.1, bonk=W['bonk'], day2=W['cross'] - 0.3,
         stolen=W['month'] - 0.2, review=W['boss'] - 0.1, glasses=W['sunglasses'] - 0.05, stache=W['moustache'] - 0.05, tag=W['tag'] - 0.05,
         scan=W['read'] - 0.2, through=W['through'] - 0.1, bases=W['behind'] - 0.25, leo=W['leos'] - 0.25, took=W['took'] - 0.1,
         leoRun=W['chased'] - 0.3, leoBonk=W['stop'] + 0.1, home=W['home'] - 0.3, five=W['stars'] - 0.2, wobble=W['hatched'] - 0.8,
         hatch=W['hatched'] + 0.05, swarm=W['baby'] - 0.2, quit=W['quit'] - 0.2, hired=W['hired'], job=W['snacks'] - 0.35, best=W['best'] - 0.25,
         kids=W['kids'] - 0.6, cta=W['follow'])
babyBonk = B['kids'] + 2.0

# Opening: Max tiptoes, grabs, the roar, the chase, BONK.
for i in range(5): A('click', 0.3 + i * 0.35, 0.06)
pop(B['grab']); roar(B['grab'] + 0.15, 0.55, 1.1)
steps(B['chase'] + 0.2, B['bonk'] - 0.2, 0.42); T([784, 988, 1175], B['cross'], 0.1, 0.14)
bonk(B['bonk']); T(90, B['bonk'], 0.14, 0.4, square=True)
for i in range(4): T([2093, 2637][i % 2], B['bonk'] + 0.6 + i * 0.22, 0.04, 0.07)
# Confused: a "huh?" boop; Mia and the Noob stroll past.
T([392, 523], B['day2'] + 0.2, 0.08, 0.25)
# 400 stolen: a counter ticking up, the one-star review.
t = B['stolen'] + 0.2
while t < B['review'] - 0.2: T(1800 + 400 * ((t * 10) % 2), t, 0.03, 0.04); t += 0.07
A('drum_hit', B['review'], 0.4); T([392, 330, 262], B['review'] + 0.2, 0.09, 0.3, square=True)
# Disguise pieces pop on; the scanner; through.
for k in ('glasses', 'stache', 'tag'): A('swish_3', B[k], 0.3); pop(B[k] + 0.05, 0.25)
T(400, B['scan'] + 0.1, 0.05, B['through'] - B['scan'] - 0.2, sweep=800)
T([784, 988, 1175, 1568], B['through'], 0.12, 0.14); A('swish_2', B['through'] + 0.1, 0.35)
steps(B['through'] + 0.2, B['through'] + 1.6, 0.5, 0.3)
# The bases; taking the eggs (a pop per egg); Leo's bonk.
T([523, 659, 784, 1047], W['full'] - 0.1, 0.08, 0.12)
for i in range(8): pop(B['took'] - 0.2 + i * 0.1 + 0.4, 0.15)
steps(B['leoRun'] + 0.3, B['home'] - 0.2, 0.55, 0.35)
bonk(B['leoBonk']); A('swish_4', B['leoBonk'] + 0.05, 0.4); A('impact_1', B['leoBonk'] + 1.0, 0.35)
# Five stars, the wobble, the hatch, the babies.
for i in range(5): T(1047 + i * 131, B['five'] + 0.15 + i * 0.08, 0.06, 0.08)
for i in range(10): A('click', B['wobble'] + i * 0.08, 0.1)
A('impact_2', B['hatch'], 0.6); A('impact_4', B['hatch'] + 0.02, 0.4); T([1047, 1319, 1568, 2093], B['hatch'] + 0.05, 0.1, 0.1)
for i in range(16): T(900 + (i % 5) * 120, B['swarm'] + i * 0.1, 0.04, 0.15, sweep=-400)
T([330, 262], W['jobs'], 0.08, 0.35, square=True)
# I quit, hired, the job (belt hum, TV jingle), best job, the kids, the baby bonk.
A('drum_hit', B['quit'], 0.35); T([523, 659, 784, 1047], B['hired'] + 0.1, 0.1, 0.12)
T(90, B['job'], 0.04, B['kids'] - B['job'], square=True)
for i in range(12): T([784, 988, 1175, 988][i % 4], B['job'] + 0.5 + i * 0.25, 0.03, 0.12, square=True)
pop(B['kids'] + 0.5, 0.3); steps(B['kids'] + 0.8, babyBonk - 0.2, 0.25, 0.12)
bonk(babyBonk, 0.6); T([1568, 2093], babyBonk + 0.05, 0.08, 0.1)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
