"""Original suspense score for Which Max Is Real?, synthesised to the story's timing (web/timeline.js EVENTS and the
narration's word anchors), written to audio/score.wav and used as the finish music bed.

  python3 source/score.py     # after source/beats.py

Layers: a low dissonant drone; a string-like cluster pad that swells with the tension; a heartbeat whose tempo follows
the story (one beat per backwards step); noise+sine risers into the reveals; low cluster stingers on the big moments;
war-drum toms for the sprint; dead silence when the copy stops; a quiet resolved chord after the slam. Deterministic
(fixed seed), no samples: provenance is this script.
"""
import json, subprocess, wave
from pathlib import Path
import numpy as np

P = Path(__file__).resolve().parent.parent
SR = 48000
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
E = json.loads(subprocess.run(['node', '-e', "import('./web/timeline.js').then((m) => console.log(JSON.stringify(m.EVENTS)))"], cwd=P, capture_output=True, text=True, check=True).stdout)
SECONDS = json.loads((P / 'source/project.json').read_text())['seconds']
N = int(SECONDS * SR) + SR
t = np.arange(N) / SR
rng = np.random.default_rng(1206)
out = np.zeros(N)


def env(points):
    """Piecewise-linear envelope from [(time, value), ...]."""
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


def lowpass_fast(x, hz, passes=2):
    """Cheap low-pass: repeated moving average."""
    k = max(1, int(SR / (hz * 2.2)))
    ker = np.ones(k) / k
    for _ in range(passes):
        x = np.convolve(x, ker, mode='same')
    return x


def add(sig, start):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += sig[: j - i]


# ---------- tension curve (0 calm .. 1 peak) ----------
tension = env([
    (0, 0.2), (E['lightOn'], 0.35), (W['order'], 0.4), (W['raisedLeft'], 0.6), (W['saidLeft'] + 1, 0.45),
    (E['tilt'], 0.65), (E['lunge'], 0.9), (E['land'] + 1.5, 0.6), (E['steps'][0], 0.65), (E['last'], 0.9),
    (E['last'] + 0.05, 0.0), (W['fighting'] - 0.1, 0.0), (W['fighting'], 0.9), (E['sprint'], 1.0), (E['through'], 1.0),
    (E['slam'], 1.0), (E['slam'] + 2.5, 0.25), (E['gone'], 0.2), (E['nothing'], 0.12), (SECONDS, 0.05),
])
silence = 1 - env([(E['last'] - 0.01, 0), (E['last'] + 0.05, 1), (W['fighting'] - 0.05, 1), (W['fighting'], 0)])   # it stopped: nothing

# ---------- drone: A1 + Bb1 (rubbing) + E2, slow beating ----------
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t)
drone = (np.sin(2 * np.pi * 55 * t) + 0.7 * np.sin(2 * np.pi * 58.27 * t + 1) + 0.5 * np.sin(2 * np.pi * 82.41 * t + 2)
         + 0.25 * np.sin(2 * np.pi * 110 * t + 0.5) * lfo)
out += 0.16 * drone * (0.25 + 0.9 * tension) * silence

# ---------- cluster pad: detuned saws A2 C3 Eb3 (+ Bb3 at the peak), low-passed, tremolo when it fights ----------
def saw(f):
    ph = (f * t + rng.random()) % 1.0
    return 2 * ph - 1
pad = sum(saw(f * d) for f in (110, 130.81, 155.56) for d in (0.997, 1.0, 1.004))
pad += env([(0, 0), (E['last'], 0), (W['fighting'], 1), (E['slam'], 1), (E['slam'] + 1, 0)]) * sum(saw(233.08 * d) for d in (0.996, 1.004))
pad = lowpass_fast(pad, 900)
trem = 1 - 0.6 * env([(0, 0), (W['fighting'], 0), (W['fighting'] + 0.1, 1), (E['through'], 1), (E['through'] + 0.1, 0)]) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t))
out += 0.05 * pad * np.clip(tension - 0.3, 0, 1) * 1.4 * trem * silence

# ---------- heartbeat: lub-dub, tempo follows the story; on the steps, one beat per step ----------
def heartbeat(gain=1.0):
    n = int(0.35 * SR); x = np.arange(n) / SR
    lub = np.sin(2 * np.pi * (60 - 25 * x) * x) * np.exp(-x * 22)
    dub = np.zeros(n); k = int(0.17 * SR); dub[k:] = 0.7 * np.sin(2 * np.pi * 52 * (x[: n - k])) * np.exp(-x[: n - k] * 26)
    return gain * (lub + dub)
beats = []
def run(a, b, bpm0, bpm1):
    x = a
    while x < b:
        beats.append(x); bpm = bpm0 + (bpm1 - bpm0) * (x - a) / max(1e-6, b - a); x += 60 / bpm
run(0.2, E['tilt'], 62, 74)
run(E['tilt'], E['lunge'], 80, 110)
run(E['land'] + 0.4, E['steps'][0] - 0.3, 86, 92)
beats += [s + 0.05 for s in E['steps']]
for a, b in zip(E['steps'], E['steps'][1:] + [E['last']]): run(a + 0.5, b - 0.25, 100, 112)
run(W['fighting'], E['sprint'] - 0.05, 128, 160)
for b in beats: add(heartbeat(0.2 + 0.55 * float(np.interp(b, t[::480], tension[::480]))), b)

# ---------- risers into the reveals ----------
def riser(dur, gain=0.25):
    n = int(dur * SR); x = np.arange(n) / SR; u = x / dur
    noise = lowpass_fast(rng.standard_normal(n), 300 + 4000 * 0.5) * u ** 2
    tone = np.sin(2 * np.pi * (180 * x + 0.5 * (900 - 180) / dur * x * x)) * u ** 3
    return gain * (0.6 * noise / (np.abs(noise).max() + 1e-9) + 0.4 * tone)
for at, d in ((E['lightOn'], 2.2), (W['raisedLeft'], 2.0), (E['lunge'], 2.6), (E['sprint'], 3.0), (E['through'], 1.6)):
    add(riser(d), at - d)

# ---------- stingers: low dissonant cluster hits with a noise crack ----------
def sting(gain=0.6, low=1.0, dur=2.4):
    n = int(dur * SR); x = np.arange(n) / SR
    body = sum(np.sin(2 * np.pi * f * low * x + p) for f, p in ((55, 0), (58.27, 1), (110, 2), (116.5, 3), (164.8, 4)))
    crack = rng.standard_normal(n) * np.exp(-x * 30)
    return gain * (0.22 * body * np.exp(-x * 1.6) + 0.35 * crack)
for at, g in ((0.05, 0.6), (E['lightOn'], 0.7), (W['raisedLeft'] + 0.05, 0.8), (W['star'], 0.45), (E['tilt'] + 0.1, 0.6),
              (E['lunge'] + 0.08, 1.0), (E['land'], 0.6), (W['fighting'], 0.9), (E['sprint'], 0.9), (E['through'], 1.0),
              (E['slam'], 1.2)):
    add(sting(g), at)

# ---------- war-drum toms for the sprint and the drag ----------
def tom(gain=0.6):
    n = int(0.5 * SR); x = np.arange(n) / SR
    return gain * np.sin(2 * np.pi * (95 - 50 * x) * x) * np.exp(-x * 9)
x = E['sprint']
while x < E['through']:
    add(tom(0.7), x); add(tom(0.45), x + 0.19); x += 0.38

# ---------- after the slam: two thuds from the other side are SFX; then a resolved chord, quiet ----------
res = env([(0, 0), (E['gone'] - 0.2, 0), (E['gone'] + 1.5, 1), (E['nothing'] - 0.3, 1), (E['nothing'] + 0.4, 0.15), (SECONDS, 0)])
chord = sum(np.sin(2 * np.pi * f * t) for f in (110, 138.59, 164.81, 220)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.3 * t))
out += 0.035 * chord * res
# ...and one high, thin tone over the empty corridor.
eerie = env([(0, 0), (E['nothing'] + 0.3, 0), (E['nothing'] + 1.5, 1), (SECONDS - 1, 0.6), (SECONDS, 0)])
out += 0.02 * np.sin(2 * np.pi * 1760 * t + 3 * np.sin(2 * np.pi * 0.5 * t)) * eerie

# ---------- room: a short decaying-noise reverb ----------
ir_n = int(0.9 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 5.5); ir[0] = 1.0; ir /= np.abs(ir).sum() ** 0.5 * 4
wet = np.fft.irfft(np.fft.rfft(out, 2 * N) * np.fft.rfft(ir, 2 * N))[:N]
mix = (0.75 * out + 0.45 * wet) * silence ** 2                # the silence is real silence (no reverb tail)
mix = mix[: int(SECONDS * SR)]
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
with wave.open(str(P / 'audio/score.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
print('score', round(len(mix) / SR, 2), 's,', len(beats), 'heartbeats')
