#!/usr/bin/env python3
"""Ch2 SFX cues -> source/sound/ch02.json, timed on audio/chapters/ch02/lines.json + captions.json (same key times as T in
web/ch02.js; falls back to the clip's estimate). Run after every narration change: python3 source/sound/ch02_cues.py
Hallway: house hum, the ladder creaks under her, soft creeping steps. Kitchen: the pan sizzling, each flip, her dash to the
island, Max and Lily on the stairs and the stools, the pancake sliding off the stack, the back door latch.
Outside: dawn wind. Classroom: murmur before the bell, Max snapping upright, her steps back to her desk."""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
ROOT = P.parents[1]
SCRIPT = [('VO', 23, 0), ('DAD', 9, 0.1), ('SKYE', 7, 0), ('MAX', 11, 0), ('DAD', 17, 0), ('LILY', 4, 0), ('DAD', 4, 0), ('MAX', 7, 0),
          ('DAD', 10, 0.8), ('LILY', 1, 0), ('MAX', 4, 0), ('LILY', 4, 0), ('DAD', 11, 0), ('SKYE', 3, 0.6), ('SKYE', 4, 0.1),
          ('MAX', 8, 0), ('SKYE', 7, 0), ('MAX', 7, 0), ('SKYE', 8, 0), ('MAX', 5, 0.6), ('SKYE', 6, 0)]
PACE = {'VO': 2.9, 'SKYE': 2.9, 'MAX': 2.7, 'LILY': 2.6, 'DAD': 2.5}
d = P / 'audio/chapters/ch02'
words = {}
if (d / 'lines.json').is_file():
    by = {x['index']: x for x in json.loads((d / 'lines.json').read_text())['lines']}
    if (d / 'captions.json').is_file():
        for w in json.loads((d / 'captions.json').read_text())['words']: words.setdefault(w['line'], []).append(w['start'])
else:                                               # the clip's EST
    by, t = {}, 0.0
    for i, (sp, n, pause) in enumerate(SCRIPT):
        if i: t += 0.25 + pause
        du = n / PACE[sp] + 0.3; by[i + 1] = {'start': t, 'end': t + du}; t += du
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
def wd(i, k, off=0):
    ws = words.get(i)
    if ws: return ws[min(k, len(ws) - 1)] + off
    return at(i) + (end(i) - at(i)) * k / SCRIPT[i - 1][1] + off
KITCHEN, DUCK, FAM, STEAL, CRAWL, OUT, CLASS, SITUP = wd(1, 15, -0.1), end(1, 0.05), at(3, 0.3), end(8, 0.08), at(13, 0.5), at(14, -0.3), at(15, -0.2), end(19, 0.08)
LENGTH = max(x['end'] for x in by.values()) + 0.75

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
cue('room_hum', 0.0, 0.05, dur=round(KITCHEN, 3))                           # the sleeping house
for k in range(3): cue('door_creak', 0.15 + 0.85 * k, 0.05, dur=0.5)          # ladder rungs creak under her
for k in range(5): cue('footstep', 3.1 + 0.33 * k, 0.04)                      # creeping to the stairs
cue('fire_loop', KITCHEN, 0.05, dur=round(at(9) - KITCHEN, 3))               # the pan sizzling
for k in range(int((at(2) - KITCHEN) / 1.1) + 1): cue('swish_2', KITCHEN + 1.1 * k + 0.05, 0.05)   # pancake flips
for k in range(6): cue('footstep', DUCK + 0.12 * k, 0.05)                     # her dash to the island
for k in range(8): cue('footstep', FAM + 0.4 * k, 0.04)                       # Max shuffling down the stairs
for k in range(6): cue('footstep', FAM + 0.7 + 0.3 * k, 0.035)                # Lily skipping
cue('swish_1', STEAL + 0.45, 0.07)                                          # the pancake slides off the stack
for k in range(4): cue('footstep', at(9) + 0.15 * k + 0.05, 0.05)             # Dad to the island end
cue('latch', CRAWL + 2.4, 0.08)                                             # the back door
cue('forest_wind', OUT, 0.05, dur=round(CLASS - OUT, 3))                    # dawn outside
s = CLASS                                                                   # classroom murmur before the bell
while s < LENGTH - 0.2: cue('crowd', s, 0.04, dur=round(min(5.0, LENGTH - s), 3)); s += 4.9
cue('click', SITUP + 0.05, 0.08)                                            # Max snaps upright (chair)
for k in range(4): cue('footstep', end(21, -0.3) + 0.2 * k, 0.05)            # back to her desk
(P / 'source/sound/ch02.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
sfx = P / 'audio/sfx'; sfx.mkdir(parents=True, exist_ok=True)
H = ROOT / 'assets/audio/horror'
SRC = {'crowd': ROOT / 'projects/she-raced-around-the-world/audio/sfx/crowd.wav', 'footstep': H / 'footstep.wav', 'room_hum': H / 'room_hum.wav',
       'door_creak': H / 'door_creak.wav', 'fire_loop': H / 'fire_loop.wav', 'latch': H / 'latch.wav', 'forest_wind': H / 'forest_wind.wav',
       'swish_1': ROOT / 'assets/audio/swish_1.wav', 'swish_2': ROOT / 'assets/audio/swish_2.wav', 'click': ROOT / 'assets/audio/click.wav'}
for a in {c['asset'][4:-4] for c in cues}:
    if not (sfx / f'{a}.wav').is_file(): shutil.copy(SRC[a], sfx / f'{a}.wav')
print(len(cues), 'cues, length', round(LENGTH, 2))
