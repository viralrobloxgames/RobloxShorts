"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py). Key times mirror T in web/emu_clip.js.
Effects: pops for the tags and the kit list, whooshes on cuts, the scatter (swishes), heavy drum steps for the
approaching mob, the jam (clang + shake), the truck engine rumble (shake) and bumps (thuds), a chime for the lookout,
a counter tick for the bullets, laughter (applause) in Parliament, a RETREAT stamp, a fanfare tone for THE EMUS WON."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(farmers=W['farmers'] - .12, sends=W['sends'] - .15, day1=W['day1'] - .12, day3=W['day3'] - .12, jams=W['jams'] - .15, bolts=W['bolts'] - .15,
         outrun=W['outrun'] - .2, ride=W['ride'] - .15, lookout=W['every'] - .12, week=W['after'] - .12, parl=W['parliament'] - .15, pulls=W['pulls'] - .12,
         admits=W['admits'] - .15, won=W['went'] - .12, cta=W['follow'] - .15)
T['scatter'] = W['split'] - 0.1; T['jam'] = W['jams'] + 0.05
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('pop', W['twenty'] - 0.1, 0.3); S('pop', W['soldiers'] - 0.2, 0.3)
for k in ['major1', 'gunners', 'machine1', 'ten']: S('pop', W[k] - 0.1, 0.25)
for k in ['farmers', 'sends', 'day1', 'day3', 'bolts', 'lookout', 'week', 'parl', 'pulls', 'admits', 'won']: S('whoosh', T[k] - 0.05, 0.2)
for i in range(4): A(['swish_1', 'swish_2', 'swish_3', 'swish_4'][i], T['scatter'] + i * 0.15, 0.25)
for i in range(8): A('drum_hit', T['day3'] + 0.2 + i * 0.5, 0.12)
A('impact_1', T['jam'], 0.4); S('clang', T['jam'] + 0.05, 0.3); S('shake', T['jam'] + 0.1, 0.25, dur=0.5)
S('shake', T['bolts'], 0.12, dur=T['lookout'] - T['bolts'])
for i in range(8): S('thud', T['ride'] + 0.1 + i * 0.4, 0.2)
S('chime', W['lookout'] - 0.1, 0.3)
for i in range(10): TN([900 + i * 40], W['half'] - 0.2 + i * 0.08, 0.03, 0.05)
A('impact_2', W['arent'] - 0.1, 0.35)
S('applause', T['parl'] + 0.1, 0.22, dur=T['pulls'] - T['parl']); S('pop', W['medals'] - 0.2, 0.3)
A('impact_3', T['pulls'] + 0.15, 0.35)
S('pop', W['birds'] - 0.2, 0.3)
TN([523, 659, 784], W['won'] - 0.15, 0.06, 0.18); S('chime', W['won'], 0.3)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
