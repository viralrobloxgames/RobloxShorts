"""Group measured word timings into caption phrases and write audio/alignment/*."""
from pathlib import Path
import json


def group(words, duration, max_words=4, max_chars=25, gap=.24):
    """words: [{'word','start','end'}]. Returns caption phrases with their words, like transcribe.py always wrote."""
    caps = []; cur = []
    for i, w in enumerate(words):
        cur.append(w); text = ' '.join(v['word'].strip() for v in cur)
        following = words[i + 1]['start'] if i + 1 < len(words) else duration
        if len(cur) >= max_words or len(text) > max_chars or following - w['end'] > gap or w['word'].strip().endswith(('.', ',', '!', '?')):
            caps.append({'start': cur[0]['start'], 'end': min(w['end'] + .12, following), 'text': text, 'words': cur}); cur = []
    if cur:
        caps.append({'start': cur[0]['start'], 'end': cur[-1]['end'] + .12, 'text': ' '.join(w['word'].strip() for w in cur), 'words': cur})
    return caps


def srt_stamp(t):
    n = round(t * 1000)
    return f'{n // 3600000:02}:{n // 60000 % 60:02}:{n // 1000 % 60:02},{n % 1000:03}'


def write_alignment(out_dir, transcript, words, duration):
    """Writes transcript.json, captions.json and captions.srt. finish.py reads captions.json."""
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    caps = group(words, duration)
    (out / 'transcript.json').write_text(json.dumps(transcript, indent=2, ensure_ascii=False), encoding='utf-8')
    (out / 'captions.json').write_text(json.dumps(caps, indent=2, ensure_ascii=False), encoding='utf-8')
    (out / 'captions.srt').write_text('\n\n'.join(f'{i + 1}\n{srt_stamp(c["start"])} --> {srt_stamp(c["end"])}\n{c["text"]}' for i, c in enumerate(caps)) + '\n', encoding='utf-8')
    return caps
