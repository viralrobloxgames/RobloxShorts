"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/spaghetti_clip.js. Birdsong, a cuckoo and a breeze in the orchard; a TV set's hum in the
living room and the studio; pops for each straight-faced "fact"; the weevil's squeak; telephones ringing louder and
faster as the calls pile up; a plop when the sprig goes in; the calendar flip, a stamp and a fanfare for April Fools'.
SFX are listed in source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(watch=W['eight'] - 0.1, studio=W['its1'] - 0.1, swiss=W['in_sw'] - 0.1, dry=W['pickers'] - 0.1, weevil=W['dreaded'] - 0.1,
         length=W['and1'] - 0.1, tin=W['back'] - 0.1, calls=W['so'] - 0.1, ask=W['is'] - 0.1, answer=W['the_answer'] - 0.1,
         sprig=W['place'] - 0.1, calendar=W['date'] - 0.1, fool=W['it_was'] - 0.1, hoax=W['and_its'] - 0.1, cta=W['follow'] - 0.15, end=W['end'] + 2.5)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def bed(name, t0, t1, g, length):
    t = t0
    while t < t1 - 0.05: S(name, t, g, dur=min(length, t1 - t + 0.15)); t += length - 0.15

# orchard beds: the hook, the Swiss shots, the ending
for a, b in ((0.0, T['watch']), (T['swiss'], T['tin']), (T['hoax'], T['end'])):
    bed('birds', a, b, 0.16, 5.0); bed('forest_wind', a, b, 0.07, 8.0)
bed('tv_hum', 0.0, T['watch'], 0.05, 4.0)                    # the hook is "on TV"
A('drum_hit', 0.0, 0.25); S('pop', 0.05, 0.2); S('cuckoo', W['tree1'] - 0.2, 0.3); S('pop', W['tree1'] - 0.15, 0.25)
# the living room
bed('tv_hum', T['watch'], T['studio'], 0.12, 4.0); A('swish_1', T['watch'] - 0.05, 0.25)
k = T['watch'] + 0.1
while k < W['watching']: A('click', k, 0.08); k += 0.08
A('impact_1', W['watching'], 0.3)
# the studio
bed('tv_hum', T['studio'], T['swiss'], 0.06, 4.0); A('swish_2', T['studio'] - 0.05, 0.25); S('pop', T['studio'] + 0.05, 0.2)
A('drum_hit', W['serious1'] - 0.15, 0.3); S('pop', W['show1'] - 0.15, 0.2)
# Switzerland: the facts
A('swish_3', T['swiss'], 0.3); S('pop', W['switzerland'] - 0.1, 0.25); S('chime', W['mild'] - 0.1, 0.25); S('fanfare', W['bumper'] - 0.1, 0.3)
S('whoosh', T['dry'], 0.25); S('pop', W['sun'] - 0.15, 0.2)
S('pop', W['weevil'] - 0.15, 0.25); S('squeak', W['wiped'] - 0.05, 0.4); S('thud', W['wiped'] - 0.1, 0.45)
S('pop', W['same'] - 0.15, 0.25); S('chime', W['careful'] - 0.1, 0.3); TN([523, 659, 784], W['breeding'], 0.04, 0.14)
# Britain: tins
A('swish_4', T['tin'], 0.25); bed('tv_hum', T['tin'], T['answer'], 0.04, 4.0); S('pop', W['rare'] - 0.15, 0.25); S('thud', W['tin1'] - 0.15, 0.3)
# the calls: rings piling up
for i in range(7): S('ring', T['calls'] + 0.1 + i * (T['ask'] - T['calls']) / 8, 0.18 + 0.03 * i, dur=1.2)
S('pop', T['ask'] + 0.05, 0.25); S('pop', W['how'] - 0.15, 0.25)
# the answer
A('swish_1', T['answer'], 0.25); A('drum_hit', T['answer'] + 0.05, 0.3)
S('pop', T['sprig'] + 0.05, 0.25); S('plop', W['tomato'], 0.45); S('chime', W['hope'] - 0.1, 0.25); TN([392, 440, 494], W['best'] - 0.05, 0.04, 0.16)
# the date
S('flutter', W['april1'] - 0.35, 0.3, dur=0.6); A('click', W['april1'] - 0.15, 0.3); A('impact_2', W['april1'] - 0.1, 0.3)
S('thud', W['fools'] - 0.15, 0.55); S('fanfare', W['fools'] - 0.05, 0.35); S('applause', W['joke'], 0.3)
S('pop', W['biggest'] - 0.1, 0.25); S('pop', W['pulled'] - 0.1, 0.25)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues, ends', round(max(x['start'] for x in c), 2), 's')
