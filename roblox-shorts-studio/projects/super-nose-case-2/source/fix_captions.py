"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched):
joins words Whisper split ("game pass", "At chew") and corrects words it heard differently from script.txt.
Run after any re-transcribe, before source/beats.py."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
FIX = {'viralrobloxgames': 'Viral Roblox Games', 'vlads': 'Vlad', 'vlade': 'Vlad', 'flad': 'Vlad', 'vladd': 'Vlad', '20': 'Twenty'}
JOIN = [(('home', 'grown'), 'homegrown')]
key = lambda w: re.sub(r"[^a-z']", '', w['word'].lower())
# A split that falls across two caption groups: move the second half into the first group.
for c1, c2 in zip(caps, caps[1:]):
    if c1['words'] and c2['words']:
        for (x, y), word in JOIN:
            if key(c1['words'][-1]) == x and key(c2['words'][0]) == y:
                c1['words'][-1]['end'] = c2['words'][0]['end']; c1['words'].append(c2['words'].pop(0)); break
for cap in caps:
    ws, out, i = cap['words'], [], 0
    while i < len(ws):
        for (a, b), word in JOIN:
            if i + 1 < len(ws) and key(ws[i]) == a and key(ws[i + 1]) == b:
                core = ws[i + 1]['word'].strip(); tail = core[len(core.rstrip('.,!?')):]
                out.append({**ws[i], 'word': ' ' + word + tail, 'end': ws[i + 1]['end']}); i += 2; break
        else:
            w = ws[i]; core = w['word'].strip(); k = re.sub(r'[.,!?]', '', core).lower(); tail = core[len(core.rstrip('.,!?')):]
            if k in FIX: w['word'] = ' ' + FIX[k] + tail
            out.append(w); i += 1
    cap['words'] = out
    if 'text' in cap: cap['text'] = ''.join(w['word'] for w in out).strip()
# Whisper sometimes "hears" a repeat of earlier lines in the last fraction of a second (Case 1's take-02 did). The script ends on "...more cases.", so drop every word after it.
flat = [(ci, wi) for ci, c in enumerate(caps) for wi in range(len(c['words']))]
ends = [k for k in range(1, len(flat)) if key(caps[flat[k - 1][0]]['words'][flat[k - 1][1]]) == 'more' and key(caps[flat[k][0]]['words'][flat[k][1]]) == 'cases']
if ends:
    ci, wi = flat[ends[0]]
    caps[ci]['words'] = caps[ci]['words'][:wi + 1]
    for c in caps[ci + 1:]: c['words'] = []
caps = [c for c in caps if c['words']]
for c in caps: c['start'], c['end'] = c['words'][0]['start'], c['words'][-1]['end']
P.write_text(json.dumps(caps, indent=1)); print('captions fixed')
