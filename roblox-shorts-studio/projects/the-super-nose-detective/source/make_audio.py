"""Original synthesized audio for The Super Nose Detective (deterministic, no samples, no third-party music):

    python3 source/make_audio.py   # -> audio/music_funk.wav (70s cop-show funk bed), audio/sniff.wav, audio/achoo.wav, audio/splash.wav

Music: 98 BPM, E minor, 4-bar loop played 8 times (~78 s): kick/snare/hats, a syncopated octave bass, Rhodes-style
minor-9 stabs, a muted 'wah' guitar scratch, and a brass-ish hit on bar 1 of every second loop. finish.py loops and fades it.
"""
import numpy as np, wave
from scipy.signal import lfilter
from pathlib import Path
P = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(1977)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def write(path, x):
    x = np.clip(x / max(1e-9, np.abs(x).max()) * 0.9, -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())


def onepole(x, a):                                     # simple low-pass, a in (0,1): higher = darker
    return lfilter([1 - a], [1, -a], x)


def env(n, att, dec):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


def kick(n=int(0.35 * SR)):
    t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare(n=int(0.22 * SR)):
    t = np.arange(n) / SR; nz = rng.standard_normal(n)
    return (0.7 * (nz - onepole(nz, 0.6)) + 0.4 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 18)


def hat(n=int(0.06 * SR), open_=False):
    n = int((0.22 if open_ else 0.05) * SR); nz = rng.standard_normal(n)
    return (nz - onepole(nz, 0.3)) * np.exp(-np.arange(n) / SR * (12 if open_ else 70)) * 0.35


def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    saw = 2 * ((f * t) % 1) - 1
    return onepole(saw * env(n, 0.004, 0.18), 0.86) * 1.6


def rhodes(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        f = hz(m); out += np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6)) * 0.25
    return out * env(n, 0.005, 0.5) * (1 + 0.15 * np.sin(2 * np.pi * 5 * t))


def scratch(dur, centre):
    n = int(dur * SR); nz = rng.standard_normal(n); t = np.arange(n) / SR
    tone = np.sign(np.sin(2 * np.pi * centre * t)) * 0.4
    x = onepole(nz * 0.3 + tone, 0.5); x = x - onepole(x, 0.95)
    return x * env(n, 0.002, 0.05) * 0.5


def brass(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        f = hz(m); out += sum(np.sin(2 * np.pi * f * k * t) / k ** 0.8 for k in range(1, 7))
    return onepole(out, 0.4) * env(n, 0.02, 0.35) * 0.12


def music():
    bpm = 98; beat = 60 / bpm; bar = 4 * beat; loops = 8; n = int(loops * 4 * bar * SR) + SR
    mix = np.zeros(n)
    def add(x, t, g=1.0):
        i = int(t * SR); mix[i:i + len(x)] += g * x[:max(0, n - i)]
    # E minor groove: bars i..iv over Em9 | Em9 | Am9 | B7#9-ish
    chords = [[52, 55, 59, 62, 66], [52, 55, 59, 62, 66], [57, 60, 64, 67, 71], [59, 63, 66, 69, 74]]
    roots = [40, 40, 45, 47]
    bass_pat = [(0, 0, 0.3), (0.75, 12, 0.15), (1.5, 0, 0.2), (2, 7, 0.2), (2.5, 10, 0.2), (3, 12, 0.15), (3.5, 10, 0.15), (3.75, 7, 0.2)]
    for L in range(loops):
        for b in range(4):
            t0 = (L * 4 + b) * bar
            for k in range(4): add(kick(), t0 + k * beat, 0.9 if k in (0, 2) else 0.0)
            add(kick(), t0 + 2.5 * beat, 0.6)
            for k in (1, 3): add(snare(), t0 + k * beat, 0.55)
            for k in range(8): add(hat(open_=(k == 7)), t0 + k * beat / 2, 0.5 if k % 2 else 0.8)
            for off, iv, d in bass_pat: add(bass(roots[b] + iv, d * beat * 2), t0 + off * beat, 0.55)
            for off in (0.5, 1.75, 2.5): add(rhodes(chords[b], 0.4), t0 + off * beat, 0.32)
            for k in range(16):
                if k % 4 in (1, 3) or k in (6, 14): add(scratch(0.08, 900 + 500 * np.sin(k)), t0 + k * beat / 4, 0.35)
            if L % 2 == 0 and b == 0: add(brass([64, 67, 71], 0.5), t0, 0.9); add(brass([62, 66, 69], 0.6), t0 + 3.5 * beat, 0.7)
    mix = np.tanh(mix * 0.9)
    return mix


def sniff():
    n = int(0.32 * SR); nz = rng.standard_normal(n); t = np.arange(n) / SR
    x = nz - onepole(nz, 0.85); x = onepole(x, 0.3)
    return x * np.minimum(1, t / 0.12) * np.exp(-np.maximum(0, t - 0.14) * 30)


def achoo():
    n = int(0.9 * SR); t = np.arange(n) / SR; nz = rng.standard_normal(n)
    ah = np.sin(2 * np.pi * np.cumsum(220 + 180 * t) / SR) * np.minimum(1, t / 0.2) * (t < 0.42) * 0.6        # the rising "ahh"
    choo = (nz - onepole(nz, 0.7)) * (t > 0.45) * np.exp(-np.maximum(0, t - 0.45) * 7) * 1.4                   # the burst
    body = np.sin(2 * np.pi * 140 * t) * (t > 0.45) * np.exp(-np.maximum(0, t - 0.45) * 10) * 0.6
    return ah + choo + body


def splash():
    n = int(1.2 * SR); t = np.arange(n) / SR; nz = rng.standard_normal(n)
    x = onepole(nz, 0.5) * np.exp(-t * 4) + 0.3 * np.sin(2 * np.pi * 90 * t) * np.exp(-t * 12)
    for k in range(10):                                 # bubbles
        i = int((0.25 + 0.08 * k) * SR); m = int(0.06 * SR); tt = np.arange(m) / SR
        x[i:i + m] += 0.25 * np.sin(2 * np.pi * (500 + 120 * k) * tt * (1 + 3 * tt)) * np.exp(-tt * 50)
    return x


if __name__ == '__main__':
    out = P / 'audio'; out.mkdir(exist_ok=True)
    for name, fn in (('sniff', sniff), ('achoo', achoo), ('splash', splash), ('music_funk', music)):
        write(out / f'{name}.wav', fn()); print('wrote', out / f'{name}.wav')
