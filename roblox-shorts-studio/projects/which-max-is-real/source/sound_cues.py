"""Writes source/sound_cues.json from web/timeline.js (run after source/beats.py), so the SFX follow the narration.
Same three layers as Part 1: the night bed (finish.music), sounds caused by the action, the Unlisted's motif."""
import json, subprocess
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
E = json.loads(subprocess.run(['node', '-e', "import('./web/timeline.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
H = lambda a, t, g=0.35: A('horror/' + a, t, g)
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
thump = lambda t, g=0.5: T(52, t, g, 0.16, sweep=-60)

H('entity_connect', 0.05, 0.55); thump(0.05, 0.6)                              # frame 1: two Maxes
T([880, 880], E['sync'], 0.05, 0.08)                                           # 0.0s delay
H('latch', E['lightOn'], 0.5); H('reveal_hit', E['lightOn'] + 0.05, 0.5)      # Mia in the light
T([523, 659], E['lightOn'] + 0.3, 0.06, 0.12)                                  # joined
T(300, W['mirrors'], 0.06, 0.6, sweep=300)                                     # MIRROR
A('swish_1', E['raise'], 0.3); A('swish_1', E['raise'] + 0.02, 0.25)          # hands up, together
T([988], W['leftMax'], 0.08, 0.12); T([392], W['raisedLeft'], 0.08, 0.25, square=True)   # right ok / left wrong
H('tension_rise', W['star'] - 0.3, 0.35)
T([784, 988, 1319], W['saidLeft'], 0.07, 0.12)                                 # if you said left
T(320, E['headTurn'], 0.06, 0.6, sweep=-200); H('entity_connect', E['headTurn'] + 0.4, 0.5)   # the head turns all the way
for i in range(3): H('footstep', E['stalk'] + i * 0.2, 0.4)
A('swish_4', E['jump'], 0.45); A('impact_2', E['land'], 0.45); H('footstep', E['land'], 0.5)
for t in E['steps']: H('footstep', t + 0.12, 0.45); H('footstep', t + 0.16, 0.38); thump(t, 0.6)   # step... both
H('footstep', E['last'] + 0.12, 0.45); thump(E['last'], 0.7)
H('radio_static', E['fight'], 0.3); H('tension_rise', E['fight'], 0.55)       # it fights the mirror
t = E['fight'] + 0.4
while t < E['sprint'] - 0.2: thump(t, 0.5); t += 0.55
A('swish_4', E['sprint'], 0.5)
t = E['sprint'] + 0.1
for i in range(4): H('footstep', t + i * 0.18, 0.45)
A('impact_4', E['through'], 0.55); H('door_creak', E['through'], 0.4)         # through the doorway
A('impact_1', E['fall'], 0.6); A('drum_hit', E['fall'], 0.4)                   # it hits the lobby floor
A('impact_4', E['slam'], 0.7); H('latch', E['slam'] + 0.04, 0.7); thump(E['slam'], 0.8)   # SLAM
A('click', W['updated'], 0.3); H('disconnect', E['gone'] - 0.05, 0.6)         # it's gone
T([660, 523], W['two2'], 0.05, 0.15)
H('room_hum', E['nothing'] - 0.5, 0.35)                                        # nothing waves back: just the hum
H('entity_connect', E['nothing'] + 1.0, 0.25)                                  # ...or almost nothing
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1))
print(len(c), 'cues')
