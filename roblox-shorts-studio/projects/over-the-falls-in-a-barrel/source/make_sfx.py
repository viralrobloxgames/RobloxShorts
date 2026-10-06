"""Builds audio/sfx/ for She Went Over Niagara Falls In A Barrel: synthesizes what the library lacks, copies the rest.

  python3 source/make_sfx.py      # from the project dir (numpy only)

Synthesized here (original, deterministic): roar (the falls: a deep broadband water roar, 6 s, loopable), rapids
(lighter rushing water, 5 s loop), splash (a big splash), pump (one bicycle-pump stroke: a rising hiss with a squeak),
meow (a cat's meow), creak (a wooden lid creaking), knock (the lid thumping shut), roll (a barrel rumbling over
ground, 2 s), coins (a few coins clinking). Copied: whoosh, thud, pop, chime, fanfare, applause (Lightning Hit Him
Seven Times), flutter and clang (other projects)."""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(1901)
def save(name, y):
    y = np.asarray(y, dtype=np.float64); y = y / (np.max(np.abs(y)) + 1e-9) * 0.9
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())
def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def env(n, att, rel):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(att, 1e-4)) * np.minimum(1, (n / SR - t) / max(rel, 1e-4)); return np.clip(e, 0, 1)
def loop(y, f=0.4):
    f = int(f * SR); y[:f] = y[:f] * np.linspace(0, 1, f) + y[-f:] * np.linspace(1, 0, f); return y[:-f]
n = int(6.4 * SR); t = np.arange(n) / SR
save('roar', loop(lowpass(rng.standard_normal(n), 0.02) * 6 + lowpass(rng.standard_normal(n), 0.12) * (1 + 0.2 * np.sin(2 * np.pi * 0.3 * t)) + 0.3 * rng.standard_normal(n) * 0.2))
n = int(5.4 * SR); t = np.arange(n) / SR
save('rapids', loop(lowpass(rng.standard_normal(n), 0.18) * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t) * np.sin(2 * np.pi * 0.37 * t)) + 0.4 * (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 0.3))))
n = int(1.4 * SR); t = np.arange(n) / SR
save('splash', (lowpass(rng.standard_normal(n), 0.2) * 1.5 + rng.standard_normal(n) * 0.5) * np.exp(-t * 3.2) * np.minimum(1, t / 0.01) + 0.8 * np.sin(2 * np.pi * 60 * t) * np.exp(-t * 9))
n = int(0.55 * SR); t = np.arange(n) / SR
save('pump', (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 0.4)) * np.clip(np.sin(np.pi * t / 0.55), 0, 1) * (0.5 + t) + 0.25 * np.sin(2 * np.pi * (1400 + 1600 * t) * t) * np.exp(-((t - 0.45) / 0.04) ** 2))
n = int(0.75 * SR); t = np.arange(n) / SR; hz = 520 + 260 * np.sin(np.pi * t / 0.75) - 120 * t
ph = 2 * np.pi * np.cumsum(hz) / SR
save('meow', (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * env(n, 0.05, 0.25) * (0.7 + 0.3 * np.sin(2 * np.pi * 6 * t)))
n = int(0.7 * SR); t = np.arange(n) / SR
save('creak', np.sign(np.sin(2 * np.pi * (60 + 40 * t) * t)) * lowpass(rng.standard_normal(n), 0.3) * env(n, 0.05, 0.2) + 0.3 * np.sin(2 * np.pi * (300 + 200 * t) * t) * env(n, 0.05, 0.2))
n = int(0.4 * SR); t = np.arange(n) / SR
save('knock', (np.sin(2 * np.pi * 110 * t) + 0.6 * lowpass(rng.standard_normal(n), 0.15) * 3) * np.exp(-t * 18))
n = int(2.2 * SR); t = np.arange(n) / SR
save('roll', lowpass(rng.standard_normal(n), 0.03) * 5 * (1 + 0.5 * np.sign(np.sin(2 * np.pi * 3.2 * t))) * env(n, 0.1, 0.3))
n = int(0.9 * SR); y = np.zeros(n)
for k in (0.0, 0.11, 0.2, 0.34, 0.52):
    i = int(k * SR); m = int(0.25 * SR); tk = np.arange(m) / SR; f0 = 3200 + rng.random() * 1400
    y[i:i + m] += (np.sin(2 * np.pi * f0 * tk) + 0.6 * np.sin(2 * np.pi * f0 * 1.51 * tk)) * np.exp(-tk * 22)
save('coins', y)
for nme in ('whoosh', 'thud', 'pop', 'chime', 'fanfare', 'applause'): shutil.copy2(ROOT / 'projects/lightning-hit-him-seven-times/audio/sfx' / f'{nme}.wav', OUT / f'{nme}.wav')
for nme in ('clang', 'flutter'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{nme}.wav'))), None)
    if src: shutil.copy2(src, OUT / f'{nme}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
