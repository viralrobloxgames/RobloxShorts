"""Tighten a take's narration clips in place: trim dead air at each clip's start and end and shorten long pauses inside a
line (kept pauses use the clip's own room tone, crossfaded, so nothing clicks). Originals are kept in clips_raw/, and the
step is idempotent (it always works from clips_raw). Run between generating clips and scripts/narrate.py's join:
    python3 scripts/tighten_clips.py projects/<slug> --voice detective_noir --take take-02 [--max-gap 0.35]"""
import argparse, hashlib, shutil, numpy as np, soundfile as sf, librosa
from pathlib import Path
ap = argparse.ArgumentParser(); ap.add_argument('project', type=Path); ap.add_argument('--voice', required=True); ap.add_argument('--take', required=True)
ap.add_argument('--max-gap', type=float, default=0.35); ap.add_argument('--head', type=float, default=0.06); ap.add_argument('--tail', type=float, default=0.12)
a = ap.parse_args()
lines = [l.strip() for l in (a.project / 'script.txt').read_text(encoding='utf-8-sig').splitlines() if l.strip()]
clips = a.project / 'audio/qwen' / a.take / 'clips'; raw = clips.parent / 'clips_raw'; raw.mkdir(exist_ok=True)
before = after = 0
for t in lines:
    n = hashlib.sha1(f'{a.voice}|{t}'.encode()).hexdigest()[:12] + '.wav'
    if not (raw / n).is_file(): shutil.copy2(clips / n, raw / n)
    y, sr = sf.read(raw / n); iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=128)
    xf = int(0.01 * sr); half = int(a.max_gap / 2 * sr)
    out = y[max(0, iv[0][0] - int(a.head * sr)):iv[0][1]]
    for (s0, e0), (s1, e1) in zip(iv[:-1], iv[1:]):
        gap = y[e0:s1]
        if len(gap) > 2 * half + 2 * xf:
            l, r = gap[:half + xf].copy(), gap[-half - xf:].copy(); f = np.linspace(0, 1, xf)
            gap = np.concatenate([l[:-xf], l[-xf:] * (1 - f) + r[:xf] * f, r[xf:]])
        out = np.concatenate([out, gap, y[s1:e1]])
    out = np.concatenate([out, y[iv[-1][1]:min(len(y), iv[-1][1] + int(a.tail * sr))]])
    sf.write(clips / n, out, sr); before += len(y) / sr; after += len(out) / sr
print(f'tightened {len(lines)} clips: {before:.1f}s -> {after:.1f}s (max gap {a.max_gap}s)')
