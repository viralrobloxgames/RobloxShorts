"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/google_clip.js. Effects: keyboard clicks while Leo types, the BUY click, a payment ding,
inbox pings, a cancel buzz, a coin ding, the reward button, a ping per digit, a flip per letter, cha-ching for the doubling.
SFX files in audio/sfx/ are copied from The Backwards Umbrella (whoosh, pop) and Every Lie Comes True (chime)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(hookEnd=W['guy'] - 0.15, typeA=W['gcom'] - 0.3, typeB=W['gcom'] + 0.7, avail=W['available'] - 0.05, price=W['twelve1'] - 0.05,
         click=W['buy'] + 0.05, paid=W['goes'] - 0.05, globeIn=W['minute'] - 0.15, flag=W['owns'] - 0.1, globeOut=W['inbox'] - 0.15,
         owner=W['owner'] - 0.15, cancel=W['cancelled'] - 0.08, refund=W['refunded'] - 0.05, wants=W['wants'] - 0.1,
         report=W['reports'] - 0.15, sent=W['send'] - 0.3, press=W['reward'] - 0.1, give=W['doesnt'] - 0.05, point=W['asks'] + 0.1,
         double=W['doubles'] - 0.1, count=W['over'] - 0.1, final=W['twelve4'] - 0.45, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.3: A(f'sfx/{n}.wav', t, g)
H = lambda n, t, g=0.3: A('horror/' + n, t, g)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
# typing: soft key clicks
for a, b in [(T['hookEnd'] + 0.1, T['typeB']), (T['report'] + 0.3, T['sent'] - 0.1)]:
    t = a
    while t < b: A('click', t, 0.07); t += 0.11 + (int(t * 37) % 3) * 0.03
TN([880, 1320], T['avail'], 0.07, 0.12)                    # result pops up
A('click', T['click'], 0.4)                               # BUY
TN([1047, 1319, 1568], T['paid'], 0.09, 0.14)             # payment complete
S('whoosh', T['globeIn'] - 0.05, 0.35); S('pop', T['flag'], 0.45)
for i in range(9): TN([1568], T['globeOut'] + i * 0.32, 0.05, 0.06)   # inbox pings
TN([196, 185], T['cancel'], 0.12, 0.35, square=True)      # order cancelled buzz
A('impact_2', T['cancel'] + 0.02, 0.3)
TN([1976, 2637], T['refund'] + 0.4, 0.07, 0.18)           # coin lands in his hand
S('whoosh', T['sent'], 0.3)
A('impact_1', T['press'], 0.4); TN([1319, 1760], T['press'] + 0.05, 0.08, 0.16)
for i in range(6): TN([660 + i * 110], W[f'd{i + 1}'], 0.07, 0.09)    # each digit lights up
for i in range(6): TN([1568 + i * 90, 2093 + i * 120], W[f'l{i + 1}'] - 0.02, 0.06, 0.07)   # a clean tick as each digit flips to a letter (the flutter noise crackled)
S('chime', W['l6'] + 0.15, 0.4)
S('pop', T['give'] + 0.1, 0.25)
TN([784, 988, 1175], W['schools'] - 0.4, 0.05, 0.25)            # soft chime for the school (no applause: the synth applause crackles)
TN([1319, 1568, 2093], T['count'], 0.08, 0.12); TN([2093, 2637], T['count'] + 1.0, 0.08, 0.2)   # cha-ching
S('chime', T['double'] + 0.1, 0.3)
TN([784, 1047], T['final'] + 0.3, 0.05, 0.12)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
