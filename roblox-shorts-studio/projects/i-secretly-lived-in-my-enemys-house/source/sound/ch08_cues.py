#!/usr/bin/env python3
"""Ch8 SFX cues -> source/sound/ch08.json, timed on audio/chapters/ch08/lines.json (same key times as web/ch08.js;
falls back to the clip's estimates). Run after every narration change: python3 source/sound/ch08_cues.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 6.4), (6.7, 12.3), (13.2, 15.2), (15.5, 17.2), (17.5, 19.0), (19.9, 22.0), (22.4, 24.4), (24.7, 27.2),
       (27.5, 28.4), (28.7, 31.0), (31.3, 32.4), (32.7, 35.8), (36.1, 41.6), (41.9, 47.4), (47.7, 50.6), (50.9, 52.6),
       (52.9, 53.8), (54.1, 55.5), (55.8, 59.0)]
lf = P / 'audio/chapters/ch08/lines.json'
if lf.is_file():
    lj = json.loads(lf.read_text())
    lines = [x for x in (lj if isinstance(lj, list) else lj['lines']) if x.get('speaker') and x.get('text')]
    by = {x.get('index', i + 1): x for i, x in enumerate(lines)}
else:
    by = {i + 1: {'start': a, 'end': b} for i, (a, b) in enumerate(EST)}
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
CROUCH, RISE, ATTIC = end(2, 0.1), end(5, 0.05), end(6, 0.3)
WALK0 = end(7, 0.75)
LENGTH = end(19) + 0.8

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
# hallway / Max's room: night room tone
cue('night_bed', 0.0, 0.09, dur=round(ATTIC, 3))
cue('footstep', CROUCH + 0.05, 0.08)                 # she kneels at the door (a floorboard)
cue('swish_1', RISE + 0.12, 0.10)                    # the note crumples in her fist
cue('footstep', RISE + 0.45, 0.08); cue('footstep', RISE + 0.75, 0.07)   # backs away
cue('footstep', RISE + 1.05, 0.07)
# attic at night: hum under it, the hatch creaks as Lily comes up, her steps to the nest
cue('room_hum', ATTIC, 0.06, dur=round(LENGTH - ATTIC, 3))
cue('door_creak', ATTIC + 0.05, 0.18)
s = WALK0 + 0.15
while s < WALK0 + 14.8 / 12:
    cue('footstep', s, 0.05); s += 0.42
json.dump(cues, open(P / 'source/sound/ch08.json', 'w'), indent=1)
print(len(cues), 'cues, chapter length', round(LENGTH, 2))
