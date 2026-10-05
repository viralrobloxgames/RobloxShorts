"""Paste the band rendered by web/strip_clip.js (y 180-420) into already-rendered frames, only over the old PART tag
area (x 345-525, y 250-332) with a feathered edge, so the tag disappears without a full re-render.
    python3 source/patch_strip.py <strip_dir> <frames_dir> [first last]"""
import sys, glob, os
import numpy as np
from PIL import Image
Y0 = 180
X1, X2, Y1, Y2, F = 345, 525, 250, 332, 8
strip_dir, frames_dir = sys.argv[1], sys.argv[2]
yy, xx = np.mgrid[0:Y2 - Y1, 0:X2 - X1]
edge = np.minimum.reduce([xx, X2 - X1 - 1 - xx, yy, Y2 - Y1 - 1 - yy]).astype(np.float32)
mask = np.clip(edge / F, 0, 1)[..., None]
n = 0
for f in sorted(glob.glob(os.path.join(strip_dir, 'web_*.png'))):
    k = int(os.path.basename(f)[4:8])
    if len(sys.argv) > 4 and not (int(sys.argv[3]) <= k <= int(sys.argv[4])): continue
    dst = os.path.join(frames_dir, os.path.basename(f))
    a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)[Y1 - Y0:Y2 - Y0, X1:X2]
    im = Image.open(dst).convert('RGB'); b = np.asarray(im, dtype=np.float32).copy()
    b[Y1:Y2, X1:X2] = b[Y1:Y2, X1:X2] * (1 - mask) + a * mask
    Image.fromarray(b.round().astype(np.uint8)).save(dst); n += 1
print(n, 'frames patched')
