#!/usr/bin/env python3
"""Ch5 SFX cues -> source/sound/ch05.json, timed on audio/chapters/ch05/lines.json (the same key times as T in web/ch05.js).
Run after every narration change: python3 source/sound/ch05_cues.py
A quiet attic afternoon (birds far outside the round window, low, tiled), the hatch lid creaking up at frame 0, a swish on
Skye's "Boo", Lily's feet on the ladder rungs and the floorboards, the hobby horse picked up and handed over, a pour and a
cup clink at the tea party, a small pop when Skye's face goes pink, and the last pour."""
import json, shutil
from pathlib import Path

P = Path(__file__).resolve().parents[2]
d = P / 'audio/chapters/ch05'
lines = sorted(json.loads((d / 'lines.json').read_text())['lines'], key=lambda x: x['start'])   # k = order in the chapter (0 = VO)
at = lambda k, off=0: lines[k]['start'] + off
end = lambda k, off=0: lines[k]['end'] + off
# key times, as in web/ch05.js
CLIMB = at(5, -0.35); CLIMB_END = CLIMB + 0.7
HORSE_GRAB = CLIMB_END + 4.6 / 12 + 0.2            # hatch_top -> the hobby horse at walk speed, then the grab
HORSE_GIVE = at(10, 1.0); TEA = end(10, 0.2); BLUSH = end(28, 0.05)
LENGTH = max(x['end'] for x in lines) + 0.75

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
s = 0.0                                             # birds far outside, under everything
while s < LENGTH - 0.2: cue('birds', s, 0.025, dur=round(min(5.0, LENGTH - s), 3)); s += 4.9
cue('door_creak', 0.0, 0.08)                        # the hatch lid lifting (frame 0)
cue('swish_1', at(2, 0.55), 0.06)                   # "Boo" (arm up)
for k in range(2): cue('footstep', CLIMB + 0.1 + 0.3 * k, 0.06)    # ladder rungs
for k in range(5): cue('footstep', CLIMB_END + 0.05 + 0.3 * k, 0.05)   # across the floorboards
cue('swish_1', HORSE_GRAB, 0.06)                    # picks up the hobby horse
cue('swish_1', HORSE_GIVE - 0.05, 0.07)             # hands it to Skye
cue('hiss', at(11, -0.1), 0.03, dur=1.0)            # pours ("More tea, horse?") - a soft trickle
cue('click', end(11, 0.1), 0.05)                    # the pot back down / cup clink
cue('click', at(24, 0.2), 0.04)                     # pours herself more
cue('pop', BLUSH + 0.05, 0.08)                      # Skye's face goes pink
cue('hiss', at(29, 1.7), 0.03, dur=min(1.0, LENGTH - at(29, 1.7)))   # the last pour
(P / 'source/sound/ch05.json').write_text(json.dumps(sorted(cues, key=lambda c: c['start']), indent=1))
missing = [c['asset'] for c in cues if not (P / 'audio' / c['asset']).is_file()]
print(len(cues), 'cues, length', round(LENGTH, 2), 'missing:', sorted(set(missing)) or 'none')
