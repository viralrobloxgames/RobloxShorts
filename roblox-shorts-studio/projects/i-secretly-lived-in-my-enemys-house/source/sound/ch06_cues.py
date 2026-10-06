#!/usr/bin/env python3
"""Ch6 SFX cues -> source/sound/ch06.json, timed on audio/chapters/ch06/lines.json + captions.json (same key times as
web/ch06.js; falls back to the clip's estimates). Run after every narration change: python3 source/sound/ch06_cues.py"""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
EST = [(0.0, 5.0), (5.35, 9.0), (9.25, 10.5), (10.75, 13.8), (14.05, 18.4), (18.65, 19.9), (20.15, 21.9), (22.75, 23.9),
       (24.15, 25.8), (26.05, 27.5), (27.75, 29.6), (29.85, 32.8), (33.85, 38.6), (38.85, 43.4), (44.25, 45.5), (45.75, 46.9),
       (47.15, 50.0), (50.25, 55.0), (55.25, 56.1), (56.35, 57.0)]
d = P / 'audio/chapters/ch06'
if (d / 'lines.json').is_file():
    lj = json.loads((d / 'lines.json').read_text())
    by = {x['index']: x for x in lj['lines']}
    words = json.loads((d / 'captions.json').read_text())['words'] if (d / 'captions.json').is_file() else []
else:
    by = {i + 1: {'start': a, 'end': b} for i, (a, b) in enumerate(EST)}; words = []
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
def word_t(i, k):                                   # same as wordT() in web/ch06.js
    l = by[i]; ws = [w for w in words if l['start'] - 0.05 <= w['start'] < l['end']]
    if len(ws) > k: return ws[k]['start']
    return l['start'] + (l['end'] - l['start']) * k / len(l.get('text', 'x').split()) if 'text' in l else l['start'] + 0.3 * k
TAP, CREAK, HIDE, HATCH = end(7, 0.2), end(12, 0.12), end(14, 0.08), word_t(18, 1)
LENGTH = max(x['end'] for x in by.values()) + 0.8

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
cue('night_bed', 0.0, 0.08, dur=round(LENGTH, 3))   # night room tone all chapter
s = 0.25                                            # Skye's creeping steps to Max's door (clip: arrives at 2.7 s)
while s < 2.6: cue('footstep', s, 0.06); s += 0.75
cue('swish_1', TAP - 0.02, 0.10)                    # Lily's tap on her shoulder
cue('door_creak', CREAK - 0.05, 0.30)               # the floorboard creak at the end of the hall
s = CREAK + 0.35                                    # Dad's slow steps toward them (4 studs/s)
while s < at(13, 1.4): cue('footstep', s, 0.10); s += 0.7
for k in range(3): cue('footstep', HIDE + 0.15 + 0.16 * k, 0.07)    # the dash into the linen closet
cue('door_creak', HIDE + 0.5, 0.14)                 # the closet door pulled almost shut
cue('footstep', HATCH + 0.05, 0.10); cue('footstep', HATCH + 0.4, 0.10)   # Dad steps under the hatch
(P / 'source/sound/ch06.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
sfx = P / 'audio/sfx'; sfx.mkdir(parents=True, exist_ok=True)
lib = P.parents[1] / 'assets/audio'
for a in {c['asset'][4:-4] for c in cues}:
    src = lib / 'horror' / f'{a}.wav'
    if not src.is_file(): src = lib / f'{a}.wav'
    if not (sfx / f'{a}.wav').is_file(): shutil.copy(src, sfx / f'{a}.wav')
print(len(cues), 'cues, length', round(LENGTH, 2))
