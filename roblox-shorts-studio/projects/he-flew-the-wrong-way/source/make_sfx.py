"""Builds audio/sfx/ for He Flew The Wrong Way: synthesizes what the library lacks and copies the rest.

  python3 source/make_sfx.py      # from the project dir (numpy only)

Synthesized here (original, deterministic): engine (a 1930s radial engine drone with prop chop, 4 s, loopable),
sputter (the engine coughing into life, 1.2 s), drip (a single fuel drip plip), horn (an ocean liner's two-tone horn,
2.6 s), waves (sea wash with slow swells, 6 s, loopable), telegraph (a run of telegraph key beeps, 1.6 s), crowd (a
cheering crowd's roar with swells, 5 s, loopable). Copied: thunder, whoosh, thud, pop, chime, fanfare, applause
(Lightning Hit Him Seven Times), clang and flutter (other projects), desk_bell and forest_wind (the horror library,
assets/audio/horror)."""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(1938)

def save(name, y):
    y = np.asarray(y, dtype=np.float64); y = y / (np.max(np.abs(y)) + 1e-9) * 0.9
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())

def lowpass(x, a):                       # one-pole low-pass, a in (0, 1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

def bandish(x, lo, hi):                  # crude band-pass: difference of two low-passes
    return lowpass(x, hi) - lowpass(x, lo)

def env(n, att, rel):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(att, 1e-4)) * np.minimum(1, (n / SR - t) / max(rel, 1e-4)); return np.clip(e, 0, 1)

def loop_fade(y, sec=0.4):               # crossfade the tail into the head so the clip loops
    f = int(sec * SR); y = y.copy(); y[:f] = y[:f] * np.linspace(0, 1, f) + y[-f:] * np.linspace(1, 0, f); return y[:-f]

# engine: firing pulses (~22 Hz, nine cylinders blur into a buzz) + exhaust rumble + prop chop
n = int(4.4 * SR); t = np.arange(n) / SR
fire = 22.0 * (1 + 0.01 * np.sin(2 * np.pi * 0.6 * t))
ph = 2 * np.pi * np.cumsum(fire) / SR
pulses = np.maximum(0, np.sin(ph)) ** 6 + 0.6 * np.maximum(0, np.sin(ph * 2 + 0.7)) ** 8
buzz = lowpass(pulses + 0.15 * rng.standard_normal(n), 0.08)
rumble = lowpass(rng.standard_normal(n), 0.006) * 5
chop = 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * 37 * t)) * bandish(rng.standard_normal(n), 0.02, 0.12)
save('engine', loop_fade(buzz * 2.2 + rumble + chop))

# sputter: a few coughs, then the drone catches
n = int(1.2 * SR); y = np.zeros(n)
for k in (0.0, 0.18, 0.31, 0.52):
    i = int(k * SR); m = int(0.12 * SR); tk = np.arange(m) / SR
    y[i:i + m] += (lowpass(rng.standard_normal(m), 0.05) * 5 * np.exp(-tk * 30))[: n - i]
i = int(0.62 * SR); tt = np.arange(n - i) / SR
y[i:] += lowpass(np.maximum(0, np.sin(2 * np.pi * 22 * tt)) ** 6 + 0.1 * rng.standard_normal(n - i), 0.08) * 2 * np.minimum(1, tt / 0.3)
save('sputter', y)

# drip: a falling-pitch plip
n = int(0.25 * SR); t = np.arange(n) / SR
f0 = 1400 * np.exp(-t * 18) + 500; y = np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.002)
save('drip', y)

# ship horn: two low tones a minor third apart, reedy, slow attack and release
n = int(2.6 * SR); t = np.arange(n) / SR
y = sum(a * np.tanh(1.6 * np.sin(2 * np.pi * f * t)) for f, a in ((98, 1.0), (116.5, 0.8), (196, 0.25), (233, 0.2)))
y = lowpass(y, 0.12) * env(n, 0.25, 0.6)
save('horn', y)

# waves: sea wash, slow swells
n = int(6.4 * SR); t = np.arange(n) / SR
y = bandish(rng.standard_normal(n), 0.004, 0.06) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 3.2) ** 2)
save('waves', loop_fade(y))

# telegraph: dits and dahs at 700 Hz
n = int(1.6 * SR); y = np.zeros(n); k = 0.0
for d in 'dddaddaadaddda':
    L = 0.06 if d == 'd' else 0.18; i = int(k * SR); m = int(L * SR); tk = np.arange(m) / SR
    y[i:i + m] += (np.sin(2 * np.pi * 700 * tk) * np.minimum(1, np.minimum(tk, L - tk) / 0.004))[: n - i]; k += L + 0.05
    if k > 1.5: break
save('telegraph', y)

# crowd: many voices as band-limited noise with cheering swells and a few whistles
n = int(5.4 * SR); t = np.arange(n) / SR
y = bandish(rng.standard_normal(n), 0.02, 0.12) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.35 * t) + 0.15 * np.sin(2 * np.pi * 1.3 * t))
for k in (0.8, 2.6, 4.1):
    i = int(k * SR); m = int(0.5 * SR); tk = np.arange(m) / SR
    y[i:i + m] += 0.12 * np.sin(2 * np.pi * np.cumsum(2200 + 600 * np.sin(np.pi * tk / 0.5)) / SR) * env(m, 0.05, 0.15)
save('crowd', loop_fade(y))

# copied
for nme in ('thunder', 'whoosh', 'thud', 'pop', 'chime', 'fanfare', 'applause'):
    shutil.copy2(ROOT / 'projects/lightning-hit-him-seven-times/audio/sfx' / f'{nme}.wav', OUT / f'{nme}.wav')
for nme in ('clang', 'flutter'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{nme}.wav'))), None)
    if src: shutil.copy2(src, OUT / f'{nme}.wav')
for nme in ('desk_bell', 'forest_wind'): shutil.copy2(ROOT / 'assets/audio/horror' / f'{nme}.wav', OUT / f'{nme}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
