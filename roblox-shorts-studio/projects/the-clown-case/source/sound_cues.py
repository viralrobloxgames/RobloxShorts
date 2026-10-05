"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/clown_clip.js; change both together.
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
def honk(t, g=0.07): T([233, 220], t, g, 0.12, square=True)                                   # a clown horn, roughly
def sniffs(t, n=3, every=0.35, g=0.5):
    for i in range(n): A('sniff.wav', t + i * every, g)

B = dict(ask=W['girl'] - 0.1, stop1=W['case1'] - 0.55, r1=W['case1'], title=W['case1'] + 0.25, dock=W['somebody'] - 0.2,
         putt=W['chief'] - 0.2, sink=W['speech1'] + 0.1, reveal=W['candidate'] - 0.25, working=W['figure'] - 0.3,
         note=W['ransom1'] - 0.2, sniff=W['sniffed'] - 0.25, i1=W['waffle'] - 0.05, i2=W['fudge'] - 0.05, i3=W['mint'] - 0.1,
         drive=W['only'] - 0.25, inside=W['big1'] - 0.2, slide=W['free1'] - 0.1, lean=W['sundae1'] + 0.1, stop2=W['case2'] - 0.55,
         r2=W['case2'], back=W['out'] - 0.2, wipe=W['ransom2'] - 0.1, crew=W['crew'] - 0.2, throw=W['flying'] - 0.05,
         splat=W['sundae2'] + 0.1, leave=W['later'] + 0.1, rally=W['gave'] - 0.25, won=W['clown2'] - 0.15, drop=W['won'] - 0.05,
         coda=W['black'] - 0.35, slideIn=W['free2'] - 0.4, eat=W['tempting3'] + 0.35, cta=W['follow'] - 0.15)

# Hook: a love chime on "single"; tempting; the stop and the counter; the title.
A('swish_1', 0.0, 0.25); love(B['ask'] + 0.2); love(W['single'] + 0.1)
T(330, W['tempting1'], 0.05, 0.5, sweep=-60); denied(B['stop1']); ding(B['r1']); A('swish_3', B['title'], 0.3)
# The dock: gulls-ish chirps; the putt (tap, roll, plop); the clown reveal (hit + honk); "Is it working?".
A('swish_2', B['dock'] - 0.05, 0.3); T([1800, 2200], B['dock'] + 0.4, 0.03, 0.06)
A('click', B['putt'] + 0.5, 0.35); T(300, B['sink'] - 0.9, 0.025, 0.8, sweep=-40); A('impact_1', B['sink'], 0.35); ding(B['sink'] + 0.15)
A('impact_4', B['reveal'] + 0.3, 0.45); A('drum_hit', B['reveal'] + 0.3, 0.4); honk(B['reveal'] + 0.45); honk(B['reveal'] + 0.65)
honk(B['working'] + 0.15, 0.05)
# The ransom note (a paper swish); the sniff; the three smells; the drive.
A('swish_4', B['note'], 0.3); sniffs(B['sniff'] + 0.35, 5, 0.42, 0.55)
for t in (B['i1'], B['i2'], B['i3']): A('impact_2', t + 0.05, 0.3); T(1568, t + 0.05, 0.05, 0.08)
sting(W['only'] - 0.1, (247, 294, 370), 0.11)
T(140, B['drive'], 0.04, B['inside'] - B['drive'], sweep=30, square=True); A('swish_1', B['drive'] + 0.1, 0.3)
# The parlour: suspicious guys (a low sting); the free sundae slides; the lean and the cream; tempting; stop; counter.
sting(W['suspicious'], (147, 156, 165), 0.1); love(W['free1']); A('swish_2', B['slide'], 0.25)
T(900, B['lean'] + 0.35, 0.05, 0.1, sweep=-500)                                                    # boop: cream on the nose
T(330, W['tempting2'], 0.05, 0.5, sweep=-60); denied(B['stop2']); ding(B['r2'])
# Out back: the wife at the till (a till ding); the fake kidnapping (sting); the ransom for a truck; the wipe.
A('swish_3', B['back'], 0.3); A('horror/desk_bell', W['till'], 0.4)
sting(W['faked'], (220, 262, 330), 0.12); T([523, 659, 784, 659], W['truck'], 0.05, 0.1)          # ice cream truck jingle
# The crew; the throw; the splat (flash); the walk out.
A('horror/footstep', B['crew'] + 0.1, 0.3); A('horror/footstep', B['crew'] + 0.4, 0.3)
A('swish_4', B['throw'], 0.45); A('impact_3', B['splat'], 0.6); A('impact_1', B['splat'] + 0.03, 0.4); T(180, B['splat'], 0.06, 0.3, sweep=-80)
for i in range(4): A('horror/footstep', B['leave'] + 0.3 + i * 0.32, 0.22)
# The rally: crowd energy (bright chords); the banner drop; confetti pops; WINNER.
T([523, 659, 784], B['rally'], 0.05, 0.2); A('swish_2', B['drop'], 0.4); A('drum_hit', B['drop'] + 0.45, 0.5)
sting(B['drop'] + 0.45, (262, 330, 392), 0.12); honk(B['drop'] + 0.8)
for i in range(5): A('click', B['drop'] + 0.6 + i * 0.13, 0.15)
# Dusk: a sad note on the black eye; the sundae slides down the bar; tempting; the glitch; the spoon; CTA.
T([392, 370, 349, 330], W['black'] - 0.1, 0.06, 0.18); A('swish_1', B['slideIn'], 0.3); ding(B['slideIn'] + 0.8)
T(330, W['tempting3'], 0.05, 0.5, sweep=-60); T([1200, 400, 1600], B['eat'], 0.05, 0.05, square=True)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
