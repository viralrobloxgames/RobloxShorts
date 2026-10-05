"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched): "sky and hunt" ->
"sky in Hunt" (Whisper mishears line 1), the game's name as "Hunt for Eggs", and the event names capitalised as in script.txt."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
CAP = {'prism': 'Prism', 'kitsune': 'Kitsune', 'alpha': 'Alpha', 'nom': 'Nom', 'friday': 'Friday', '5': 'five', '15': 'fifteen', '30': 'thirty', '2': 'two', '3': 'three', '4': 'four', '1': 'one'}
words = [w for cap in caps for w in cap['words']]
key = lambda w: re.sub(r'[^a-z0-9%]', '', w['word'].lower())
def put(w, new):
    core = w['word'].strip(); tail = core[len(core.rstrip('.,!?"')):]; w['word'] = ' ' + new + tail
for i, w in enumerate(words):
    k, prev = key(w), key(words[i - 1]) if i else ''
    if k == 'and' and prev == 'sky': put(w, 'in')
    elif k == 'hunt' and i + 2 < len(words) and key(words[i + 1]) == 'for' and key(words[i + 2]) == 'eggs': put(w, 'Hunt'); put(words[i + 2], 'Eggs')
    elif k in ('chest', 'blade') and prev == 'prism': put(w, k.capitalize())
    elif k in CAP: put(w, CAP[k])
for cap in caps:
    cap['text'] = ''.join(w['word'] for w in cap['words']).strip()
P.write_text(json.dumps(caps, indent=1)); print('captions fixed:', ' '.join(w['word'].strip() for w in words[:16]))
