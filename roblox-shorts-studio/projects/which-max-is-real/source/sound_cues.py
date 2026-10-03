"""Writes source/sound_cues.json from web/timeline.js (run after source/beats.py). Sounds caused by the action; the
heartbeat, drones, risers and stingers are in the score (source/score.py -> audio/score.wav, the finish music bed)."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
E = json.loads(subprocess.run(['node', '-e', "import('./web/timeline.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
H = lambda a, t, g=0.35: A('horror/' + a, t, g)
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})

H('entity_connect', 0.05, 0.5)                                                 # frame 1: two Maxes
T([880, 880], E['sync'], 0.05, 0.08)                                           # 0.0s delay
H('latch', E['lightOn'], 0.6); H('torch_click', E['lightOn'] + 0.02, 0.5)       # Mia's light slams on
T([523, 659], E['lightOn'] + 0.3, 0.06, 0.12)                                  # joined
T(300, W['mirrors'], 0.06, 0.6, sweep=300)                                     # MIRROR
A('swish_1', E['raise'], 0.3); A('swish_1', E['raise'] + 0.02, 0.25)          # hands up, together
T([988], W['leftMax'], 0.08, 0.12); T([392], W['raisedLeft'], 0.08, 0.25, square=True)   # right ok / left wrong
T([784, 988, 1319], W['saidLeft'], 0.07, 0.12)                                 # if you said left
T(260, E['tilt'], 0.07, 0.5, sweep=-120)                                       # its head tips over (creak)
H('entity_connect', E['tilt'] + 0.35, 0.5)
A('swish_4', E['lunge'], 0.6); H('footstep', E['lunge'] + 0.05, 0.5); H('footstep', E['lunge'] + 0.13, 0.5)   # the lunge
A('swish_3', E['jump'] + 0.05, 0.4); A('impact_2', E['land'], 0.55); H('footstep', E['land'], 0.55)
for t in E['steps'] + [E['last']]:
    H('footstep', t + 0.12, 0.5); H('footstep', t + 0.16, 0.4)                # step... both
    H('torch_click', t + 0.22, 0.45); H('radio_static', t + 0.24, 0.08)       # a light dies
H('radio_static', E['fight'] + 0.55, 0.3)                                      # it fights the mirror
for i in range(4): H('footstep', E['sprint'] + 0.05 + i * 0.15, 0.5)           # Max sprints back
H('door_creak', E['pull'] + 0.4, 0.35)                                         # dragged, scraping
A('impact_4', E['through'], 0.6)                                               # through the doorway
A('impact_1', E['fall'], 0.6)                                                  # it hits the corridor floor
for i in range(3): H('footstep', E['through'] - 0.9 + i * 0.25, 0.4)          # Mia runs for the door
A('impact_4', E['slam'], 0.8); H('latch', E['slam'] + 0.04, 0.8)               # SLAM
A('impact_1', E['rattle'][0], 0.7); H('latch', E['rattle'][0] + 0.05, 0.5)     # it tries the door
A('impact_1', E['rattle'][0] + 0.32, 0.55); H('latch', E['rattle'][0] + 0.37, 0.4)
A('click', W['updated'], 0.3); H('disconnect', E['gone'] - 0.05, 0.6)         # it's gone
T([660, 523], W['two2'], 0.05, 0.15)
H('room_hum', E['nothing'] - 0.5, 0.35)                                        # nothing waves back: just the hum
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1))
print(len(c), 'cues')
