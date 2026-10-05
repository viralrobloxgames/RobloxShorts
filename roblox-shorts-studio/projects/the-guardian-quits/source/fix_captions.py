"""Text-only fixes to audio/alignment/captions.json after narrate.py/transcribe (timings untouched):
joins Whisper's split "T" + "-Rex", spells out numbers it writes as digits, joins "brain rot", and corrects words it
heard differently from script.txt."""
import json, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent / 'audio/alignment/captions.json'
caps = json.loads(P.read_text())
FIX = {'400': 'four hundred', '1': 'one', '5': 'five', 't-rex': 'T-rex', 't-rexes': 'T-rexes', 'viralrobloxgames': 'Viral Roblox Games', 'brain-rot': 'brainrot'}
for cap in caps:
    out = []
    for w in cap['words']:
        if out and w['word'].startswith('-'):
            out[-1]['word'] += w['word'].strip(); out[-1]['end'] = w['end']; continue
        if out and out[-1]['word'].strip().lower() == 'brain' and w['word'].strip().lower().startswith('rot'):
            out[-1]['word'] = ' brainrot' + w['word'].strip()[3:]; out[-1]['end'] = w['end']; continue
        core = w['word'].strip(); key = re.sub(r'[.?!"]|,$', '', core).lower(); tail = core[len(core.rstrip('.,!?"')):]
        if key in FIX: w['word'] = ' ' + FIX[key] + tail
        out.append(w)
    cap['words'] = out
    cap['text'] = ''.join(w['word'] for w in out).strip() if 'text' in cap else cap.get('text')
P.write_text(json.dumps(caps, indent=1)); print('captions fixed')
