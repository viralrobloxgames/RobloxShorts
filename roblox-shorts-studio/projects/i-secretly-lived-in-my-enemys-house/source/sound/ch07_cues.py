#!/usr/bin/env python3
"""Ch7 SFX cues -> source/sound/ch07.json, timed on audio/chapters/ch07/lines.json (the same key times as T in
web/ch07.js; falls back to the clip's estimates). Run after every narration change: python3 source/sound/ch07_cues.py"""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 4.6), (4.85, 7.3), (7.55, 9.1), (9.35, 10.0), (10.85, 13.8), (14.65, 17.9), (18.15, 20.5), (20.75, 22.6),
       (22.85, 26.6), (26.85, 28.4), (28.65, 32.9), (33.15, 35.9), (36.95, 39.8), (40.05, 42.8), (43.05, 44.1), (44.35, 48.6),
       (49.45, 52.4), (52.65, 54.8), (56.25, 58.1), (58.35, 60.2), (61.25, 62.6), (62.85, 64.3), (64.55, 67.0), (67.25, 67.9)]
d = P / 'audio/chapters/ch07'
if (d / 'lines.json').is_file():
    by = {x['index']: x for x in json.loads((d / 'lines.json').read_text())['lines']}
else:
    by = {i + 1: {'start': a, 'end': b} for i, (a, b) in enumerate(EST)}
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
# key times: keep in step with times() in web/ch07.js
T = dict(lidLift=at(1, 3.6), goDecor=at(4, 0.45), jam=end(4, 0.95), dadRise=end(5, 0.05), dadOut=at(6, 0.7), dadWalk1=at(9, 0.3),
         dadWalk2=at(11, 1.5), nozzle=at(16, 1.6), hum=end(16, 0.15), humOff=at(17, 0.05), dadGo=end(18, -0.5),
         dadDown=end(18, 0.25), maxUp=end(18, 0.55), maxOut=at(19, -0.45), fix=at(19, 1.6), maxGo=end(20, 0.05),
         maxDown=end(20, 1.65), lilyCome=at(21, -0.2), lilyBack=end(5))
LENGTH = max(x['end'] for x in by.values()) + 0.75

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
def steps(t0, t1, every, gain):
    s = t0
    while s < t1: cue('footstep', s, gain); s += every
# the hatch rattles from frame 0 (the clip jiggles the lid while sin(2.7 t) > 0.2), then creaks open a crack
for t in (0.12, 0.42, 0.78, 2.45, 2.75, 3.1): cue('latch', t, 0.16)
cue('door_creak', T['lidLift'], 0.22)
steps(T['goDecor'] + 0.1, T['goDecor'] + 1.0, 0.18, 0.06)        # both girls run to the decorations
cue('swish_1', T['jam'] - 0.2, 0.10); cue('plop', T['jam'], 0.18)  # the bucket goes on her head
steps(T['lilyBack'] + 0.05, T['lilyBack'] + 0.9, 0.16, 0.05)     # Lily runs back to the tea box
cue('door_creak', T['dadRise'] - 0.1, 0.30)                      # the hatch swings right open
steps(T['dadRise'] + 0.2, T['dadOut'], 0.4, 0.09)                # Dad up the ladder
steps(T['dadOut'] + 0.1, T['dadOut'] + 0.6, 0.35, 0.09)
steps(T['dadWalk1'], T['dadWalk1'] + 0.55, 0.35, 0.08)
steps(T['dadWalk2'], T['dadWalk2'] + 0.45, 0.35, 0.08)
cue('torch_click', T['hum'] - 0.05, 0.25)                        # the vacuum switches on...
cue('room_hum', T['hum'], 0.55, dur=round(T['humOff'] - T['hum'] + 0.08, 3))
cue('torch_click', T['humOff'], 0.22)                            # ...and off when Max shouts
steps(T['dadGo'], T['dadGo'] + 0.7, 0.2, 0.08)                 # Dad to the hatch and down
steps(T['dadDown'], T['maxUp'], 0.3, 0.07)
steps(T['maxUp'], T['maxUp'] + 0.5, 0.3, 0.07)                   # Max up
steps(T['maxOut'], T['maxOut'] + 0.95, 0.35, 0.07)
cue('swish_1', T['fix'] - 0.1, 0.07)                             # he straightens the pumpkin
steps(T['maxGo'], T['maxGo'] + 0.95, 0.35, 0.07)                 # Max back to the hatch and down
steps(T['maxDown'], T['maxDown'] + 0.6, 0.3, 0.06)
steps(T['lilyCome'], T['lilyCome'] + 0.8, 0.3, 0.05)             # Lily walks over to Skye
(P / 'source/sound/ch07.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
sfx = P / 'audio/sfx'; sfx.mkdir(parents=True, exist_ok=True)
lib = P.parents[1] / 'assets/audio'
for a in {c['asset'][4:-4] for c in cues}:
    src = lib / 'horror' / f'{a}.wav'
    if not src.is_file(): src = lib / f'{a}.wav'
    if not src.is_file(): src = sfx / f'{a}.wav'
    if not (sfx / f'{a}.wav').is_file(): shutil.copy(src, sfx / f'{a}.wav')
print(len(cues), 'cues, length', round(LENGTH, 2))
