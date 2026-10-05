"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/mona_clip.js. Effects: a whoosh as the painting comes off the wall and on each cut between
places, the badge pop, a poof for the frame and glass, the door rattle and creak, the guard's thought pop, a glass sting
on "She isn't" with the STOLEN stamp, the police counter, pencil scratches, the newspapers flying in, the dealer's REAL
stamp, a phone ring, ARRESTED, a chime on TODAY and applause on the most famous painting in the world.
SFX in audio/sfx/ are copied from Copy the Crown, He Bought Google For 12 Dollars, Every Lie Comes True, The Backwards
Umbrella, Say Their Name and Whatever Mia Draws; door_creak is from assets/audio/horror."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(guard=W['nobody'] - 0.1, stair=W['staircase'] - 0.15, door=W['locked'] - 0.1, plumber=W['plumber'] - 0.1, morning=W['morning'] - 0.15,
         hooks=W['four'] - 0.1, guards=W['guards'] - 0.1, isnt=W['isnt'] - 0.1, front=W['museum1'] - 0.1, search=W['sixty'] - 0.1,
         picasso=W['question'] - 0.1, attic=W['detective'] - 0.1, table=W['table'] - 0.15, queue=W['reopens'] - 0.1, papers=W['face'] - 0.1,
         italy=W['two'] - 0.1, dealer=W['dealer'] - 0.1, calls=W['calls'] - 0.15, then=W['stole'] - 0.1, today=W['handed'] - 0.1, cta=W['follow'] - 0.15)
T['dump'] = W['dumps'] + 0.1; T['open'] = W['opens'] + 0.05
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
S('whoosh', 0.0, 0.3); A('click', 0.3, 0.4)                             # off the pegs
S('whoosh', 1.3, 0.2)                                                    # the flip to camera
S('pop', W['used'] - 0.1, 0.35); A('impact_2', W['used'] + 0.25, 0.3)   # badge + FORMER stamp
for k in ['stair', 'morning', 'front', 'picasso', 'attic', 'queue', 'italy', 'then', 'today']: S('whoosh', T[k] - 0.05, 0.22)
S('pop', T['dump'] - 0.05, 0.35); S('clang', T['dump'] + 0.15, 0.15)    # frame and glass come off
S('shake', T['door'] + 0.15, 0.35, dur=0.5); TN([392, 330], W['locked'], 0.06, 0.12, square=True)
A('horror/door_creak', T['open'], 0.45); S('chime', T['open'] + 0.1, 0.2)
A('impact_1', W['four'], 0.3)
S('pop', W['shrug'] - 0.2, 0.3)
S('glass', T['isnt'], 0.35); A('impact_3', W['isnt'] + 0.15, 0.4)
A('drum_hit', W['shuts'], 0.3)
for i in range(10): TN([700 + i * 60], W['sixty'] - 0.1 + i * 0.07, 0.035, 0.05)
A('impact_2', W['picasso'] - 0.15, 0.3)
for i in range(4): S('pencil', W['report'] + i * 0.35, 0.25)
S('chime', W['table'] - 0.05, 0.35)
S('crickets', T['queue'] + 0.3, 0.12, dur=2.5)
for i in range(4): A(['swish_1', 'swish_2', 'swish_3', 'swish_4'][i], T['papers'] + 0.05 + i * 0.32, 0.3)
S('thud', W['sell'] + 0.05, 0.3); S('pop', W['sell'] + 0.1, 0.3)
A('impact_1', W['real'] - 0.05, 0.3)
for i in range(2): TN([1320, 1180], T['calls'] + 0.3 + i * 0.45, 0.05, 0.3)   # the phone rings
A('impact_3', W['police2'] - 0.1, 0.4)
S('crickets', T['then'] + 0.2, 0.15, dur=2.4)
S('chime', T['today'] + 0.05, 0.35); S('applause', W['famous'] - 0.1, 0.25)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
