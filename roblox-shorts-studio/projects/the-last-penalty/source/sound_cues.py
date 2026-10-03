"""Writes source/sound_cues.json from web/timeline.js (run after source/beats.py). Sounds caused by the action; the
crowd, pulse, heartbeat, risers and stingers are in the score (source/score.py -> audio/score.wav, the finish music)."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
E = json.loads(subprocess.run(['node', '-e', "import('./web/timeline.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
H = lambda a, t, g=0.35: A('horror/' + a, t, g)
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
whistle = lambda t, d: [T([2850, 3020], t + i * 0.06, 0.05, 0.05) for i in range(int(d / 0.06))]   # pea trill

A('impact_1', 0.05, 0.4)                                                       # frame 1
for k in E['replayKicks']:
    A('drum_hit', k, 0.35); A('swish_2', k + 0.05, 0.3)                        # replay kicks, into the net
T([1319, 1760], W['looks'] + 0.2, 0.05, 0.12)                                  # he looks at the corner
T([1568], E['flick'] + 0.05, 0.07, 0.15)                                       # his eyes flick
A('swish_4', E['dive1'], 0.5)                                                  # she dives early
A('drum_hit', E['kick1'], 0.45)                                                # kick 1 (slow motion)
A('impact_2', E['hit1'], 0.6); A('swish_1', E['hit1'] + 0.05, 0.4)             # glove slaps it wide
A('impact_3', E['ballOut'], 0.2)                                               # ball off the boards
for i in range(6): H('footstep', E['storm'] + 0.1 + i * 0.16, 0.35)            # the team storms on
whistle(E['whistle'], 0.9)                                                     # TWEEEET
H('shutter', E['freeze'][0], 0.35)                                             # replay freeze
T([330, 262], W['retake'], 0.07, 0.35, square=True)                            # retake
H('shutter', E['freeze'][1], 0.25)
T(220, E['close'], 0.05, 0.6, sweep=-80)                                       # he closes his eyes
whistle(W['runs'] - 0.6, 0.35)                                                 # short whistle: take it
for i in range(int((E['kick2'] - E['run2']) / 0.3)): H('footstep', E['run2'] + 0.05 + i * 0.3, 0.45)
A('impact_4', E['kick2'], 0.55); H('leaves_step', E['kick2'] + 0.02, 0.5)     # THUD: boot into turf
for i in range(5): H('leaves_step', E['roll'] + 0.8 + i * 0.9, 0.12 - i * 0.015)   # the slow roll on the grass
A('click', E['boot'], 0.5); A('impact_1', E['boot'] + 0.01, 0.2)               # stops against her boot
T([523, 659, 784], E['celebrate'], 0.05, 0.3)                                  # champions
T([988, 1319], W['follow'], 0.05, 0.12)                                        # follow card
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
