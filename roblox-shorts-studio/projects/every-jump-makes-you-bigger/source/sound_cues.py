"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas below mirror the B = {...} block in web/jump_clip.js; change both together."""
import json, math
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
SIZE = lambda j: 1 + j if j <= 1 else 2 * j ** 0.42
def pop(t, j, g=0.13):            # a size pop: a quick upward blip that gets lower as you get bigger
    T(max(220, 900 - 14 * j), t, g, 0.08, sweep=6000)
def thud(t, size, g=0.3):         # a landing / footstep, heavier with size
    A('impact_4' if size > 4 else 'impact_1', t, min(0.6, g * (0.6 + size / 12)))
    if size > 4: A('drum_hit', t, min(0.5, 0.15 + size / 40)); T(70, t, min(0.18, size / 80), 0.25, square=True)
def typing(a, b, g=0.12, step=0.07):
    t = a
    while t < b: A('click', t, g); t += step
def montage(t0, t1, j0, j1):      # fast-forward: a stream of pops and a rumble of bounces
    n = int((t1 - t0) / 0.07)
    for i in range(n): pop(t0 + i * 0.07, j0 + (j1 - j0) * i / n, 0.06)
    t = t0 + 1 / 3.4
    while t < t1: A('impact_1', t, 0.22); T(80, t, 0.08, 0.15, square=True); t += 1 / 3.4

# Mirrors of the clip's beats.
B = dict(hookPop=0.2, leoHops=[1.05, 1.8, W['plan'] - 0.1, W['skip'] + 0.15, W['skip'] + 0.95], mont1=[W['jumped'] - 0.05, W['fifty'] + 0.6],
         walk1=W['stepped'] - 0.3, walk2end=W['steps'] + 0.25, maxHop1=W['tried'] + 0.5, maxHop2=W['grew'] - 0.3, topple=W['didnt'] - 0.05,
         maxRespawn=W['back'] + 0.1, peek=W['tinyDoor'] - 0.55, sitDown=W['sat'] + 0.75, typed=[W['typed'] - 0.15, W['hundred'] + 0.2],
         standUp=W['say'] + 0.05, mont2=[W['say'] + 0.55, W['ninety'] - 0.45], hop99=W['ninety'] - 0.3, hop100=W['oneHundred'] - 0.4,
         mont3=[W['clear'] + 0.15, W['giant'] + 0.35], maxWalk=W['stomped'] - 0.25, leoRespawn=W['respawned'] - 0.1, walkIn=W['walked'] - 0.15,
         grab=W['grabbed'], vhop=W['victory'] + 0.2, cta=W['follow'])
B['landed99'] = B['hop99'] + 0.45; B['break'] = B['hop100'] + 0.45

# Opening: whoosh in, the first pop, and the hops while the rule is read.
A('swish_3', 0.0, 0.35)
pop(B['hookPop'], 1, 0.2); A('drum_hit', B['hookPop'], 0.35); T([1047, 1319], B['hookPop'] + 0.03, 0.08, 0.08)
thud(-0.22 + 0.85 * 0.9, 2)
for j, t in enumerate(B['leoHops'], start=2): pop(t, j, 0.15); thud(t + 0.45, SIZE(j))
montage(B['mont1'][0], B['mont1'][1], 6, 50)
T([784, 988, 1175, 1568], B['mont1'][1], 0.12, 0.1)                                         # SIZE 51
# Giant strides over the lava level and along the lane (STEP 1-4 counter).
d1 = 68 / 48; per = 14.5 * SIZE(50) / 48 * 0.67 / 2
t = B['walk1'] + 0.3
while t < B['walk1'] + d1 + 0.2: thud(t, SIZE(50), 0.45); t += per
t0, t1 = W['reached'] - 0.2, B['walk2end'] - 0.1
for i in range(4): thud(t0 + i * (t1 - t0) / 4, SIZE(50), 0.45); T([523 + 120 * i], t0 + i * (t1 - t0) / 4 + 0.02, 0.06, 0.08, square=True)
# Max on the tiny block.
for i in range(5): A('click', W['tried'] - 0.25 + i * 0.15, 0.1)                            # running
pop(B['maxHop1'], 1, 0.16); thud(B['maxHop1'] + 0.5, 2, 0.3)
pop(B['maxHop2'], 2, 0.16); thud(B['maxHop2'] + 0.45, 2.7, 0.3)
T([392, 370, 392, 370], B['maxHop2'] + 0.5, 0.06, 0.09, square=True)                          # teetering
A('swish_2', B['topple'], 0.3); T(500, B['topple'], 0.08, 0.45, sweep=-700)
A('impact_2', B['topple'] + 0.45, 0.45); T(160, B['topple'] + 0.45, 0.1, 0.5, sweep=-60, square=True)   # into the lava
T([330, 262], B['topple'] + 0.5, 0.1, 0.18)                                                   # OOF
T([1047, 1319, 1568], B['maxRespawn'], 0.08, 0.12)                                           # respawn shimmer
# The tiny door, can't fit, shrink = reset.
A('swish_1', B['peek'], 0.35); T(300, B['peek'] + 0.1, 0.06, 0.6, sweep=-150)
T([1568], W['tinyDoor'], 0.06, 0.08); T([1319], W['tinyDoor'] + 0.1, 0.06, 0.08)
T([150], W['fit'] - 0.05, 0.14, 0.4, square=True)                                             # buzzer
A('drum_hit', W['shrink'] - 0.1, 0.3); T([392, 523], W['shrink'] - 0.05, 0.08, 0.2)
# He sits (heavy), on Checkpoint 20.
thud(B['sitDown'], SIZE(50), 0.5); T([784, 1047, 1319], B['sitDown'] + 0.05, 0.1, 0.12)
T([196, 185], W['nobody'] - 0.1, 0.12, 0.3, square=True)                                      # BLOCKED
# The bait.
typing(B['typed'][0], B['typed'][1], 0.13, 0.07); A('click', B['typed'][1] + 0.05, 0.35)
T([659], W['say'] + 0.05, 0.08, 0.08); A('click', W['say'] + 0.05, 0.25)                       # "watch me"
thud(B['standUp'] + 0.35, SIZE(50), 0.4)
# 51 -> 98 (fast-forward), 99 (crack), 100 (break), the fall.
montage(B['mont2'][0], B['mont2'][1], 50, 98)
pop(B['hop99'], 98, 0.16); thud(B['landed99'], SIZE(99), 0.6); A('impact_2', B['landed99'] + 0.02, 0.5)
A('impact_3', W['cracked'] - 0.05, 0.45); T(1800, W['cracked'] - 0.05, 0.06, 0.25, sweep=-4000)       # CRACK
for i in range(8): T(1100 - i * 60, B['hop100'] - 0.6 + i * 0.06, 0.04, 0.05, square=True)              # tension
pop(B['hop100'], 99, 0.18)
A('impact_4', B['break'], 0.6); A('impact_3', B['break'] + 0.03, 0.5); A('drum_hit', B['break'], 0.5); T(55, B['break'], 0.22, 0.8, square=True)
for i in range(6): A('impact_%d' % (1 + i % 4), B['break'] + 0.15 + i * 0.12, 0.2)               # chunks
A('swish_4', B['break'] + 0.3, 0.45); T(700, B['break'] + 0.3, 0.1, 1.6, sweep=-350)               # falling
T([392, 330, 262], W['fell'] - 0.1, 0.1, 0.25)
# Door clear; Max goes giant and stomps over.
T([784, 1047], W['clear'] - 0.15, 0.1, 0.12)
montage(B['mont3'][0], B['mont3'][1], 0, 50)
per = 14.5 * SIZE(50) / 52 * 0.67 / 2; t = B['maxWalk'] + 0.3
while t < B['maxWalk'] + 131 / 52: thud(t, SIZE(50), 0.45); t += per
# Leo respawns at Checkpoint 20, tiny again.
T([1047, 1319, 1568, 2093], B['leoRespawn'], 0.1, 0.12); A('swish_1', B['leoRespawn'], 0.25)
T([1568, 2093], W['tinyAgain'] - 0.1, 0.08, 0.1)
T([523, 494, 466, 440], W['shrunk'] - 0.2, 0.06, 0.18)                                         # Max's realisation
A('drum_hit', W['free'] - 0.2, 0.35)
# Walks in, grabs the trophy, the victory jump.
for i in range(5): A('click', B['walkIn'] + 0.1 + i * 0.16, 0.08)
T([784, 988, 1175, 1568], B['grab'], 0.16, 0.16); A('impact_1', B['grab'], 0.3)
pop(B['vhop'], 1, 0.2); A('impact_4', B['vhop'] + 0.06, 0.5); A('impact_2', B['vhop'] + 0.08, 0.4); T(90, B['vhop'] + 0.06, 0.16, 0.35, square=True)
T([220, 208], W['small'] - 0.1, 0.12, 0.4, square=True)                                     # uh oh: stuck
# Next game teaser + call to action.
A('swish_3', W['nextGame'] - 0.25, 0.35); T([523, 659, 784, 1047], W['nextGame'] - 0.1, 0.1, 0.1)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
