#!/usr/bin/env python3
"""Ch4 SFX cues -> source/sound/ch04.json, timed on audio/chapters/ch04/lines.json (same key times as T in web/ch04.js;
falls back to the clip's estimate). Run after every narration change: python3 source/sound/ch04_cues.py
Lunchroom murmur under the whole chapter (crowd.wav, low, tiled), Max's steps over and back, the cookie put down on her
desk, a soft swish on the half-sandwich hand-off, his chair, a small pop on "Stop it, face."."""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
ROOT = P.parents[1]
SCRIPT = [('VO', 20, 0), ('MAX', 9, 0), ('SKYE', 4, 0), ('MAX', 4, 0), ('SKYE', 4, 0), ('MAX', 5, 0), ('SKYE', 7, 0), ('MAX', 9, 0),
          ('MAX', 10, 0), ('SKYE', 6, 0), ('MAX', 2, 0.6), ('MAX', 7, 0), ('SKYE', 2, 0), ('MAX', 8, 0), ('SKYE', 5, 0), ('MAX', 2, 0),
          ('SKYE', 7, 0), ('MAX', 15, 0), ('SKYE', 8, 0), ('MAX', 5, 0.8), ('SKYE', 10, 0)]
PACE = {'VO': 2.9, 'SKYE': 2.9, 'MAX': 2.7}
d = P / 'audio/chapters/ch04'
if (d / 'lines.json').is_file():
    by = {x['index']: x for x in json.loads((d / 'lines.json').read_text())['lines']}
else:                                               # the clip's EST
    by, t = {}, 0.0
    for i, (sp, n, pause) in enumerate(SCRIPT):
        du = n / PACE[sp] + 0.25; by[i + 1] = {'start': t, 'end': t + du}; t += du + 0.25 + pause
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
COOKIE_DOWN, TAKE, BACK, SNAP = end(6, -0.2), end(20, 0.15), end(20, 0.45), at(21, 1.15)
LENGTH = max(x['end'] for x in by.values()) + 0.8

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
s = 0.0                                             # lunchroom murmur, tiled 5 s clips, under everything
while s < LENGTH - 0.2: cue('crowd', s, 0.045, dur=round(min(5.0, LENGTH - s), 3)); s += 4.9
for k in range(3): cue('footstep', 0.12 + 0.2 * k, 0.07)     # Max walks over (frame 0, ~0.5 s)
cue('plop', COOKIE_DOWN + 0.22, 0.12)               # the cookie on her desk
cue('swish_1', TAKE - 0.08, 0.08)                   # she takes the half
for k in range(3): cue('footstep', BACK + 0.08 + 0.2 * k, 0.07)  # back to his desk
cue('click', BACK + 0.6, 0.06)                      # his chair
cue('pop', SNAP - 0.03, 0.12)                       # "Stop it, face." head snaps front
(P / 'source/sound/ch04.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
sfx = P / 'audio/sfx'; sfx.mkdir(parents=True, exist_ok=True)
SRC = {'crowd': ROOT / 'projects/she-raced-around-the-world/audio/sfx/crowd.wav', 'footstep': ROOT / 'assets/audio/horror/footstep.wav',
       'swish_1': ROOT / 'assets/audio/swish_1.wav', 'click': ROOT / 'assets/audio/click.wav'}
for a in {c['asset'][4:-4] for c in cues}:
    if not (sfx / f'{a}.wav').is_file(): shutil.copy(SRC[a], sfx / f'{a}.wav')
print(len(cues), 'cues, length', round(LENGTH, 2))
