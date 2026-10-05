"""Builds audio/sfx/ for The Tornado Came Back: synthesizes what the library lacks and copies the rest.

  python3 source/make_sfx.py      # from the project dir (numpy only)

Synthesized here (original, deterministic): tornado (a low freight-train roar with a whistling top, 6 s, loopable),
siren (an air-raid wail up and down, 3.2 s), radar_ping (a sonar blip), buzz (a phone buzzing, 0.9 s), hangar_roll
(steel doors rumbling on a track, 1.6 s, ending in a clang), typewriter (a burst of key clacks and a carriage ding,
1.4 s). Copied: thunder, rain, whoosh, thud, pop, chime, fanfare, applause, fwoomp (The Backwards Umbrella /
Lightning Hit Him Seven Times, synthesized there), clang and flutter (other projects), desk_bell and forest_wind (the
horror library, assets/audio/horror)."""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(1948)

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

# tornado: brown-ish rumble + a slow-swirling mid roar + a faint high whistle; crossfaded ends so it loops
n = int(6.0 * SR); t = np.arange(n) / SR
noise = rng.standard_normal(n)
rumble = lowpass(noise, 0.004) * 9
roar = bandish(rng.standard_normal(n), 0.01, 0.05) * (0.8 + 0.25 * np.sin(2 * np.pi * 0.7 * t) + 0.15 * np.sin(2 * np.pi * 1.9 * t))
whistle = bandish(rng.standard_normal(n), 0.12, 0.2) * (0.12 + 0.08 * np.sin(2 * np.pi * 0.45 * t))
y = rumble + roar * 1.4 + whistle
f = int(0.5 * SR); y[:f] = y[:f] * np.linspace(0, 1, f) + y[-f:] * np.linspace(1, 0, f); y = y[:-f]
save('tornado', y)

# siren: wail up, hold, down (two detuned oscillators, slightly square)
n = int(3.2 * SR); t = np.arange(n) / SR
hz = 330 + 420 * np.clip(np.sin(np.pi * t / 3.2), 0, 1) ** 0.6
ph = 2 * np.pi * np.cumsum(hz) / SR
y = np.tanh(2.2 * np.sin(ph)) + 0.6 * np.tanh(2.2 * np.sin(ph * 1.01)); y *= env(n, 0.3, 0.6)
save('siren', lowpass(y, 0.25))

# radar ping: a soft sonar blip with a ring-out
n = int(0.9 * SR); t = np.arange(n) / SR
y = np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 6) + 0.3 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 12); y *= np.minimum(1, t / 0.004)
save('radar_ping', y)

# phone buzz: two short buzzes (a 150 Hz rattle)
n = int(0.9 * SR); t = np.arange(n) / SR
gate = ((t % 0.45) < 0.3).astype(float); y = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 300 * t) * 0.3
save('buzz', lowpass(y * gate, 0.2))

# hangar doors: a rolling rumble with track clatter, then a steel clang
n = int(1.6 * SR); t = np.arange(n) / SR
y = lowpass(rng.standard_normal(n), 0.01) * 6 * env(n, 0.15, 0.3) + 0.25 * np.sign(np.sin(2 * np.pi * 9 * t)) * lowpass(rng.standard_normal(n), 0.05) * 3 * env(n, 0.1, 0.4)
c0 = int(1.25 * SR); tc = np.arange(n - c0) / SR
clang = sum(np.sin(2 * np.pi * f0 * tc) * np.exp(-tc * d) for f0, d in [(220, 4), (557, 6), (893, 7), (1410, 9)])
y[c0:] += clang * 0.9
save('hangar_roll', y)

# typewriter: key clacks at an uneven typing rhythm, then the carriage-return ding
n = int(1.4 * SR); y = np.zeros(n)
times = np.cumsum(rng.uniform(0.06, 0.13, 13)); times = times[times < 1.05]
for k in times:
    i = int(k * SR); m = int(0.035 * SR); tk = np.arange(m) / SR
    y[i:i + m] += (rng.standard_normal(m) * np.exp(-tk * 160) * 0.8 + np.sin(2 * np.pi * 1800 * tk) * np.exp(-tk * 200) * 0.5)[: n - i]
i = int(1.12 * SR); tk = np.arange(n - i) / SR; y[i:] += 0.5 * np.sin(2 * np.pi * 2637 * tk) * np.exp(-tk * 7)
save('typewriter', y)

# copied
srcs = {
    'thunder': 'lightning-hit-him-seven-times', 'rain': 'lightning-hit-him-seven-times', 'whoosh': 'lightning-hit-him-seven-times',
    'thud': 'lightning-hit-him-seven-times', 'pop': 'lightning-hit-him-seven-times', 'chime': 'lightning-hit-him-seven-times',
    'fanfare': 'lightning-hit-him-seven-times', 'applause': 'lightning-hit-him-seven-times', 'fwoomp': 'lightning-hit-him-seven-times',
}
for nme, proj in srcs.items(): shutil.copy2(ROOT / 'projects' / proj / 'audio/sfx' / f'{nme}.wav', OUT / f'{nme}.wav')
for nme in ('clang', 'flutter'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{nme}.wav'))), None)
    if src: shutil.copy2(src, OUT / f'{nme}.wav')
for nme in ('desk_bell', 'forest_wind'): shutil.copy2(ROOT / 'assets/audio/horror' / f'{nme}.wav', OUT / f'{nme}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
