"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched):
joins Whisper's split "T" + "-Rex" into one word, and corrects words it heard differently from script.txt."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
FIX = {'steel': 'Steal', '$1': 'one dollar', '12': 'twelve', '2': 'two', 'mum': 'Mom', 'mums': 'moms', 'viralrobloxgames': 'Viral Roblox Games'}
for cap in caps:
    out = []
    for w in cap['words']:
        if out and w['word'].startswith('-'):
            out[-1]['word'] += w['word'].strip(); out[-1]['end'] = w['end']; continue
        core = w['word'].strip(); key = re.sub(r'[.,!?]', '', core).lower(); tail = core[len(core.rstrip('.,!?')):]
        if key in FIX: w['word'] = ' ' + FIX[key] + tail
        out.append(w)
    # "Steal and Egg" -> "Steal an Egg"
    for i in range(len(out) - 1):
        if out[i]['word'].strip() == 'Steal' and out[i + 1]['word'].strip().lower() == 'and': out[i + 1]['word'] = ' an'
    cap['words'] = out
    cap['text'] = ''.join(w['word'] for w in out).strip() if 'text' in cap else cap.get('text')
P.write_text(json.dumps(caps, indent=1)); print('captions fixed')
