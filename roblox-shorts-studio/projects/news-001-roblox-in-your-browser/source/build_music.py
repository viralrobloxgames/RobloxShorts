"""News music bed for ViralRoblox News #1: "News Theme" by Kevin MacLeod (incompetech.com, CC BY 4.0), ducked under Skye's voice.

    python source/build_music.py    -> audio/music_bed.wav (48 kHz mono, already at its final level)

The bed is loud and punchy wherever Skye isn't talking (the cold open, the beats between sections, the sign-off) and
dips under her voice, so the video feels urgent from frame 1 without burying the narration. finish.py then mixes it
with music_gain 1.0.

The track is 27 s long and ends on a big hit. The bed plays its first 10 bars (124 BPM) twice, then the whole track, so
the final hit lands at the end of the video. (The first bed, Pixabay "Breaking News" by PaulYudin, got the video blocked
on YouTube by a Content ID claim.)
"""
import subprocess, sys, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
P = HERE.parent
ROOT = P.parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from settings import tools, executable  # noqa: E402

SR = 48000
SECONDS = 66.0
TRACK = ROOT / 'assets/audio/news_theme_kevinmacleod.mp3'
BARS, BPM, XF = 10, 124, 0.03   # loop body length, tempo, crossfade seconds at each join
OPEN, UNDER = 0.30, 0.12   # bed level with no voice / under the voice
ATTACK, RELEASE = 0.06, 0.45


def load(path):
    ff = executable(tools(), 'ffmpeg')
    raw = subprocess.run([ff, '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def main():
    n = int(SECONDS * SR)
    music = load(TRACK)
    body = music[:int(round(BARS * 4 * 60 / BPM * SR))]
    x = int(XF * SR); ramp = np.linspace(0, 1, x, dtype=np.float32)
    out = body.copy()
    for seg in (body, music):  # body, body, then the full track with its ending
        out[-x:] = out[-x:] * (1 - ramp) + seg[:x] * ramp
        out = np.concatenate([out, seg[x:]])
    music = np.pad(out, (0, max(0, n - len(out))))[:n]  # the final hit lands ~4 s before the end, under the sign-off
    music /= np.abs(music).max() + 1e-9
    voice = load(P / 'audio/narration.wav')
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    hop = SR // 100
    env = np.sqrt(np.convolve(voice ** 2, np.ones(hop) / hop, mode='same'))
    target = np.where(env > 0.02, UNDER, OPEN)
    g = np.empty(n, np.float32); g[0] = target[0]
    a, r = 1 - np.exp(-1 / (ATTACK * SR)), 1 - np.exp(-1 / (RELEASE * SR))
    for i in range(1, n):  # fast duck when she speaks, slow swell back up
        k = a if target[i] < g[i - 1] else r
        g[i] = g[i - 1] + (target[i] - g[i - 1]) * k
    bed = music * g
    with wave.open(str(P / 'audio/music_bed.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(bed, -1, 1) * 32767).astype('<i2').tobytes())
    print(f'music_bed.wav {n / SR:.1f} s, open {OPEN}, under voice {UNDER}')


if __name__ == '__main__':
    main()
