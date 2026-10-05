"""This short's effects in audio/sfx/: roar, clang, thud, whoosh, chime and flutter are the ones synthesized for
Every Lie Comes True (copied from ../every-lie-comes-true/audio/sfx); pencil (graphite scratching on paper), purr
(a low rumbling purr) and bonk (a square wheel hitting the floor) are synthesized here.

  python3 source/sfx_assets.py
"""
import shutil, wave
import numpy as np
from pathlib import Path
P = Path(__file__).resolve().parent.parent
O = P / 'audio/sfx'; O.mkdir(parents=True, exist_ok=True)
for n in ('roar', 'clang', 'thud', 'whoosh', 'chime', 'flutter'):
    shutil.copy(P.parent / 'every-lie-comes-true/audio/sfx' / f'{n}.wav', O)
SR = 48000
rng = np.random.default_rng(11)
t_ = lambda d: np.arange(int(d * SR)) / SR


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    with wave.open(str(O / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())


def band(x, lo, hi):                                  # crude band-pass by FFT mask
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))


# pencil: 1.2 s of quick strokes (hissy graphite, each stroke a swell)
t = t_(1.2); n = band(rng.standard_normal(len(t)), 2500, 9000)
strokes = np.clip(np.sin(2 * np.pi * 5.5 * t + 0.6 * np.sin(2 * np.pi * 1.3 * t)), 0, None) ** 0.7
save('pencil', n * strokes * (0.6 + 0.4 * rng.random(len(t))) * np.minimum(1, (1.2 - t) * 6))
# purr: 2 s, a 26 Hz flutter on a low rumble
t = t_(2.0); n = band(rng.standard_normal(len(t)), 60, 420)
save('purr', n * (0.55 + 0.45 * np.sin(2 * np.pi * 26 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * t)) * np.minimum(1, t * 6) * np.minimum(1, (2.0 - t) * 3))
# bonk: a hollow knock (falling 220 -> 140 Hz) with a click
t = t_(0.35); f = 140 + 80 * np.exp(-t * 20)
save('bonk', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + 0.5 * band(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t * 90))
print(sorted(p.name for p in O.glob('*.wav')))
