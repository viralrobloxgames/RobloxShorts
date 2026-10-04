"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched):
joins words Whisper split ("game pass", "At chew") and corrects words it heard differently from script.txt.
Run after any re-transcribe, before source/beats.py."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
FIX = {'viralrobloxgames': 'Viral Roblox Games', 'supernose': 'Super Nose', 'chiefs': "Chief's", 'meer': 'Mia', 'mir': 'Mia'}
JOIN = [(('game', 'pass'), 'gamepass'), (('at', 'chew'), 'Achoo'), (('a', 'chew'), 'Achoo'), (('ah', 'choo'), 'Achoo')]
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
                core = ws[i + 1]['word'].strip(); tail = core[len(core.rstrip('.,!?')):] or ('.' if word == 'Achoo' else '')
                out.append({**ws[i], 'word': ' ' + word + tail, 'end': ws[i + 1]['end']}); i += 2; break
        else:
            w = ws[i]; core = w['word'].strip(); k = re.sub(r'[.,!?]', '', core).lower(); tail = core[len(core.rstrip('.,!?')):]
            if k in FIX: w['word'] = ' ' + FIX[k] + tail
            out.append(w); i += 1
    cap['words'] = out
    if 'text' in cap: cap['text'] = ''.join(w['word'] for w in out).strip()
caps = [c for c in caps if c['words']]
for c in caps: c['start'], c['end'] = c['words'][0]['start'], c['words'][-1]['end']
P.write_text(json.dumps(caps, indent=1)); print('captions fixed')
