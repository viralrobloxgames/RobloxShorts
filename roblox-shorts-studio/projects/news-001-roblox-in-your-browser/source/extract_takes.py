"""Turn the Studio screen recordings into per-camera 9:16 frame sequences for compose_frames.py.

    python source/extract_takes.py [W M C]     renders/takes/take_<CAM>.mp4 -> renders/takes/<CAM>/0001.jpg..

Each take was recorded with ffmpeg ddagrab of the Studio viewport (1160x648, camera rolled 90 degrees) while
perform.luau played the performance at SPEED x real time. The take opens on a white card; the first non-white frame
is performance t = 0, so output frame n (t = n/30) is capture frame t0 + n / SPEED. Studio's view cube (drawn on top
of the viewport, top-left after rotating) is patched from the matching MCP still, which has no editor overlays.
"""
import subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
P = HERE.parent
sys.path.insert(0, str(HERE))
from compose_frames import N, W, H, load_still  # noqa: E402
sys.path.insert(0, str(P.parents[1] / 'scripts'))
from settings import tools, executable  # noqa: E402

SPEED = 0.5
VW, VH = 1160, 648
STILL = {'W': 'W_happy', 'M': 'M_happy', 'C': 'C_happy'}
CUBE = (0, 0, 300, 330)  # view-cube patch in the 1080x1920 frame (x0, y0, x1, y1)
LINE = (321, 326)        # rows of the viewport-centre overlay line in the raw 1160x648 capture


def frames(path):
    ff = executable(tools(), 'ffmpeg')
    p = subprocess.Popen([ff, '-v', 'error', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    size = VW * VH * 3
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        yield np.frombuffer(b, np.uint8).reshape(VH, VW, 3)


def extract(cam):
    src = P / f'renders/takes/take_{cam}.mp4'
    out = P / f'renders/takes/{cam}'; out.mkdir(parents=True, exist_ok=True)
    patch = load_still(STILL[cam]).crop(CUBE)
    t0, saved, white_seen = None, 0, False
    wanted = {}
    for k, f in enumerate(frames(src)):
        bright = f[::8, ::8].mean() > 235
        if t0 is None:
            white_seen |= bright
            if white_seen and not bright:
                t0 = k
                wanted = {t0 + round(n / SPEED): n for n in range(N)}
            else:
                continue
        n = wanted.get(k)
        if n is None:
            continue
        f = f.copy()  # Studio draws a faint line across the viewport's centre row: blend it out from its neighbours
        w = np.linspace(0, 1, LINE[1] - LINE[0] + 2)[1:-1, None, None]
        f[LINE[0]:LINE[1]] = (f[LINE[0] - 1] * (1 - w) + f[LINE[1]] * w).astype(np.uint8)
        im = Image.fromarray(f).rotate(90, expand=True).crop((0, 4, 648, 1156)).resize((W, H), Image.LANCZOS)
        im.paste(patch, CUBE[:2])
        im.save(out / f'{n + 1:04}.jpg', quality=93)
        saved += 1
        if saved == N:
            break
    print(f'{cam}: t0 frame {t0}, saved {saved}/{N}')
    if saved < N:
        raise SystemExit(f'take {cam} is too short: only {saved} of {N} frames')


if __name__ == '__main__':
    for cam in sys.argv[1:] or ['W', 'M', 'C']:
        extract(cam)
