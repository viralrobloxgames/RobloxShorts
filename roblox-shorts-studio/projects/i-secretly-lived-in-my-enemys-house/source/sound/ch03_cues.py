#!/usr/bin/env python3
"""Ch3 SFX cues -> source/sound/ch03.json, timed on audio/chapters/ch03/lines.json + captions.json (the same key times as T
in web/ch03.js). Run after every narration change: python3 source/sound/ch03_cues.py
The dark kitchen: the fridge hum, magnet letters clicking onto the door, footsteps on the stairs, the fridge door and the
pantry slats, Max making the sandwich (knife, plate), Skye tiptoeing, Dad's slippers, the ham."""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
ROOT = P.parents[1]
d = P / 'audio/chapters/ch03'
L = json.loads((d / 'lines.json').read_text())
by = {x['index']: x for x in L['lines']}                   # spoken lines, numbered from 1
words = {}
for w in json.loads((d / 'captions.json').read_text())['words']: words.setdefault(w['line'], []).append(w['start'])
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
wd = lambda i, k, off=0: words[i][min(k, len(words[i]) - 1)] + off
LENGTH = max(x['end'] for x in by.values()) + 0.8

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
steps = lambda t0, n, dt, g: [cue('footstep', t0 + dt * k, g) for k in range(n)]
cue('room_hum', 0.0, 0.05, dur=round(LENGTH, 3))                              # the fridge hum / sleeping house
for t in (0.95, 2.45, wd(3, 2), wd(3, 3), wd(3, 3, 0.14), wd(3, 3, 0.28), wd(3, 3, 0.42)): cue('click', t, 0.04)   # letters on the door
FREEZE = end(3, 0.05)
steps(FREEZE - 0.05, 3, 0.3, 0.035)                                           # footsteps on the stairs (+0.6)
cue('latch', FREEZE + 0.5, 0.06)                                              # she shuts the fridge
steps(FREEZE + 0.8, 3, 0.12, 0.04)                                            # her dash to the pantry
cue('door_creak', FREEZE + 1.1, 0.04, dur=0.6)                                # the slatted doors
steps(at(4, -1.3), 10, 0.33, 0.045)                                           # Max down the stairs and across
cue('latch', end(9), 0.06); cue('latch', end(9, 0.6), 0.06)                   # Max: fridge open, shut
steps(end(9, 0.9), 3, 0.3, 0.04)                                              # to the island
for k in range(5): cue('swish_3', wd(10, 6) + 0.35 * k, 0.03)                 # cutting the crusts off
cue('click', at(11, 0.35), 0.06)                                              # the plate down on the island
steps(end(11, -0.35), 8, 0.3, 0.04)                                           # Max back upstairs
steps(end(11, 0.3), 4, 0.22, 0.025)                                           # Skye tiptoes out
steps(end(13, 0.05), 3, 0.12, 0.035)                                          # she ducks
steps(end(13, 0.2), 14, 0.42, 0.045)                                          # Dad's slippers down the stairs to the fridge
cue('latch', at(17, -0.2), 0.06); cue('latch', end(18, -0.6), 0.06)           # Dad: fridge open, shut
steps(end(18, -0.2), 9, 0.42, 0.04)                                           # Dad off upstairs with the ham
(P / 'source/sound/ch03.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
sfx = P / 'audio/sfx'; sfx.mkdir(parents=True, exist_ok=True)
H = ROOT / 'assets/audio/horror'
SRC = {'footstep': H / 'footstep.wav', 'room_hum': H / 'room_hum.wav', 'door_creak': H / 'door_creak.wav', 'latch': H / 'latch.wav',
       'click': ROOT / 'assets/audio/click.wav', 'swish_3': ROOT / 'assets/audio/swish_3.wav'}
for a in {c['asset'][4:-4] for c in cues}:
    if not (sfx / f'{a}.wav').exists(): shutil.copy(SRC[a], sfx / f'{a}.wav')
print(f'{len(cues)} cues, length {LENGTH:.2f} s -> source/sound/ch03.json')
