"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/mail_clip.js. Effects: hammer bangs on the lid, a click for the torch, pops for the labels,
a whoosh on the javelin throw and on each cut between places, the C.O.D. stamp, a clock tick under the fog delay,
a thud as the crate lands upside down, crickets of heat, the plane's whoosh and touchdown, a saw rasp (shake), the
square falling out, a poof for the suit, the truck's horn, a chime and applause for the birthday, the clock ticking in
the flat, phone dial clicks, camera flashes, the paper tearing, a chime on PAID: £0.
SFX in audio/sfx/ are copied from He Stole The Mona Lisa (themselves from earlier projects)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(inside=W['inside'] - .12, bottles=W['bottles'] - .12, later=W['later1'] - .2, athlete=W['athlete'] - .15, daughter=W['daughters'] - .12,
         mailing=W['mailing'] - .12, label=W['label'] - .12, cod=W['cash'] - .12, fog=W['fog'] - .12, bombay=W['bombay'] - .12, burn=W['burning'] - .15,
         lands=W['sixty'] - .12, cuts=W['cuts'] - .12, suit=W['puts'] - .1, walks=W['airport'] - .25, hitch=W['hitchhikes'] - .12, makes=W['makes'] - .12,
         forgets=W['forgets'] - .12, panics=W['panics'] - .15, whole=W['whole'] - .12, airline=W['airline'] - .12, afford=W['afford'] - .12, cta=W['follow'] - .15)
T['lidOn'] = W['nails'] - 0.25; T['plug'] = W['cuts'] + 0.75; T['change'] = W['suit'] - 0.05; T['tear'] = W['drops']
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('thud', W['climbs'] + 0.1, 0.2)                                         # steps into the crate
S('whoosh', T['lidOn'], 0.2); S('thud', T['lidOn'] + 0.22, 0.4)           # the lid drops on
for i in range(4): A('impact_1' if i % 2 else 'impact_2', W['nails'] + 0.13 + i * 0.32, 0.28)   # hammer
A('click', T['inside'] + 0.1, 0.4)                                        # torch on
for k in ['pillow', 'torch', 'tinned']: S('pop', W[k] - 0.05, 0.25)
S('pop', W['water'] - 0.1, 0.25); S('crickets', T['later'] + 0.1, 0.12, dur=1.4)
for k in ['athlete', 'daughter', 'mailing', 'fog', 'bombay', 'lands', 'cuts', 'walks', 'hitch', 'makes', 'forgets', 'whole', 'airline', 'afford']: S('whoosh', T[k] - 0.05, 0.2)
S('whoosh', T['athlete'] + 0.5, 0.3)                                      # the javelin
S('pop', W['broke'] - 0.05, 0.3); S('pop', T['daughter'], 0.3)
S('pop', W['paint'] - 0.05, 0.3); A('impact_3', W['cash'] - 0.05, 0.35); A('impact_2', W['exist'] - 0.1, 0.35)
for i in range(8): TN([1100], W['grounds'] + 0.1 + i * 0.25, 0.03, 0.03)  # clock ticks
S('thud', W['upside'] - 0.05, 0.4); A('impact_1', W['upside'], 0.25)
S('crickets', T['burn'], 0.18, dur=1.3)
S('whoosh', T['lands'] + 0.2, 0.35); S('thud', T['lands'] + 2.5, 0.3)
S('shake', T['cuts'] + 0.05, 0.35, dur=T['plug'] - T['cuts']); S('thud', T['plug'] + 0.3, 0.4)
S('pop', T['change'] - 0.05, 0.4); S('chime', T['change'] + 0.1, 0.2)
TN([392, 330], W['australia2'] - 0.3, 0.07, 0.35, square=True)           # the truck's horn
S('chime', W['birthday2'] - 0.1, 0.35); S('applause', W['birthday2'] + 0.1, 0.18)
for i in range(10): TN([900], T['forgets'] + 0.3 + i * 0.35, 0.03, 0.03)  # the flat's clock
for i in range(5): A('click', T['panics'] + 0.2 + i * 0.12, 0.3)          # dialling
S('pop', W['calls'] - 0.1, 0.3)
for i in range(4): A(['swish_1', 'swish_2', 'swish_3', 'swish_4'][i], W['whole'] - 0.05 + i * 0.3, 0.3)
for i in range(3): A('click', T['whole'] + 0.1 + i * 0.37, 0.35)          # flashbulbs
A('swish_2', T['tear'], 0.4); A('impact_3', T['tear'] + 0.1, 0.35)
S('chime', W['never'] - 0.1, 0.35)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
