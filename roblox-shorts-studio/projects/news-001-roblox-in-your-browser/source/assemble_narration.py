"""Stretch the raw Brittney take (58.8 s) past TikTok's 60 s line with news-style beats between sections.

    python source/assemble_narration.py        (run from the project folder)

Inputs:  audio/narration.mp3 (raw take), audio/alignment/raw_captions.json (kept from transcribe.py)
Outputs: audio/narration.wav (with pauses), audio/alignment/captions.json + captions.srt (shifted, brand words fixed)
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

P = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(P.parents[1] / 'scripts'))
from settings import tools, executable

SR = 48000
# (cut time in the raw take, seconds of silence to insert): each cut sits in the gap after a section
BEATS = [(3.27, 0.6),   # hook -> BREAKING slam
         (5.69, 1.2),   # "This is ViralRoblox News." -> logo sting
         (15.09, 0.5),  # "...on Chrome." -> NO APP / NO INSTALL
         (18.69, 0.6),  # "...coming later." -> the link beat
         (26.08, 0.8),  # "...playing instantly." -> "That's not all"
         (39.93, 0.8),  # "...coming soon." -> what it means
         (46.75, 0.7),  # "...one link." -> follow CTA
         (50.18, 0.4),  # "...Roblox news!" -> comment prompt
         (54.53, 0.5)]  # "Comment below." -> sign-off


def shift(t):
    return t + sum(d for c, d in BEATS if t >= c)


def ts(t):
    ms = round(t * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def main():
    ff = executable(tools(), 'ffmpeg')
    raw = subprocess.run([ff, '-v', 'error', '-i', str(P / 'audio/narration.mp3'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    parts, last = [], 0
    for c, d in BEATS:
        i = int(c * SR)
        parts += [x[last:i], np.zeros(int(d * SR), np.float32)]
        last = i
    parts.append(x[last:])
    y = np.concatenate(parts)
    with wave.open(str(P / 'audio/narration.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())

    al = P / 'audio/alignment'
    caps = json.loads((al / 'raw_captions.json').read_text(encoding='utf-8'))
    # flatten, fix brand words the transcriber split ("Viral Roblox games", "mid -2027"), then regroup per caption
    words = [dict(w, word=w['word'].strip(), group=g) for g, c in enumerate(caps) for w in c['words']]
    fixed = []
    for w in words:
        if fixed and fixed[-1]['word'] == 'Viral' and w['word'].startswith('Roblox'):
            fixed[-1].update(word='ViralRoblox' + w['word'][6:], end=w['end']); continue
        if fixed and fixed[-1]['word'].startswith('ViralRoblox') and w['word'].lower().startswith('games'):
            fixed[-1].update(word='ViralRobloxGames' + w['word'][5:], end=w['end']); continue
        if fixed and fixed[-1]['word'] == 'mid' and w['word'].startswith('-'):
            fixed[-1].update(word='mid' + w['word'], end=w['end']); continue
        if w['word'] == 'Play' and fixed and fixed[-1]['word'] == 'Offline':
            w['word'] = 'play'
        fixed.append(w)
    out = []
    for g in sorted({w['group'] for w in fixed}):
        ws = [{'word': w['word'], 'start': round(shift(w['start']), 3), 'end': round(shift(w['end']), 3)} for w in fixed if w['group'] == g]
        if ws:
            out.append({'start': ws[0]['start'], 'end': ws[-1]['end'], 'text': ' '.join(w['word'] for w in ws), 'words': ws})
    (al / 'captions.json').write_text(json.dumps(out, indent=1), encoding='utf-8')
    (al / 'captions.srt').write_text(''.join(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n\n" for i, c in enumerate(out, 1)), encoding='utf-8')
    print(f'narration.wav {len(y) / SR:.2f} s, {len(out)} caption groups, last word ends {out[-1]["end"]:.2f} s')


if __name__ == '__main__':
    main()
