"""This short's effects, synthesized into audio/sfx/ (no library sound fits the weather):
rain (a 6 s seamless loop of patter), thunder (rolling rumble), zap (electric crackle), fwoomp (the grill erupting),
fire (crackling loop), hiss (steam), pop (umbrella opening), boing (bounced out), applause (a crowd clapping),
shake (a dog shaking itself dry). whoosh and flutter are copied from Every Lie Comes True.

  python3 source/sfx_assets.py
"""
import shutil, wave
import numpy as np
from pathlib import Path
P = Path(__file__).resolve().parent.parent
O = P / 'audio/sfx'; O.mkdir(parents=True, exist_ok=True)
for n in ('whoosh', 'flutter'):
    shutil.copy(P.parent / 'every-lie-comes-true/audio/sfx' / f'{n}.wav', O)
SR = 48000
rng = np.random.default_rng(23)
t_ = lambda d: np.arange(int(d * SR)) / SR


def save(name, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(str(O / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))


def fade(x, a=0.02, b=0.05):
    n = len(x); e = np.ones(n); ia, ib = int(a * SR), int(b * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return x * e


# rain: steady hiss + thousands of tiny drop ticks; loop seam crossfaded
d = 6.0; t = t_(d); x = band(rng.standard_normal(len(t)), 900, 9000) * 0.35
for i in rng.integers(0, len(t) - 400, 5000): x[i:i + 300] += band(rng.standard_normal(300), 2000, 12000) * np.exp(-np.arange(300) / 40) * rng.uniform(0.2, 1)
k = int(0.3 * SR); x[:k] = x[:k] * np.linspace(0, 1, k) + x[-k:] * np.linspace(1, 0, k); x = x[:-k]
save('rain', x, 0.7)
# thunder: a crack, then a long low roll
t = t_(3.2); x = band(rng.standard_normal(len(t)), 30, 220) * (np.exp(-t * 1.1) * (1 + 0.6 * np.sin(2 * np.pi * 1.7 * t)))
x[: int(0.08 * SR)] += band(rng.standard_normal(int(0.08 * SR)), 300, 6000) * 2
save('thunder', fade(x, 0.002, 0.4))
# zap: buzzy crackle bursts
t = t_(0.5); buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.4 + band(rng.standard_normal(len(t)), 1500, 9000)
gate = (rng.random(len(t) // 400 + 1) > 0.35).repeat(400)[: len(t)]
save('zap', fade(buzz * gate * np.exp(-t * 4), 0.002, 0.08))
# fwoomp: a rising low whoosh into a roar of flame
t = t_(1.6); n = rng.standard_normal(len(t)); lo = band(n, 40, 500); hi = band(n, 500, 4000)
env = np.minimum(1, t / 0.12) * np.exp(-np.maximum(0, t - 0.25) * 2.2)
save('fwoomp', fade(lo * env * 1.4 + hi * env * 0.5, 0.005, 0.3))
# fire: crackling loop (low roar + pops)
d = 4.0; t = t_(d); x = band(rng.standard_normal(len(t)), 60, 700) * 0.5
for i in rng.integers(0, len(t) - 800, 260): x[i:i + 600] += band(rng.standard_normal(600), 1500, 7000) * np.exp(-np.arange(600) / 70) * rng.uniform(0.5, 2.0)
save('fire', fade(x, 0.2, 0.2), 0.7)
# hiss: steam, bright noise with a slow decay
t = t_(2.2); save('hiss', fade(band(rng.standard_normal(len(t)), 3000, 14000) * np.exp(-t * 1.3), 0.01, 0.2))
# pop: umbrella snapping open (click + short swish)
t = t_(0.35); x = band(rng.standard_normal(len(t)), 600, 6000) * np.exp(-t * 18); x[:200] += np.sin(2 * np.pi * 1800 * t[:200]) * 2
save('pop', fade(x, 0.001, 0.05))
# boing: a spring, falling and wobbling pitch
t = t_(0.6); f = 220 + 160 * np.exp(-t * 6) * np.cos(2 * np.pi * 9 * t)
save('boing', fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4), 0.002, 0.1))
# applause: many hands, each clap a short filtered burst
d = 3.0; t = t_(d); x = np.zeros(len(t))
for i in rng.integers(0, len(t) - 2000, 1600):
    c = band(rng.standard_normal(1200), 800, 6000) * np.exp(-np.arange(1200) / 120); x[i:i + 1200] += c * rng.uniform(0.3, 1)
save('applause', fade(x * np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.8), 0.01, 0.1), 0.75)
# shake: wet flapping (fast amplitude-modulated noise)
t = t_(0.9); save('shake', fade(band(rng.standard_normal(len(t)), 300, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / 0.9), 0.01, 0.1))
print(sorted(p.name for p in O.glob('*.wav')))
