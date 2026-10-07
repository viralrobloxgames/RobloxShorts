#!/usr/bin/env python3
"""Ch09 SFX cues -> source/sound/ch09.json, timed on audio/chapters/ch09/lines.json (same key times as web/ch09.js; falls
back to the clip's estimates). Run after every narration change: python3 source/sound/ch09_cues.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 5.4), (5.7, 10.3), (10.6, 12.0), (12.3, 14.0), (14.35, 16.3), (16.6, 17.4), (17.75, 21.1), (21.4, 24.0),
       (25.1, 25.9), (26.15, 29.6), (29.9, 32.6), (32.9, 34.7), (35.0, 36.6), (36.9, 43.0), (43.3, 44.3), (44.6, 46.4),
       (47.95, 49.7), (50.0, 50.5), (50.8, 52.1), (52.45, 55.6), (55.9, 56.6)]
lf = P / 'audio/chapters/ch09/lines.json'
if lf.is_file():
    lj = json.loads(lf.read_text())
    lines = [x for x in (lj if isinstance(lj, list) else lj['lines']) if x.get('speaker') and x.get('text')]
    rows = [(x['start'], x['end']) for x in sorted(lines, key=lambda x: x['start'])]
else:
    rows = EST
at = lambda i, off=0: rows[i][0] + off          # 0-based, as in web/ch09.js
end = lambda i, off=0: rows[i][1] + off
WALK = at(7, 0.55); LID_OPEN = WALK + 1.45; PICK = LID_OPEN + 0.95; LILY_WALK = at(8, 0.2)
BACK = end(15, 0.55); LID_CLOSE = at(16, 0.75); SHEET_UP = LID_CLOSE + 0.25
LENGTH = end(20) + 0.75

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
# afternoon outside the round window: faint birds under the whole chapter (in 5 s pieces)
s = 0.0
while s < LENGTH - 0.5:
    cue('birds', s, 0.035, dur=round(min(5.0, LENGTH - s), 3)); s += 4.9
# scissors snipping in the nest (under the VO and "step one")
s = 0.4
while s < at(1, 1.6):
    cue('click', s, 0.05); s += 0.7
# Lily's "No, Dad!" lean: the rocking chair creaks once
cue('door_creak', at(5, -0.1), 0.05, dur=0.6)
# Skye walks to MAX - OLD STUFF; the flaps open; the paper
s = WALK + 0.1
while s < LID_OPEN - 0.2:
    cue('footstep', s, 0.08); s += 0.45
cue('swish_1', LID_OPEN, 0.10)
cue('swish_1', PICK + 0.1, 0.06)
# Lily comes over
s = LILY_WALK + 0.1
while s < LILY_WALK + 1.6:
    cue('footstep', s, 0.05); s += 0.4
# the drawing goes back, the flaps close, the sheet comes up
cue('swish_1', BACK + 0.1, 0.05)
cue('plop', LID_CLOSE + 0.25, 0.08)
cue('whoosh', SHEET_UP + 0.1, 0.10)

cues.sort(key=lambda c: c['start'])
(P / 'source/sound/ch09.json').write_text(json.dumps(cues, indent=1) + '\n')
print(f'{len(cues)} cues, chapter {LENGTH:.2f} s')
