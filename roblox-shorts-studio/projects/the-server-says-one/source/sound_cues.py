"""Writes source/sound_cues.json from web/timeline.js (run after source/beats.py), so the SFX follow the narration and
the chase's slow-motion windows. Three layers: the night bed (finish.music), sounds caused by the action, and the
Unlisted's two-note connection motif."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
E = json.loads(subprocess.run(['node', '-e', "import('./web/timeline.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
H = lambda a, t, g=0.35: A('horror/' + a, t, g)
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
thump = lambda t, g=0.5: T(52, t, g, 0.16, sweep=-60)                      # heartbeat / low hit

H('entity_connect', 0.05, 0.55); thump(0.05, 0.6)                           # frame 1: the motif
for t in (W['noName'], W['noFace']): thump(t, 0.25)
T([880, 1320], W['light'], 0.05, 0.25)                                     # the chest light
H('footstep', E['step'], 0.35); H('footstep', E['copyStep'], 0.3)           # steps, copied late
H('footstep', E['back'], 0.3); H('footstep', E['copyBack'], 0.3)
for t in E['creeps']: H('footstep', t, 0.42); H('footstep', t + 0.17, 0.3)  # it creeps closer
T(196, E['copyWave'], 0.05, 0.4, sweep=-40); T(196, E['copyStep'], 0.05, 0.4, sweep=-40)
H('tension_rise', W['copying'] - 0.4, 0.5)
H('reveal_hit', W['door'], 0.3)                                             # the door behind it
H('tension_rise', W['seen'] - 2.6, 0.6)
A('swish_2', E['lunge'] - 0.05, 0.35); H('footstep', E['lunge'] + 0.1, 0.4)  # the fake
A('swish_3', E['copyLunge'] - 0.05, 0.3); H('footstep', E['copyLunge'] + 0.12, 0.35)
A('swish_4', E['cut'], 0.45)
t = E['cut'] + 0.2
while t < E['barge'] - 0.2: thump(t, 0.55); thump(t + 0.18, 0.32); t += 0.8   # slow-motion heartbeat
H('entity_connect', E['copyRun'], 0.45)
A('impact_2', E['barge'], 0.55); H('door_creak', E['barge'], 0.5)           # shoulder barge
A('impact_4', E['slam'], 0.6); H('latch', E['slam'] + 0.04, 0.6)            # SLAM
T(320, E['freeze'] + 0.1, 0.05, 0.55, sweep=-180)                           # its head turns
for i in range(5): H('footstep', E['copyCharge'] + i * 0.2, 0.45)
H('reveal_hit', E['hit'], 0.9); A('impact_1', E['hit'], 0.7); A('drum_hit', E['hit'], 0.6); thump(E['hit'], 0.8)
A('click', W['checked'] + 0.1, 0.35)                                        # the player list
H('disconnect', W['two'] - 0.25, 0.55); H('radio_static', W['two'] - 0.2, 0.18); H('entity_connect', W['two'] + 0.1, 0.6)
T([660], W['max1'], 0.05, 0.08); H('latch', E['copyOn'], 0.45); H('reveal_hit', W['max2'], 0.8); thump(W['max2'], 0.7)
T(240, E['dark'][0], 0.12, 0.7, sweep=-260); H('disconnect', E['dark'][0], 0.4)    # lights out
thump(E['dark'][0] + 0.9, 0.5)
H('latch', E['twins'], 0.6); H('reveal_hit', E['twins'] + 0.02, 0.85); thump(E['twins'], 0.8)   # lights back: two of him
H('entity_connect', E['sync'], 0.55); A('swish_1', E['sync'], 0.25)                # both heads turn at once
T([880], E['left'], 0.08, 0.1); T([660], E['right'], 0.08, 0.1)                    # LEFT / RIGHT
A('click', E['comment'], 0.3)
H('entity_connect', E['cta'] + 0.6, 0.35)
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1))
print(len(c), 'cues')
