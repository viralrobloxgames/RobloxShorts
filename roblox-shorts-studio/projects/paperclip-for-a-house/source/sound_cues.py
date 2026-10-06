"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T / SW / MONTAGE in web/paperclip_clip.js. Effects: a pop for the post, a whoosh into the walk, for every
trade two ACCEPT ticks and a pop as the items cross, poofs (swish) through the montage, a buzz and chat pings for the
"dumbest decision", a chime on 6,000+ globes and the missing slot, clapperboard snaps, applause for the house.
SFX in audio/sfx/ are copied from He Bought Google For 12 Dollars (whoosh, pop, applause, chime, flutter)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
SW = [W['fish'] + 0.05, W['knob1'] + 0.05, W['stove1'] + 0.05, W['generator'] + 0.05]
T = dict(plan=W['plan'] - 0.15, tbt=W['tbt'] - 0.1, passIn=W['then'] + 0.25, globe=W['globe1'] + 0.05, people=W['people'] - 0.1,
         but=W['but'] - 0.1, want=W['wants1'] - 0.1, so=W['so'] - 0.1, role=W['movie2'] + 0.05, tiny=W['tiny'] - 0.1,
         aud=W['auditions'] - 0.1, pay=W['pay'] - 0.1, house=W['house2'] + 0.05, final=W['oneyear'] - 0.1, cta=W['follow'] - 0.15)
MONTAGE = [W['snowmobile'], W['trip'], W['truck'], W['record'], W['rent'], T['passIn']]
c = []
A = lambda a, t, g=0.3: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.3: A(f'sfx/{n}.wav', t, g)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def trade(t, pop=True):                                   # ACCEPT, ACCEPT, the items cross
    TN([1319, 1760], t - 0.05, 0.06, 0.09); TN([1568, 2093], t + 0.07, 0.06, 0.1)
    if pop: S('pop', t + 0.02, 0.3)
S('pop', 0.05, 0.35); TN([1047, 1568], W['posts'], 0.05, 0.12)          # the post goes up
S('whoosh', T['plan'], 0.25)
for t in SW: trade(t)
S('whoosh', T['tbt'] - 0.05, 0.3)                                       # cut to the plaza
for i, t in enumerate(MONTAGE):
    trade(t, pop=False); A(['swish_1', 'swish_2', 'swish_3', 'swish_4'][i % 4], t - 0.05, 0.3)
    if i == 2: A('impact_2', t, 0.3)                                    # the truck lands
S('whoosh', W['afternoon'] - 0.3, 0.2)
trade(T['globe'])
TN([196, 185], T['people'], 0.11, 0.35, square=True); A('impact_3', T['people'], 0.3)   # DOWNGRADE
n = 6
for i in range(n): TN([1175 + (i % 2) * 220], T['people'] + 0.1 + i * ((W['made'] - T['people']) / n), 0.05, 0.06)   # chat pings
S('whoosh', T['but'] - 0.05, 0.3)
for i in range(8): TN([880 + i * 90], W['six'] - 0.15 + i * 0.11, 0.035, 0.05)   # the counter rolling
S('chime', W['six'] + 0.75, 0.35)
S('chime', W['this1'] - 0.1, 0.3)
trade(T['role']); A('click', T['role'] + 0.6, 0.5)                      # Max snaps the clapper
S('whoosh', T['tiny'] - 0.05, 0.3)
A('click', W['auditions'] + 0.35, 0.55); A('drum_hit', W['auditions'] + 0.36, 0.2)   # "action!"
S('applause', W['auditions'] + 0.6, 0.15)
trade(T['house']); S('chime', T['house'] + 0.3, 0.35)
S('applause', T['final'], 0.3)
TN([784, 1047], W['oneyear'], 0.06, 0.12); TN([988, 1319], W['fourteen'], 0.06, 0.12)
TN([1047, 1319, 1568], W['clip2'] - 0.1, 0.06, 0.14); TN([1319, 1568, 2093], W['house3'] - 0.1, 0.07, 0.2)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
