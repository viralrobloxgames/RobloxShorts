"""Builds audio/sfx/ for Spaghetti Grows On Trees: synthesizes what the library lacks and copies the rest.

  python3 source/make_sfx.py      # from the project dir (numpy only)

Synthesized here (original, deterministic): birds (orchard birdsong chirps, 5 s, loopable), tv_hum (a 1950s set's hum
and hiss, 4 s, loopable), ring (a bell telephone's double ring, 1.6 s), cuckoo (a two-note cuckoo call, 0.9 s), squeak
(the weevil fainting, a falling squeak, 0.5 s), plop (a strand going into the sauce, 0.3 s). Copied: whoosh, thud, pop,
chime, fanfare, applause (Lightning Hit Him Seven Times), flutter (another project), desk_bell and forest_wind (the
horror library, assets/audio/horror)."""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(1957)

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

def loop_fade(y, sec=0.4):
    f = int(sec * SR); y = y.copy(); y[:f] = y[:f] * np.linspace(0, 1, f) + y[-f:] * np.linspace(1, 0, f); return y[:-f]

# birds: short frequency-swept chirps at random times
n = int(5.4 * SR); y = np.zeros(n)
for k in np.sort(rng.uniform(0, 5.0, 26)):
    i = int(k * SR); m = int(rng.uniform(0.05, 0.12) * SR); tk = np.arange(m) / SR; f0 = rng.uniform(2600, 4200)
    f = f0 + rng.choice([-1, 1]) * 1400 * tk / tk[-1]; y[i:i + m] += (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tk / tk[-1]) * rng.uniform(0.3, 1))[: n - i]
save('birds', loop_fade(y))

# tv hum: mains hum with harmonics and a soft hiss
n = int(4.4 * SR); t = np.arange(n) / SR
y = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((50, 1.0), (100, 0.5), (150, 0.25))) + 0.25 * lowpass(rng.standard_normal(n), 0.3)
save('tv_hum', loop_fade(y))

# ring: two bursts of a bell clapper (~20 Hz) striking two bells
n = int(1.6 * SR); t = np.arange(n) / SR
gate = (((t > 0.0) & (t < 0.45)) | ((t > 0.65) & (t < 1.1))).astype(float)
clap = (np.sin(2 * np.pi * 20 * t) > 0).astype(float)
bell = np.sin(2 * np.pi * 1300 * t) + 0.6 * np.sin(2 * np.pi * 1950 * t) + 0.3 * np.sin(2 * np.pi * 2900 * t)
y = bell * (0.5 + 0.5 * clap) * lowpass(gate, 0.01)
save('ring', y)

# cuckoo: two falling notes
n = int(0.9 * SR); y = np.zeros(n)
for k, f in ((0.0, 784), (0.38, 622)):
    i = int(k * SR); m = int(0.32 * SR); tk = np.arange(m) / SR
    y[i:i + m] += (np.sin(2 * np.pi * f * tk) + 0.2 * np.sin(4 * np.pi * f * tk)) * env(m, 0.02, 0.15)
save('cuckoo', y)

# squeak: a falling squeak with vibrato
n = int(0.5 * SR); t = np.arange(n) / SR
f = 1800 - 1200 * t / 0.5 + 60 * np.sin(2 * np.pi * 18 * t); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.1)
save('squeak', y)

# plop: a low pitch-drop with a little splash
n = int(0.3 * SR); t = np.arange(n) / SR
f = 420 * np.exp(-t * 10) + 120; y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + 0.2 * lowpass(rng.standard_normal(n), 0.2) * np.exp(-t * 30)
save('plop', y)

for nme in ('whoosh', 'thud', 'pop', 'chime', 'fanfare', 'applause'):
    shutil.copy2(ROOT / 'projects/lightning-hit-him-seven-times/audio/sfx' / f'{nme}.wav', OUT / f'{nme}.wav')
src = next(iter(sorted((ROOT / 'projects').glob('*/audio/sfx/flutter.wav'))), None)
if src: shutil.copy2(src, OUT / 'flutter.wav')
for nme in ('desk_bell', 'forest_wind'): shutil.copy2(ROOT / 'assets/audio/horror' / f'{nme}.wav', OUT / f'{nme}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
