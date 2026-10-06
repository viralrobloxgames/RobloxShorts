"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/cup_clip.js. Effects: a woof and a pop as Pickles comes out with the parcel, a chime on the
trophy reveal, whooshes on the cuts between places, a glass sting on the empty case with the STOLEN stamp, phone rings
and the ransom letters popping, the ARRESTED thud, a boing on "middleman", crickets on STILL MISSING, a tick for the
bomb fear, pops for each engraved name, a thud for MAIN SUSPECT, clock ticks, a fanfare for ENGLAND WIN, chomps for the
plate licking, a glass sting for STOLEN AGAIN, crickets for "no Pickles", a low hit on NEVER FOUND and a woof on the
end card. No noise-based effects (no applause or paper rustle: they crackle). woof.wav is synthesised (tonal) here;
the rest are copied from Copy the Crown, Every Lie Comes True and He Stole The Mona Lisa."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(inside=W['inside'] - 0.1, hall=W['week'] - 0.35, guards=W['guards'] - 0.1, empty=W['sunday'] - 0.25, ransom=W['ransom'] - 0.15,
         handover=W['police1'] - 0.1, middle=W['says'] - 0.15, missing=W['trophy1'] - 0.25, walk=W['pickles2'] - 0.3, bomb=W['owner'] - 0.2,
         tear=W['tears'] - 0.15, names=W['brazil1'] - 0.15, desk=W['takes'] - 0.15, suspect=W['main'] - 0.2, interview=W['question'] - 0.15,
         stadium=W['summer'] - 0.2, dinner=W['players'] - 0.2, licks=W['licks'] - 0.15, rio=W['seventeen'] - 0.15, back=W['stolen2'] - 0.1,
         nopickles=W['time'] - 0.25, never=W['never'] - 0.15, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('woof', 0.15, 0.32); S('pop', 1.1, 0.2)
S('chime', W['cup1'] - 0.2, 0.35)
for k in ['hall', 'ransom', 'handover', 'missing', 'walk', 'desk', 'interview', 'stadium', 'dinner', 'rio', 'nopickles', 'cta']: S('whoosh', T[k] - 0.05, 0.2)
for i in range(3): TN([523, 659], W['watch'] + i * 0.12, 0.03, 0.06)            # day and night icon
S('glass', W['empty'] - 0.05, 0.35); A('impact_3', W['empty'] + 0.05, 0.4)
for i in range(3): TN([1320, 1180], T['ransom'] + i * 0.4, 0.045, 0.25)          # the phone rings
for i in range(7): S('pop', W['fifteen'] - 0.15 + i * 0.07, 0.16)
S('thud', W['arrest'] - 0.1, 0.35); A('impact_2', W['arrest'], 0.3)
S('boing', W['middleman'] - 0.2, 0.3)
S('crickets', T['missing'] + 0.2, 0.12, dur=2.0)
S('woof', T['walk'] + 1.4, 0.25)
for i in range(4): TN([880], W['bomb'] - 0.15 + i * 0.18, 0.04, 0.05)            # tick tick tick
S('pop', W['paper'], 0.3); S('chime', W['paper'] + 0.15, 0.3)
for k in ['brazil1', 'west', 'uruguay']: S('pop', W[k] - 0.08, 0.3)
S('thud', W['main'] - 0.1, 0.35); A('impact_1', W['main'] - 0.05, 0.35)
for i in range(10): TN([1000], W['half'] - 0.2 + i * 0.16, 0.03, 0.04)          # the clock races round
A('drum_hit', W['morning'], 0.25)
S('fanfare', W['win'] - 0.15, 0.3)
S('chime', W['invite'] - 0.1, 0.25); S('woof', W['dinner'] + 0.1, 0.22)
for i in range(4): S('chomp', W['licks'] + i * 0.28, 0.22)
S('chime', W['clean'], 0.35)
S('glass', W['again'] - 0.1, 0.3); A('impact_3', W['again'], 0.35)
S('crickets', T['nopickles'] + 0.15, 0.12, dur=2.0)
A('impact_4', W['found'] - 0.15, 0.3)
S('woof', T['cta'] + 0.35, 0.25); TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
