#!/usr/bin/env python3
"""Ch11 SFX cues -> source/sound/ch11.json, timed on audio/chapters/ch11/lines.json (same key times as web/ch11.js).
Run after every narration change: python3 source/sound/ch11_cues.py"""
import json
from pathlib import Path

P = Path(__file__).resolve().parents[2]
lj = json.loads((P / 'audio/chapters/ch11/lines.json').read_text())
lines = [x for x in (lj if isinstance(lj, list) else lj['lines']) if x.get('speaker') and x.get('text') and x.get('kind') != 'action' and x.get('type') != 'action']
for i, x in enumerate(lines):
    x.setdefault('index', i)
by = {x['index']: x for x in lines}
at = lambda i, off=0: by[i]['start'] + off
end = lambda i, off=0: by[i]['end'] + off
T_LATER, T_WIDE, T_END = end(15) + 0.1, end(22) + 0.1, at(24) - 0.1
LENGTH = max(max(x['end'] for x in lines) + 0.75, T_END + 12.2)

cues = []
cue = lambda asset, start, gain, **kw: cues.append({'asset': f'sfx/{asset}.wav', 'start': round(start, 3), 'gain': gain, **kw})
# morning ambience (birds through the window), low, the whole chapter
t = 0.0
while t < LENGTH - 0.2:
    cue('birds', t, 0.07, dur=round(min(5.0, LENGTH - t), 3)); t += 5.0
# pan sizzle under Dad's first lines and the pancake beat
cue('hiss', 0.0, 0.05, dur=2.2); cue('hiss', at(2), 0.05, dur=2.2)
# Skye's footsteps: down the stairs from frame 0 (to 0.6 s), the last steps (4.3-4.6 s), to the island end on "Sorry"
for st in [0.05, 0.4, 4.32, 4.58, at(6) + 0.3, at(6) + 0.65]:
    cue('footstep', st, 0.22)
# the phone comes out, the "Later" cut: SAY YES chime, the phone put down
cue('click', at(15) - 0.4, 0.25)
cue('chime', T_LATER + 0.05, 0.22)
cue('click', T_LATER + 0.65, 0.2)
# pancake flips: whoosh up, plop down (same times as the clip)
for f in [at(22) + 0.3, T_WIDE + 0.7, T_END + 2.5, T_END + 7.5]:
    cue('whoosh', f, 0.18); cue('plop', f + 0.85, 0.3)
# Max slides the plate to Skye
cw = json.loads((P / 'audio/chapters/ch11/captions.json').read_text())['words']
he = next((w['start'] for w in cw if w.get('speaker') == 'VO' and at(23) + 1 < w['start'] < end(23) and w['word'].startswith('He')), at(23) + 2.65)
cue('glass', he - 0.15 + 0.35, 0.08, dur=0.9)    # review #26: the slide is in the two-shot on "He spent it making me sandwiches" (T_PAY + 0.35)
# end screen
cue('pop', T_END + 0.05, 0.3)

cues.sort(key=lambda c: c['start'])
(P / 'source/sound/ch11.json').write_text(json.dumps(cues, indent=1) + '\n')
print(f'{len(cues)} cues, chapter {LENGTH:.2f} s')
