"""Builds audio/sfx/ for He Won The Marathon By Car: synthesizes what the library lacks and copies the rest.

  python3 source/make_sfx.py      # from the project dir (numpy only)

Synthesized here (original, deterministic): engine (a 1900s car puttering, 2.4 s, loopable), horn (a bulb horn
"ah-oo-ga" honk), bark (two dog barks), hiss (radiator steam), snore (one in-out snore with a whistle, 2.2 s), crunch
(an apple bite), steps (running footsteps on dirt, 1.0 s loop), splash (a bucket slosh). Copied: whoosh, thud, pop,
chime, fanfare, applause (Lightning Hit Him Seven Times, synthesized there), clang and flutter (other projects)."""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(1904)

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

# engine: a single-cylinder putter (~9 pops/s) of low thumps with exhaust noise; crossfaded so it loops
n = int(2.4 * SR); t = np.arange(n) / SR; y = np.zeros(n)
for k in np.arange(0, 2.4, 1 / 9.0):
    i = int(k * SR); m = int(0.07 * SR); tk = np.arange(m) / SR
    seg = (np.sin(2 * np.pi * 70 * tk) * 0.9 + lowpass(rng.standard_normal(m), 0.08) * 2.5) * np.exp(-tk * 45)
    y[i:i + m] += seg[: n - i] * (0.85 + 0.3 * rng.random())
f = int(0.2 * SR); y[:f] = y[:f] * np.linspace(0, 1, f) + y[-f:] * np.linspace(1, 0, f); y = y[:-f]
save('engine', lowpass(y, 0.3))
# horn: a bulb horn, two notes with a nasal buzz
parts = []
for hz, d in ((330, 0.18), (250, 0.32)):
    m = int(d * SR); tk = np.arange(m) / SR; ph = 2 * np.pi * hz * tk
    parts.append(np.tanh(3 * np.sin(ph)) * 0.7 + 0.3 * np.sign(np.sin(ph * 2.01)) * env(m, 0.01, 0.06))
save('horn', lowpass(np.concatenate(parts), 0.35))
# bark: two short barks (a rough formant burst with a falling pitch)
y = np.zeros(int(0.75 * SR))
for k in (0.0, 0.36):
    m = int(0.2 * SR); tk = np.arange(m) / SR; hz = 520 - 900 * tk
    s = np.sin(2 * np.pi * np.cumsum(hz) / SR) * 0.6 + lowpass(rng.standard_normal(m), 0.25) * 0.8
    i = int(k * SR); y[i:i + m] += s * np.exp(-tk * 14) * np.minimum(1, tk / 0.008)
save('bark', y)
# hiss: steam escaping (high noise with a swell)
n = int(1.8 * SR); y = (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 0.2)) * env(n, 0.05, 0.9)
save('hiss', y)
# snore: an in-breath rasp then a whistling out-breath
n = int(2.2 * SR); t = np.arange(n) / SR
rasp = lowpass(rng.standard_normal(n), 0.06) * (1 + np.sign(np.sin(2 * np.pi * 34 * t))) * np.clip(np.sin(np.pi * t / 1.1), 0, 1) * (t < 1.1)
whis = np.sin(2 * np.pi * (900 - 200 * (t - 1.2)) * t) * 0.25 * np.clip(np.sin(np.pi * (t - 1.2) / 0.9), 0, 1) * (t > 1.2) * (t < 2.1)
save('snore', rasp * 1.6 + whis)
# crunch: an apple bite (a burst of crackles)
n = int(0.32 * SR); y = np.zeros(n)
for k in np.sort(rng.uniform(0, 0.18, 14)):
    i = int(k * SR); m = int(0.025 * SR); tk = np.arange(m) / SR; y[i:i + m] += (rng.standard_normal(m) * np.exp(-tk * 220))[: n - i]
save('crunch', y)
# steps: running on packed dirt, 4 footfalls per second
n = int(1.0 * SR); y = np.zeros(n)
for k in (0.0, 0.25, 0.5, 0.75):
    i = int(k * SR); m = int(0.06 * SR); tk = np.arange(m) / SR; y[i:i + m] += (lowpass(rng.standard_normal(m), 0.12) * 3 + np.sin(2 * np.pi * 90 * tk)) * np.exp(-tk * 60)
save('steps', y)
# splash: water sloshing in a bucket
n = int(0.7 * SR); y = lowpass(rng.standard_normal(n), 0.15) * env(n, 0.02, 0.5) * (1 + 0.5 * np.sin(2 * np.pi * 7 * np.arange(n) / SR))
save('splash', y)
# copied
for nme in ('whoosh', 'thud', 'pop', 'chime', 'fanfare', 'applause'): shutil.copy2(ROOT / 'projects/lightning-hit-him-seven-times/audio/sfx' / f'{nme}.wav', OUT / f'{nme}.wav')
for nme in ('clang', 'flutter'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{nme}.wav'))), None)
    if src: shutil.copy2(src, OUT / f'{nme}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
