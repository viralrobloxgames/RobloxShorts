"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched):
spells out the numbers Whisper writes as digits and corrects words it heard differently from script.txt."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
FIX = {'50,000': 'fifty thousand', '50000': 'fifty thousand', '900': 'nine hundred', '60': 'sixty', '10': 'ten', '3': 'three', '2': 'two', '1': 'one',
       '4': 'four', 'limbo\'d': 'limboed', 'limbod': 'limboed', 'viralrobloxgames': 'Viral Roblox Games', 'capibara': 'capybara', 'check': 'checked'}
for cap in caps:
    for w in cap['words']:
        core = w['word'].strip(); key = re.sub(r'[.?!"]|,$', '', core).lower(); tail = core[len(core.rstrip('.,!?"')):]
        if key in FIX: w['word'] = ' ' + FIX[key] + tail
    cap['text'] = ''.join(w['word'] for w in cap['words']).strip() if 'text' in cap else cap.get('text')
P.write_text(json.dumps(caps, indent=1)); print('captions fixed')
