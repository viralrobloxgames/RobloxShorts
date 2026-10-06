"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T / SNAP / POP_T / DROP / SNAG / DARK in web/chair_clip.js. A pop on the opening title, the rope
snapping (clang + pop) and a whoosh up, a wind bed while he is high up, rising dings as the altitude counter passes
1,000 / 5,000 / 16,000 ft, frost crackle on FREEZING, a buzz on PILOT? REJECTED, the jet whooshing past, radar pings in
the tower, three balloon pops, the gun falling, a zap at the power line and a power-down at the blackout, crickets in
the dark, a siren, press-camera flashes, a typewriter and stamp for the fine, a chime and applause in the museum.
SFX in audio/sfx/ are copied from The Tornado Came Back (siren, radar_ping, typewriter, buzz), Every Lie Comes True
(glass, clang, flutter, thud), He Stole The Mona Lisa (crickets, applause), Copy the Crown (whoosh, pop, chime, fanfare,
boing), Lightning Hit Him Seven Times (zap) and assets/audio/horror/forest_wind.wav (wind)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
SNAP = W['snaps'] + 0.05
POP_T = [W['pops'] + 0.05, W['few'] + 0.05, W['starts'] + 0.05]
DROP = W['drops'] + 0.08
SNAG, DARK = W['lines'] - 0.05, W['dark'] - 0.05
T = dict(climb=W['thousand1'] - 0.12, lines=W['drifts'] - 0.1, police=W['lands'] - 0.1, press=W['reporters'] - 0.1,
         fined=W['fined'] - 0.1, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})

S('pop', 0.05, 0.35); S('chime', W['balloons1'] - 0.1, 0.3)                       # A LAWN CHAIR + 42 BALLOONS
A('swish_1', W['plan'] - 0.1, 0.25)
S('clang', SNAP - 0.02, 0.45); S('pop', SNAP, 0.4); S('whoosh', SNAP + 0.1, 0.5)   # the rope snaps; up he goes
t = T['climb']
while t < T['lines']:                                                             # wind, high up
    S('wind', t, 0.16, dur=min(8.0, T['lines'] - t + 0.3)); t += 7.8
for k, f in (('thousand1', [880, 1175]), ('five', [988, 1319]), ('sixteen', [1175, 1568])): TN(f, W[k] - 0.05, 0.06, 0.14)
S('glass', W['freezing'] - 0.1, 0.3)                                              # FREEZING
S('buzz', W['enough'] - 0.05, 0.35); A('impact_3', W['enough'], 0.3)              # PILOT? REJECTED
S('pop', W['sandwiches'], 0.25); S('clang', W['pellet'] + 0.1, 0.25)              # the sandwich, the pellet gun
S('whoosh', W['two'] - 0.2, 0.5); S('flutter', W['airline'], 0.2)                 # the jet goes past
for k in ('radio', 'tower1', 'passed'): S('radar_ping', W[k] - 0.05, 0.3)
for t in POP_T: S('pop', t, 0.6); A('impact_1', t, 0.15)                           # three balloons
S('flutter', POP_T[-1] + 0.2, 0.25)                                               # starts to sink
A('swish_3', DROP, 0.35); S('boing', DROP + 0.9, 0.12)                            # the gun falls away
S('zap', SNAG, 0.55); S('thud', SNAG + 0.05, 0.3)                                 # caught on the power line
S('buzz', DARK - 0.1, 0.4, dur=0.6); A('impact_2', DARK, 0.35)                    # BLACKOUT
S('crickets', DARK + 0.4, 0.15, dur=T['police'] - DARK - 0.2)
S('siren', T['police'] - 0.1, 0.25); S('siren', T['police'] + 3.1, 0.15, dur=1.0)
for f in (W['reporters'] + 0.2, W['why'] + 0.1, W['around'] + 0.2): S('pop', f, 0.3); TN([2349], f, 0.04, 0.08)   # camera flashes
S('whoosh', T['fined'], 0.35); S('typewriter', T['fined'] + 0.3, 0.3); A('impact_3', W['fined'] + 0.15, 0.35)    # the notice, FINED
TN([1319, 1568], W['lawn3'] - 0.1, 0.05, 0.14)                                    # AIRCRAFT: LAWN CHAIR
S('whoosh', W['never'], 0.25); A('impact_3', W['pilot'] - 0.2, 0.35)              # NEVER A PILOT
S('chime', W['museum'] - 0.4, 0.35); S('applause', W['museum'] - 0.2, 0.2)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
