"""Synthesizes this short's own effects into audio/sfx/ (no library sound fits a dragon):
roar, glass (shatter), chomp, chime (the "lie comes true" motif, same every time), rewind, flutter (cash), clang (bike),
whoosh (super speed), thud (dragon on the roof).

  python3 source/sfx_assets.py
"""
import wave
import numpy as np
from pathlib import Path
P = Path(__file__).resolve().parent.parent
O = P / 'audio/sfx'; O.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR


def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    with wave.open(str(O / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())


def lowpass(x, hz):
    a = np.exp(-2 * np.pi * hz / SR); y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x): acc = (1 - a) * v + a * acc; y[i] = acc
    return y


def env(t, a, d):  # attack, decay time constants
    return (1 - np.exp(-t / a)) * np.exp(-t / d)


# Roar: a growl (pulsed low saw with wobbling pitch) under filtered breath noise, swelling then fading.
t = t_(1.8); f = 75 + 25 * np.sin(2 * np.pi * 1.3 * t) + 18 * np.sin(2 * np.pi * 7 * t)
ph = 2 * np.pi * np.cumsum(f) / SR
saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
growl = saw * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 28 * t)))
breath = lowpass(rng.standard_normal(len(t)), 900)
shape = np.minimum(1, t / 0.25) * np.exp(-np.maximum(0, t - 0.9) / 0.4)
save('roar', lowpass(growl * 0.8 + breath * 2.5, 1600) * shape)

# Glass: many short bright pings + a noise crack.
t = t_(1.4); x = rng.standard_normal(len(t)) * env(t, 0.001, 0.06) * 0.8
for _ in range(40):
    s = rng.uniform(0, 0.9); f = rng.uniform(2500, 7000); k = (t >= s)
    x += k * np.sin(2 * np.pi * f * (t - s)) * np.exp(-(t - s) * rng.uniform(20, 45)) * rng.uniform(0.1, 0.35)
save('glass', x)

# Chomp: two quick low knocks (jaws) with a crunch.
t = t_(0.35); x = np.zeros(len(t))
for s, g in ((0.0, 1.0), (0.11, 0.7)):
    k = t >= s; tt = t - s
    x += k * (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 30) + lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-tt * 40) * 0.8) * g
save('chomp', x)

# Chime: a rising magical arpeggio with a shimmer tail (the lie becoming true).
t = t_(1.2); x = np.zeros(len(t))
for i, f in enumerate([784, 988, 1175, 1568, 1976]):
    s = i * 0.06; k = t >= s; tt = t - s
    x += k * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 4.5)
x += np.sin(2 * np.pi * 2637 * t) * 0.15 * np.sin(2 * np.pi * 14 * t) * env(t, 0.2, 0.4)
save('chime', x)

# Rewind: tape-style descending-to-rising warble.
t = t_(0.45); f = 300 + 1600 * (t / 0.45) ** 2 + 120 * np.sin(2 * np.pi * 30 * t)
x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + lowpass(rng.standard_normal(len(t)), 3000) * 0.5
save('rewind', lowpass(x, 3500) * np.minimum(1, t / 0.05) * np.minimum(1, (0.45 - t) / 0.08))

# Flutter: paper bills, lots of short soft noise ticks.
t = t_(2.6); x = np.zeros(len(t)); n = rng.standard_normal(len(t))
for _ in range(160):
    s = rng.uniform(0, 2.4); k = (t >= s) & (t < s + 0.04)
    x += k * n * np.exp(-(t - s) * 80) * rng.uniform(0.2, 0.6)
save('flutter', lowpass(x, 5000) * np.minimum(1, (2.6 - t) / 0.4))

# Clang: bike frame hitting the trunk (metal partials + thud).
t = t_(0.9); x = np.sin(2 * np.pi * 60 * t) * np.exp(-t * 12) * 1.2
for f, d in ((523, 6), (1370, 9), (2210, 12), (3110, 15)):
    x += np.sin(2 * np.pi * f * t) * np.exp(-t * d) * 0.35
save('clang', x + lowpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 25))

# Whoosh: filtered noise sweeping up and away (super speed).
t = t_(0.8); n = rng.standard_normal(len(t)); x = lowpass(n, 600) * env(t, 0.05, 0.25) + (n - lowpass(n, 2000)) * 0.4 * env(t, 0.02, 0.15)
save('whoosh', x)

# Thud: something huge landing (sub thump + rumble).
t = t_(1.5); x = np.sin(2 * np.pi * (48 - 12 * t) * t) * np.exp(-t * 3.5) * 1.4 + lowpass(rng.standard_normal(len(t)), 300) * np.exp(-t * 2.5) * 2
save('thud', x)
print('wrote', sorted(p.name for p in O.glob('*.wav')))
