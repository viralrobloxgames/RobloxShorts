#!/usr/bin/env python3
"""Ch10 SFX cues -> source/sound/ch10.json, timed on audio/chapters/ch10/lines.json (same key times as web/ch10.js;
falls back to the clip's estimates). Run after every narration change: python3 source/sound/ch10_cues.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 6.0), (6.25, 8.25), (9.3, 12.5), (12.75, 16.25), (16.5, 22.8), (23.85, 26.45), (26.7, 29.7), (29.95, 33.65),
       (33.9, 38.2), (38.45, 45.45), (45.7, 50.9), (51.15, 55.45), (55.7, 57.9), (58.15, 61.15), (61.4, 65.1), (66.35, 68.75),
       (69.0, 69.7), (69.95, 70.65)]
lf = P / 'audio/chapters/ch10/lines.json'
if lf.is_file():
    lj = json.loads(lf.read_text())
    lines = [x for x in (lj if isinstance(lj, list) else lj['lines']) if x.get('speaker') and x.get('text') and x.get('kind') != 'action' and x.get('type') != 'action']
    by = {x.get('index', i + 1): x for i, x in enumerate(lines)}
else:
    by = {i + 1: {'start': a, 'end': b} for i, (a, b) in enumerate(EST)}
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
CLICK, PULL, SMILES, HANDLE = end(2, 0.25), end(5, 0.08), end(15), end(16, -0.9)
LENGTH = end(18) + 0.9

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
# night room tone under the dark entrance, fading out with the lamp click
cue('night_bed', 0.0, 0.10, dur=round(CLICK + 0.3, 3))
# the door creaks open (frame 0), soft creeping steps, the door clicks shut behind her (clip: shut 2.4-3.0 s)
cue('door_creak', 0.0, 0.32)
s = 0.35
while s < 2.6:
    cue('footstep', s, 0.10); s += 0.62
cue('latch', 2.95, 0.22)
# the lamp click: the reveal
cue('torch_click', CLICK, 0.45)
# the sheet whipped off
cue('whoosh', PULL - 0.05, 0.22)
# Max swings onto the bed edge and puts the plate down (clip: plate down at T.edge + 0.6)
cue('glass', at(8, 0.15) + 0.6, 0.06, dur=0.4)
# Dad's footsteps in the hallway, then the handle rattles
s = SMILES + 0.25
while s < at(16) + 1.2:
    cue('footstep', s, 0.18); s += 0.55
cue('latch', HANDLE, 0.3); cue('latch', HANDLE + 0.35, 0.22)

cues.sort(key=lambda c: c['start'])
(P / 'source/sound/ch10.json').write_text(json.dumps(cues, indent=1) + '\n')
print(f'{len(cues)} cues, chapter {LENGTH:.2f} s')
