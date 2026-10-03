"""Original score + stadium bed for The Last Penalty, synthesised to the story's timing (web/timeline.js EVENTS,
crowdAt, and the narration's word anchors), written to audio/score.wav and used as the finish music bed.

  python3 source/score.py     # after source/beats.py

Layers: a stadium crowd (filtered noise that follows crowdAt: hushed, roaring, gone silent); a low D-minor pulse
that drives the replays and the first kick; a heartbeat through the slow motion and the long wait; risers into the
kicks; stingers on the save, the whistle and the scuff; near silence while she waits on her line; a warm major
swell from the boot to the end. Deterministic (fixed seed), no samples: provenance is this script.
"""
import json, subprocess, wave
from pathlib import Path
import numpy as np

P = Path(__file__).resolve().parent.parent
SR = 48000
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
SECONDS = json.loads((P / 'source/project.json').read_text())['seconds']
js = ("import('./web/timeline.js').then((m) => { const c = []; for (let t = 0; t <= %f; t += 0.05) c.push(m.crowdAt(t));"
      " console.log(JSON.stringify({ E: m.EVENTS, crowd: c })); })" % (SECONDS + 1))
D = json.loads(subprocess.run(['node', '-e', js], cwd=P, capture_output=True, text=True, check=True).stdout)
E, CROWD = D['E'], np.array(D['crowd'])
N = int(SECONDS * SR) + SR
t = np.arange(N) / SR
rng = np.random.default_rng(1207)
out = np.zeros(N)


def env(points):
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def lowpass(x, hz, passes=2):
    k = max(1, int(SR / (hz * 2.2))); ker = np.ones(k) / k
    for _ in range(passes): x = np.convolve(x, ker, mode='same')
    return x


def add(sig, start):
    i = int(start * SR)
    if i >= N or i + len(sig) <= 0: return
    a = max(0, -i); i = max(0, i); j = min(N, i + len(sig) - a); out[i:j] += sig[a: a + j - i]


crowd = np.interp(t, np.arange(len(CROWD)) * 0.05, CROWD)
R0, R1 = E['replay']
inReplay = env([(0, 0), (R0 - 0.01, 0), (R0, 1), (R1, 1), (R1 + 0.01, 0)])

# ---------- stadium: two noise bands (murmur + roar) following the crowd, with slow surges ----------
noise = rng.standard_normal(N)
murmur = lowpass(noise, 500) - lowpass(noise, 120)
roar = lowpass(noise, 2400) - lowpass(noise, 400)
surge = 0.8 + 0.2 * np.sin(2 * np.pi * 0.17 * t) * np.sin(2 * np.pi * 0.41 * t + 1)
mm, rr = np.abs(murmur).max(), np.abs(roar).max()
out += 0.30 * murmur / mm * (0.15 + 0.85 * crowd) * surge
out += 0.32 * roar / rr * np.clip(crowd - 0.45, 0, 1) ** 1.3 * surge

# ---------- tension curve (0 calm .. 1 peak) for the music ----------
tension = env([
    (0, 0.45), (W['cup'], 0.5), (W['leo'], 0.45), (R0, 0.6), (R1, 0.7), (E['flick'], 0.8), (E['kick1'], 1.0),
    (E['hit1'], 1.0), (E['hit1'] + 0.4, 0.7), (E['whistle'] - 0.05, 0.7), (E['whistle'], 0.0), (E['reset'], 0.0),
    (E['reset'] + 0.6, 0.45), (E['close'], 0.6), (W['hardest'], 0.7), (W['stay'], 0.75), (W['stay'] + 0.4, 0.0),
    (E['run2'] - 0.2, 0.0), (E['run2'], 0.85), (E['kick2'] - 0.02, 1.0), (E['kick2'] + 0.02, 0.0), (SECONDS, 0.0),
])
quiet = env([(0, 1), (W['stay'] + 0.2, 1), (W['stay'] + 0.6, 0), (E['run2'] - 0.1, 0), (E['run2'], 1)])   # she waits

# ---------- pulse: low D-minor ostinato in eighths, 100 bpm (the replay montage runs it harder) ----------
BPM = 100; step = 60 / BPM / 2
notes = [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 87.31, 110.0]    # D2 D2 F2 D2 G2 D2 F2 A2
def pluck(f, dur=0.26, gain=1.0):
    n = int(dur * SR); x = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * f * x)) * 0.35 + np.sin(2 * np.pi * f * x) + 0.4 * np.sin(4 * np.pi * f * x)
    return gain * lowpass(s, 700, 1) * np.exp(-x * 9)
x, i = 0.0, 0
while x < E['kick2'] + 0.1:
    g = float(np.interp(x, t[::480], tension[::480])) * float(np.interp(x, t[::480], quiet[::480]))
    g *= 1.25 if R0 <= x < R1 else 1.0
    if g > 0.05: add(pluck(notes[i % 8], gain=0.22 * g), x)
    x += step; i += 1

# ---------- kick drum + snare on the replays and the run-up to kick 1 ----------
def kick(gain=1.0):
    n = int(0.4 * SR); x = np.arange(n) / SR
    return gain * np.sin(2 * np.pi * (110 * np.exp(-x * 18) + 45) * x) * np.exp(-x * 8)
def snare(gain=1.0):
    n = int(0.25 * SR); x = np.arange(n) / SR
    return gain * (0.6 * rng.standard_normal(n) * np.exp(-x * 22) + 0.4 * np.sin(2 * np.pi * 190 * x) * np.exp(-x * 30))
x = R0
while x < E['dive1'] - 0.2:
    b = round((x - R0) / (60 / BPM)); add(kick(0.55), x)
    if b % 2: add(snare(0.25), x)
    x += 60 / BPM

# ---------- heartbeat: the slow motion, then the long wait (slowing, then racing as he runs) ----------
def heartbeat(gain=1.0):
    n = int(0.35 * SR); x = np.arange(n) / SR
    lub = np.sin(2 * np.pi * (60 - 25 * x) * x) * np.exp(-x * 22)
    dub = np.zeros(n); k = int(0.17 * SR); dub[k:] = 0.7 * np.sin(2 * np.pi * 52 * x[: n - k]) * np.exp(-x[: n - k] * 26)
    return gain * (lub + dub)
beats = []
def run(a, b, bpm0, bpm1, g):
    x = a
    while x < b:
        beats.append((x, g)); bpm = bpm0 + (bpm1 - bpm0) * (x - a) / max(1e-6, b - a); x += 60 / bpm
run(E['slowFrom'], E['hit1'] - 0.1, 50, 44, 0.75)                 # slow motion: huge, slow beats
run(E['reset'] + 0.3, W['stay'], 78, 96, 0.45)
run(W['stay'] + 0.2, E['run2'], 70, 64, 0.6)                      # she waits: only the heart
run(E['run2'], E['kick2'] - 0.1, 120, 150, 0.7)
for b, g in beats: add(heartbeat(g), b)

# ---------- risers into the kicks ----------
def riser(dur, gain=0.3):
    n = int(dur * SR); x = np.arange(n) / SR; u = x / dur
    nz = lowpass(rng.standard_normal(n), 1800) * u ** 2
    tone = np.sin(2 * np.pi * (160 * x + 0.5 * (820 - 160) / dur * x * x)) * u ** 3
    return gain * (0.6 * nz / (np.abs(nz).max() + 1e-9) + 0.4 * tone)
for at, d, g in ((E['flick'], 1.6, 0.25), (E['kick1'], 2.2, 0.3), (E['kick2'], E['kick2'] - E['run2'], 0.3)):
    add(riser(d, g), at - d)

# ---------- stingers ----------
def sting(gain=0.6, root=73.42, minor=True, dur=2.4):
    n = int(dur * SR); x = np.arange(n) / SR
    third = 1.189 if minor else 1.26
    body = sum(np.sin(2 * np.pi * f * x + p) for f, p in ((root, 0), (root * 2, 1), (root * 2 * third, 2), (root * 3, 3)))
    crack = rng.standard_normal(n) * np.exp(-x * 30)
    return gain * (0.2 * body * np.exp(-x * 1.4) + 0.3 * crack)
for at, g, m in ((0.05, 0.55, True), (E['hit1'], 0.9, False), (E['whistle'], 0.8, True), (E['freeze'][0] + 0.2, 0.35, True),
                 (E['close'], 0.5, True), (E['kick2'] + 0.03, 0.4, True)):
    add(sting(g, minor=m), at)

# ---------- the end: a warm D-major swell from the boot, peaking with the celebration ----------
swell = env([(0, 0), (E['boot'] - 0.1, 0), (E['boot'] + 1.2, 0.5), (E['down'], 0.6), (E['celebrate'], 1), (SECONDS - 1.2, 1), (SECONDS, 0)])
chord = sum(np.sin(2 * np.pi * f * t + k) for k, f in enumerate((73.42, 146.83, 185.0, 220.0, 293.66, 369.99)))
chord *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * t)
out += 0.06 * lowpass(chord, 1500, 1) * swell
for k in range(int((SECONDS - E['celebrate']) / (60 / 120))):     # the celebration: a bright 120 bpm stomp
    at = E['celebrate'] + k * 0.5; add(kick(0.5), at)
    if k % 2: add(snare(0.3), at)

# ---------- room ----------
ir_n = int(0.8 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 6); ir[0] = 1.0; ir /= np.abs(ir).sum() ** 0.5 * 4
wet = np.fft.irfft(np.fft.rfft(out, 2 * N) * np.fft.rfft(ir, 2 * N))[:N]
mix = 0.8 * out + 0.4 * wet
mix = mix[: int(SECONDS * SR)]
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
with wave.open(str(P / 'audio/score.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('score', round(len(mix) / SR, 2), 's,', len(beats), 'heartbeats')
