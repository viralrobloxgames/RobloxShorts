"""Splice the two George insert lines into the main take at measured silent points.
main_take.mp3 (full script) + insert_lines.mp3 ("Here's how." / "Max even typed 'bye Leo' in chat.")
-> audio/narration.wav + audio/narration.mp3"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / 'audio'
STUDIO = ROOT.parents[1]
sys.path.insert(0, str(STUDIO / 'scripts'))
from settings import tools, executable
FF = executable(tools(), 'ffmpeg')
SR = 44100

def load(p):
    raw = subprocess.run([str(FF), '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def quietest(x, a, b, win=0.04):
    """Centre of the lowest-energy window between a and b seconds."""
    n = int(win * SR); best = None
    for s in range(int(a * SR), int(b * SR) - n, n // 4):
        e = float(np.mean(x[s:s + n] ** 2))
        if best is None or e < best[0]:
            best = (e, s + n // 2)
    return best[1]

def fade(x, ms=12):
    n = min(int(ms / 1000 * SR), len(x) // 2); r = np.linspace(0, 1, n, dtype=np.float32)
    x = x.copy(); x[:n] *= r; x[-n:] *= r[::-1]; return x

sil = lambda s: np.zeros(int(s * SR), dtype=np.float32)
main = load(A / 'source/main_take.mp3')
ins = load(A / 'source/insert_lines.mp3')

cut1 = quietest(main, 3.85, 4.60)    # after "...touched his keyboard."
cut2 = quietest(main, 44.45, 44.95)  # after "...kick all AFK players,"
heres_how = ins[:quietest(ins, 0.72, 1.2)]
bye_leo = ins[quietest(ins, 2.20, 2.43):quietest(ins, 4.58, 4.9)]

parts = [main[:cut1], sil(0.05), fade(heres_how), sil(0.30), main[cut1:cut2], sil(0.10), fade(bye_leo), sil(0.05), main[cut2:]]
out = np.concatenate(parts)
peak = float(np.max(np.abs(out)))
if peak > 0.98:
    out *= 0.98 / peak
pcm = (np.clip(out, -1, 1) * 32767).astype('<i2')
with wave.open(str(A / 'narration.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run([str(FF), '-y', '-v', 'error', '-i', str(A / 'narration.wav'), '-b:a', '192k', str(A / 'narration.mp3')], check=True)
off1 = len(heres_how) + int(0.35 * SR)
info = {'cut1_s': cut1 / SR, 'cut2_s': cut2 / SR, 'insert1_s': (cut1 + int(0.05 * SR)) / SR,
        'insert2_s': (cut2 + off1 + int(0.10 * SR)) / SR, 'duration_s': len(out) / SR}
(A / 'source/splice.json').write_text(json.dumps(info, indent=2))
print(json.dumps(info, indent=2))
