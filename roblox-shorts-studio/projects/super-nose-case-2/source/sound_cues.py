"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/vampire_clip.js; change both together.
Custom sound: audio/sniff.wav (Case 1's). Library: assets/audio (+ horror/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def sting(t, notes=(196, 247, 294), g=0.12): T(list(notes), t, g, 0.09, square=True); A('drum_hit', t, 0.45)
def denied(t): T([392, 311], t, 0.09, 0.14, square=True)
def ding(t): T([1319, 1760], t, 0.09, 0.08)
def love(t): T([1047, 1319, 1568, 2093], t, 0.07, 0.07)
def sniffs(t, n=3, every=0.35, g=0.5):
    for i in range(n): A('sniff.wav', t + i * every, g)

B = dict(ask=W['sister1'], think1=W['tempting1'] - 0.1, stop1=W['case1'] - 0.55, r1=W['case1'], enter=W['case1'] + 0.45,
         coffinShot=W['count'] - 0.2, fb1=W['nicest'] - 0.1, fb2=W['town'] - 0.2, ko=W['knocked'] - 0.1, bread=W['next'] - 0.15,
         chief=W['chief'] - 0.25, think2=W['tempting2'] - 0.1, stop2=W['case2'] - 0.55, r2=W['case2'], pick=W['sniffed'] - 0.25,
         i1=W['extra'] - 0.1, i2=W['fresh'] - 0.1, i3=W['hint'] - 0.1, home=W['garlic3'] - 0.2, turn=W['only'] - 0.2,
         reveal=W['gardener'] - 0.25, patch=W['patch'] - 0.2, motive=W['vlad2'] - 0.2, tomato=W['twenty'] - 0.2, go=W['vlad3'] - 0.2,
         click=W['cuffs'] - 0.05, wake=W['gone'] - 0.2, sitUp=W['woke'] - 0.1, dinner=W['sister2'] - 0.2, fangs=W['fangs'] - 0.25,
         tempt3=W['tempting3'] - 0.1, flee=W['case3'] - 0.3, r3=W['case3'], cta=W['follow'] - 0.15)

# Hook: the creaky door, a love chime on "single"; tempting; the stop and the counter.
A('horror/door_creak', 0.0, 0.35); love(B['ask'] + 0.1); love(W['single'] + 0.1)
T(330, W['tempting1'], 0.05, 0.5, sweep=-60); denied(B['stop1']); ding(B['r1'])
# Into the hall; the title; the coffin reveal; the flashbacks (soft chimes); KO; the bread.
A('swish_3', B['enter'] - 0.05, 0.3); A('horror/reveal_hit', B['coffinShot'], 0.4)
T([784, 988], B['fb1'], 0.05, 0.12); T([784, 988, 1175], B['fb2'], 0.05, 0.12); A('swish_1', B['ko'], 0.3)
for i in range(3): T(1568 - i * 200, B['ko'] + 0.15 + i * 0.12, 0.04, 0.08)                         # dizzy stars
sting(B['bread'] + 0.1, (220, 262, 330), 0.1)
# The Chief: footsteps in, a squeak of the pool ring; tempting; stop; counter.
for i in range(4): A('horror/footstep', B['chief'] - 1.0 + i * 0.32, 0.25)
T(900, W['burger'], 0.04, 0.12, sweep=600); T(330, W['tempting2'], 0.05, 0.5, sweep=-60); denied(B['stop2']); ding(B['r2'])
# The sniff, long; the three smells (a ping per insert); "homegrown".
sniffs(B['pick'] + 0.4, 5, 0.42, 0.55)
for t in (B['i1'], B['i2'], B['i3']): A('impact_2', t + 0.05, 0.3); T(1568, t + 0.05, 0.05, 0.08)
sting(W['homegrown'], (247, 294, 370), 0.11)
# The window; the reveal of the gardener (hit + flash); the patch; the shade (a low drone); the sad tomato; the fist.
A('swish_2', B['turn'], 0.3); A('horror/reveal_hit', B['reveal'] + 0.2, 0.55); A('impact_4', B['reveal'] + 0.25, 0.4)
sting(B['patch'] + 0.1, (147, 156, 165), 0.12)
T(110, B['motive'], 0.05, 2.6, sweep=-10, square=True); A('horror/tension_rise', B['motive'], 0.25)
T([392, 370, 349, 330], W['tomatoes'] - 0.1, 0.07, 0.18)                                                 # sad trombone-ish
A('horror/latch', W['go'], 0.4)
# Cuffs and CASE CLOSED; the clippers hit the ground.
A('click', B['click'], 0.6); T([2600, 1900], B['click'], 0.05, 0.05, square=True); A('impact_4', B['click'] + 0.02, 0.5)
A('drum_hit', B['click'] + 0.05, 0.5); sting(B['click'] + 0.1, (247, 294, 370), 0.12); A('impact_1', B['click'] + 0.4, 0.3)
# Vlad wakes; dinner; the fangs (hit); tempting; he runs; the counter; CTA.
A('swish_4', B['wake'], 0.3); T([523, 659, 784, 1047], B['sitUp'], 0.07, 0.1); love(W['dinner'] - 0.1)
A('horror/reveal_hit', B['fangs'] + 0.1, 0.6); A('impact_3', B['fangs'] + 0.12, 0.45)
T(330, W['tempting3'], 0.05, 0.5, sweep=-60)
for i in range(6): A('horror/footstep', B['flee'] + 0.1 + i * 0.22, 0.3)
ding(B['r3']); A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
