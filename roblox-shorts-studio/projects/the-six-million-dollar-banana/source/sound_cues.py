"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/banana_clip.js. Effects: chomps on every bite, coins under the big prices, whooshes on the
cuts between places, a tape stretch (tones) as the banana goes up, a pop for "IT'S ART", a boing for the new banana, a
chime for the certificate, ticks as the bid board climbs, the gavel thud and SOLD, a pop for the question mark and a
small chime for 25 cents. No noise-based effects (no applause or paper rustle: they crackle). SFX copied from Copy the
Crown, Every Lie Comes True, He Stole The Mona Lisa and The Dog Who Found The World Cup."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(eats=W['then1'] - 0.1, fair=W['started'] - 0.15, tape=W['artist1'] - 0.1, collectors=W['collectors'] - 0.15, hungry=W['days'] - 0.15,
         panic=W['gallery'] - 0.1, cert=W['because'] - 0.15, seoul=W['years'] - 0.15, breakfast=W['skipped'] - 0.25, auction=W['then2'] - 0.1,
         bids=W['bids'] - 0.1, sold=W['six2'] - 0.1, buyer=W['buyer'] - 0.1, itself=W['itself'] - 0.45, stand=W['street'] - 0.35,
         cents=W['sold'] - 0.15, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('coins', W['six1'] - 0.1, 0.3)
for i in range(2): S('chomp', T['eats'] + 0.3 + i * 0.6, 0.3)
for k in ['fair', 'seoul', 'auction', 'buyer', 'stand', 'cta']: S('whoosh', T[k] - 0.05, 0.2)
TN([300, 600], W['banana2'] - 0.1, 0.03, 0.25, sweep=200)                  # tape stretched
S('pop', W['art2'] - 0.1, 0.3)
S('coins', W['hundred'] - 0.2, 0.3); S('pop', W['each'] - 0.1, 0.25)
for i in range(3): S('chomp', W['eats2'] + i * 0.5, 0.3)
A('impact_2', W['eats2'] + 0.05, 0.3)
S('boing', W['tape'] - 0.1, 0.3)
S('chime', T['cert'] + 0.1, 0.3); S('pop', W['replace'] - 0.1, 0.25)
for i in range(3): S('chomp', W['eats3'] + 0.3 + i * 0.5, 0.28)
S('pop', W['skipped'] - 0.2, 0.25)
for k, f in [('million2', 660), ('three', 740), ('five', 830), ('six2', 990)]: TN([f], W[k] - 0.15, 0.05, 0.12); S('coins', W[k] - 0.1, 0.18)
S('thud', W['dollars3'] - 0.2, 0.4); A('impact_3', W['dollars3'] - 0.1, 0.35)
for i in range(2): S('chomp', T['buyer'] + 0.35 + i * 0.6, 0.3)
S('pop', W['itself'] - 0.2, 0.3)
S('chime', W['cents'] - 0.15, 0.3); TN([523], W['cents'] + 0.5, 0.04, 0.2)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
