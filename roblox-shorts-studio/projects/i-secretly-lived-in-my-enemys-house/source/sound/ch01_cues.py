#!/usr/bin/env python3
"""Ch01 SFX cues -> source/sound/ch01.json, timed on audio/chapters/ch01/lines.json (same key times as web/ch01.js;
falls back to the clip's estimates). Run after every narration change: python3 source/sound/ch01_cues.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 4.8), (5.05, 7.4), (8.65, 10.0), (10.85, 12.5), (12.85, 17.4), (17.65, 21.7), (21.95, 25.4), (26.45, 28.9),
       (29.15, 32.1), (32.35, 36.2), (36.45, 38.9), (39.15, 44.7), (44.95, 46.4), (46.65, 48.4), (48.75, 56.0), (56.35, 57.4),
       (57.65, 59.3), (59.55, 62.6), (62.85, 64.5), (65.55, 66.5)]
lf = P / 'audio/chapters/ch01/lines.json'
if lf.is_file():
    lj = json.loads(lf.read_text())
    lines = [x for x in (lj if isinstance(lj, list) else lj['lines']) if x.get('speaker') and x.get('text')]
    by = {x.get('index', i + 1): x for i, x in enumerate(lines)}
else:
    by = {i + 1: {'start': a, 'end': b} for i, (a, b) in enumerate(EST)}
# 0-based script lines, as in web/ch01.js
at = lambda i, off=0: by[i + 1]['start'] + off
end = lambda i, off=0: by[i + 1]['end'] + off
DOOR_OPEN, DOOR_SHUT, CLASS, SPIDER, JUMP = end(1, 0.15), end(2, 0.1), at(4, -0.35), end(6, 0.2), at(7, -0.05)
EXIT, DUSK, LUMP = at(13, 0.3), at(14, -0.35), end(18, 0.15)
# as web/ch01.js: path_mid -> path_near (+0.6 s look round) -> porch_step -> back_door at 8 studs/s, then the door opens
_legs = [(-2, 0, 12), (3.8, 0, 1.5), (6, 0.6, -5.8), (6, 0.6, -7.2)]
_d = sum(sum((a - b) ** 2 for a, b in zip(_legs[i], _legs[i + 1])) ** 0.5 for i in range(3))
BACKDOOR = DUSK + 0.1 + _d / 8 + 0.6 + 0.15
NIGHT = min(BACKDOOR + 0.8, at(15, -1.0))
LENGTH = end(19) + 0.8

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
steps = lambda t0, t1, gain, gap=0.5: [cue('footstep', t0 + k * gap, gain) for k in range(int((t1 - t0) / gap) + 1)]
# night room tone under the closet scene
cue('night_bed', 0.0, 0.10, dur=round(CLASS, 3))
# Max creeping at the closet (two legs of the walk), the doors swing open, the beam sweep, the doors shut, back to bed
steps(0.0, 0.9, 0.08); steps(at(1, -1.4), at(1, -0.4), 0.08)
cue('door_creak', DOOR_OPEN, 0.3)
cue('swish_1', DOOR_OPEN + 0.35, 0.08)
cue('latch', DOOR_SHUT + 0.38, 0.25)
steps(DOOR_SHUT + 0.3, DOOR_SHUT + 1.3, 0.07)
# the classroom at lunch: chatter under the scene, the spider plops into the lunchbox, Skye jumps up, Max walks off
cue('crowd', CLASS, 0.07, dur=round(DUSK - CLASS, 3))
cue('plop', SPIDER + 0.26, 0.35)
cue('whoosh', JUMP, 0.18)
steps(EXIT, EXIT + 1.6, 0.08, 0.45)
# dusk: birds, her sneaking steps up the path, the unlocked back door opens and clicks shut behind her
cue('birds', DUSK, 0.06, dur=round(NIGHT - DUSK, 3))
steps(DUSK + 0.2, BACKDOOR - 0.9, 0.06, 0.55)
cue('door_creak', BACKDOOR, 0.22)
cue('latch', BACKDOOR + 0.75, 0.2)
# night again: three knocks inside the closet, the blanket yanked over his head, the closet door creaks open a crack
cue('night_bed', NIGHT, 0.10, dur=round(LENGTH - NIGHT, 3))
for k in (0.2, 0.45, 0.7):
    cue('latch', NIGHT + k + 0.08, 0.3)
cue('whoosh', LUMP + 0.05, 0.16)
cue('door_creak', LUMP + 0.35, 0.12, dur=0.6)

out = P / 'source/sound/ch01.json'
out.write_text(json.dumps(cues, indent=1))
print(f'{len(cues)} cues -> {out.relative_to(P)} (lines from {"lines.json" if lf.is_file() else "estimates"}); length {LENGTH:.2f}s')
