"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py). Key times mirror T in web/cliff_clip.js.
Effects: crowd chatter (applause, low), pops for the tags, the starter's pistol (impact + puff), whooshes on cuts,
crickets at night, a clock alarm at 2 a.m., footstep thuds under the shuffle, sheep bleats (tones), the tape snapping,
applause and a chime at the finish, cash register chimes. SFX copied from He Mailed Himself Home."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(farmer=W['potato'] - .15, chance=W['nobody'] - .12, gun=W['gun'] - .12, shuffle=W['shuffles1'] - .12, dusk=W['nightfall'] - .12,
         camp=W['night'] - .12, wakes=W['wakes'] - .15, again=W['starts'] - .12, tents=W['shuffles2'] - .12, lead=W['morning2'] - .15,
         farm=W['back'] - .12, decides=W['decides'] - .12, faster=W['faster1'] - .35, resting=W['stopping'] - .1, finish=W['five2'] - .12,
         record=W['nearly'] - .12, cheque=W['hand'] - .15, gives=W['gives'] - .12, cta=W['follow'] - .15)
T['bang'] = W['gun'] + 0.15; T['tape'] = W['ten1'] - 0.2
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('applause', 0.0, 0.08, dur=T['gun'])
S('pop', W['five'] - 0.1, 0.3); S('pop', W['sydney'] - 0.1, 0.25); S('pop', T['farmer'], 0.3)
S('crickets', T['chance'] + 0.2, 0.1, dur=1.2); A('impact_2', W['chance'] - 0.3, 0.35)
A('impact_4', T['bang'], 0.5); S('whoosh', T['bang'] + 0.1, 0.3)
for k in ['dusk', 'camp', 'lead', 'farm', 'decides', 'faster', 'finish', 'cheque', 'gives']: S('whoosh', T[k] - 0.05, 0.2)
for i in range(6): S('thud', T['shuffle'] + 0.1 + i * 0.22, 0.08)
S('crickets', T['camp'], 0.2, dur=T['lead'] - T['camp'])
for i in range(4): TN([1760, 1320], W['two'] - 0.2 + i * 0.22, 0.05, 0.1, square=True)
for i in range(6): S('thud', T['tents'] + 0.1 + i * 0.3, 0.07)
S('chime', T['lead'] + 0.2, 0.3)
for i in range(3): TN([520, 470], T['farm'] + 0.3 + i * 0.9, 0.05, 0.35)   # baa
A('impact_3', W['sleep2'] - 0.15, 0.35); S('pop', W['never'] - 0.1, 0.3)
S('whoosh', T['faster'] + 0.3, 0.35)
S('applause', T['finish'], 0.25, dur=T['cta'] - T['finish']); A('click', T['tape'], 0.5); S('chime', T['tape'] + 0.05, 0.35)
A('impact_2', T['record'] + 0.1, 0.35); S('chime', W['dollars'] - 0.1, 0.3)
for i in range(4): S('chime', T['gives'] + i * 0.35 + 0.2, 0.15)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
