"""Skye's performance for ViralRoblox News #1: lip-sync visemes, blinks, nods, gestures and the sign-off wave.

    python source/performance.py      -> source/perform.luau (paste into the Studio MCP; one take per camera)

Visemes come from the narration itself: per 1/30 s frame, loudness picks how open the mouth is (closed, small,
talking, wide) and the spectral centroid swaps in "oo" or "ee" shapes, only inside word timings. Pauses relax into a
smile, blinks land on closed-mouth frames. Head sway, breathing and nods are procedural in the Luau player; this file
only passes event times, so the take is deterministic and matches the composited timeline frame for frame.
"""
import json, math, subprocess, sys, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
P = HERE.parent
sys.path.insert(0, str(HERE))
from compose_frames import T, WORDS, SECONDS, FPS, N  # noqa: E402

FACES = {  # viseme letter -> face image (assets/roblox_pack/faces/glam_doll), uploaded ids filled in perform.luau
    'C': 'mouth_closed', 'S': 'mouth_small', 'T': 'talking', 'W': 'mouth_wide', 'E': 'mouth_e', 'O': 'mouth_o',
    'B': 'blink_closed', 'U': 'surprised', 'H': 'happy',
}


def envelope():
    with wave.open(str(P / 'audio/narration.wav')) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
    hop = sr // FPS; rms, cen = [], []
    freqs = np.fft.rfftfreq(hop * 2, 1 / sr)
    for i in range(N):
        seg = x[i * hop: i * hop + hop * 2]
        if len(seg) < hop * 2:
            seg = np.pad(seg, (0, hop * 2 - len(seg)))
        rms.append(float(np.sqrt(np.mean(seg ** 2))))
        mag = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        band = (freqs > 200) & (freqs < 4000)
        cen.append(float((freqs[band] * mag[band]).sum() / (mag[band].sum() + 1e-9)))
    return np.array(rms), np.array(cen)


def in_word(t, lead=0.03):
    return any(w['start'] - lead <= t < w['end'] + lead for w in WORDS)


def visemes(rms, cen):
    talk = np.array([in_word(i / FPS) for i in range(N)])
    ref = np.percentile(rms[talk], 95)
    lo, hi = np.percentile(cen[talk], [25, 78])
    v = []
    for i in range(N):
        t = i / FPS
        if T['not_all'] - 0.05 <= t < T['not_all'] + 0.7 or t < 0.42:
            v.append('U'); continue
        if not talk[i]:
            gap_start = max([w['end'] for w in WORDS if w['end'] <= t] or [0])
            gap_end = min([w['start'] for w in WORDS if w['start'] > t] or [SECONDS])
            v.append('H' if gap_end - gap_start > 0.55 and t - gap_start > 0.12 else 'C'); continue
        a = rms[i] / ref
        if a < 0.16:
            c = 'C'
        elif a < 0.38:
            c = 'S'
        elif a < 0.68:
            c = 'T'
        else:
            c = 'W'
        if c in 'TW' and cen[i] < lo:
            c = 'O'
        elif c in 'TW' and cen[i] > hi:
            c = 'E'
        v.append(c)
    for _ in range(2):  # no single-frame flickers
        for i in range(1, N - 1):
            if v[i - 1] == v[i + 1] != v[i]:
                v[i] = v[i - 1]
    rng = np.random.default_rng(7); t = 1.6
    while t < SECONDS:  # blinks: 3 frames, only on a closed or smiling mouth
        i = int(t * FPS)
        while i < N - 3 and v[i] not in 'CH':
            i += 1
        for k in range(i, min(N, i + 3)):
            if v[k] in 'CH':
                v[k] = 'B'
        t = i / FPS + rng.uniform(2.4, 4.4)
    return ''.join(v)


def nods(rms):
    starts = [WORDS[0]['start']] + [WORDS[k + 1]['start'] for k, w in enumerate(WORDS[:-1]) if w['word'][-1] in '.!?']
    peaks = []
    thr = np.percentile(rms, 88)
    for w in WORDS:
        a, b = int(w['start'] * FPS), max(int(w['start'] * FPS) + 1, int(w['end'] * FPS))
        if rms[a:b].max() > thr:
            peaks.append(w['start'])
    out = []
    for t in sorted(set(starts + peaks)):
        if not out or t - out[-1] > 1.1:
            out.append(round(t, 3))
    return out


def gestures():
    # (start, side 'L'|'R'|'B', seconds): forearm lifts off the desk and settles back
    return [(T['no_app'] - 0.05, 'B', 0.7), (T['no_install'] - 0.05, 'B', 0.7), (T['link'] - 0.1, 'R', 0.8),
            (T['search'] - 0.05, 'L', 0.6), (T['email'] - 0.05, 'R', 0.6), (T['offline'] - 0.05, 'B', 0.8),
            (T['so_what'] - 0.05, 'B', 0.9), (T['one_link'] - 0.1, 'R', 0.9), (T['follow'] - 0.05, 'B', 1.0),
            (T['would'] + 0.4, 'L', 0.8), (T['comment'] - 0.05, 'R', 0.8)]


def main():
    rms, cen = envelope()
    v = visemes(rms, cen)
    data = {'visemes': v, 'nods': nods(rms), 'gestures': [[round(a, 3), b, c] for a, b, c in gestures()],
            'wave': round(T['skye'] - 0.15, 3), 'seconds': SECONDS, 'fps': FPS}
    (HERE / 'performance.json').write_text(json.dumps(data), encoding='utf-8')
    tpl = (HERE / 'perform_template.luau').read_text(encoding='utf-8')
    rle = ''.join(f'{k}{len(list(g))}' for k, g in __import__('itertools').groupby(v))
    lua = tpl.replace('--@VISEMES@', f'local VISEMES_RLE = "{rle}"') \
             .replace('--@NODS@', 'local NODS = {' + ', '.join(map(str, data['nods'])) + '}') \
             .replace('--@GESTURES@', 'local GESTURES = {' + ', '.join(f'{{{a}, "{b}", {c}}}' for a, b, c in data['gestures']) + '}') \
             .replace('--@WAVE@', f'local WAVE_AT = {data["wave"]}') \
             .replace('--@SECONDS@', f'local SECONDS = {SECONDS}')
    (HERE / 'perform.luau').write_text(lua, encoding='utf-8')
    counts = {k: v.count(k) for k in FACES}
    print('visemes', counts, 'nods', len(data['nods']), 'gestures', len(data['gestures']))


if __name__ == '__main__':
    main()
