"""This short's effects in audio/sfx/. pop, whoosh, fwoomp, hiss and boing come from The Backwards Umbrella, chime from
Every Lie Comes True; crickets ("Nothing."), coins (the prize jingle) and fanfare (the win) are synthesized here.

  python3 source/sfx_assets.py
"""
import shutil, wave
import numpy as np
from pathlib import Path
P = Path(__file__).resolve().parent.parent
O = P / 'audio/sfx'; O.mkdir(parents=True, exist_ok=True)
for n in ('pop', 'whoosh', 'fwoomp', 'hiss', 'boing'):
    shutil.copy(P.parent / 'the-backwards-umbrella/audio/sfx' / f'{n}.wav', O)
shutil.copy(P.parent / 'every-lie-comes-true/audio/sfx/chime.wav', O)
SR = 48000
t_ = lambda d: np.arange(int(d * SR)) / SR


def save(name, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(str(O / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())


def ping(hz, d, decay=6.0):
    t = t_(d); return (np.sin(2 * np.pi * hz * t) + 0.3 * np.sin(2 * np.pi * 2 * hz * t)) * np.exp(-t * decay) * (1 - np.exp(-t * 400))


# crickets: three bursts of fast 4.5 kHz chirps
x = np.zeros(int(1.6 * SR))
for b in (0.0, 0.55, 1.1):
    for k in range(4):
        st = int((b + k * 0.045) * SR); c = ping(4500, 0.03, 90); x[st:st + len(c)] += c
save('crickets', x, 0.5)
# coins: a shower of bright pings
rng = np.random.default_rng(4); x = np.zeros(int(1.4 * SR))
for i in range(22):
    st = int((i * 0.05 + rng.uniform(0, 0.03)) * SR); c = ping(rng.choice([1976, 2349, 2637, 3136]), 0.25, 14); x[st:st + len(c)] += c * rng.uniform(0.4, 1)
save('coins', x, 0.8)
# fanfare: C E G C' arpeggio, then a held chord
x = np.zeros(int(1.6 * SR))
for i, hz in enumerate((523, 659, 784, 1047)):
    st = int(i * 0.1 * SR); c = ping(hz, 0.5, 5); x[st:st + len(c)] += c
st = int(0.42 * SR)
for hz in (523, 659, 784, 1047): c = ping(hz, 1.1, 2.5); x[st:st + len(c)] += 0.6 * c
save('fanfare', x, 0.8)
print('sfx ->', O)
