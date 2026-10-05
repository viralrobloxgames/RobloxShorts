"""Skye in the cloud: lip-sync and blinks drawn over the Studio stills (no Roblox Studio needed).

The stills (news-001 source/stills, captured in Studio with the rolled 9:16 camera) differ only in the face. Here each
camera's base still gets its mouth painted out with skin, and a mouth from Skye's own glam_doll face textures
(mouth_closed / small / e / wide / o) is pasted in, scaled and placed by matching the texture's 'happy' smile to the
still's rendered smile, and recoloured to the lip colour Studio renders. Blinks swap to the blink still.

    from skye2d import Skye
    sk = Skye(); frame = sk.frame('C', mouth='mouth_e', blink=False)
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
STILLS = ROOT / 'projects/news-001-roblox-in-your-browser/source/stills'
TEX = ROOT / 'assets/roblox_pack/faces/glam_doll'
W, H = 1080, 1920
FACE = {'M': (533, 893), 'C': (533, 993)}  # face centre per camera in the 1080x1920 still
MOUTH_BOX = {'M': (490, 895, 590, 955), 'C': (462, 1052, 618, 1140)}  # window that holds the rendered mouth (any expression)
MOUTHS = ['mouth_closed', 'mouth_small', 'mouth_e', 'mouth_wide', 'mouth_o', 'happy']


def load_still(name):
    im = Image.open(STILLS / f'{name}.jpg').convert('RGB').rotate(90, expand=True)  # rolled capture -> portrait
    return im.crop((0, 4, 648, 1156)).resize((W, H), Image.LANCZOS)


def lip_mask(img, box):
    """Saturated pink/red lip pixels inside box (x0, y0, x1, y1) -> bool array in full-frame coordinates."""
    a = np.asarray(img, dtype=np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r - g > 110) & (r > 150)
    out = np.zeros(m.shape, bool); x0, y0, x1, y1 = box; out[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return out


def bbox(m):
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def erase(img, m, grow=5):
    """Paint the masked mouth out with skin: per column, interpolate between the rows just above and below it."""
    a = np.asarray(img, dtype=np.float32).copy()
    x0, y0, x1, y1 = bbox(m); x0 -= grow; y0 -= grow; x1 += grow; y1 += grow
    top, bot = a[y0 - 1, x0:x1], a[y1, x0:x1]
    for k, y in enumerate(range(y0, y1)):
        f = (k + 1) / (y1 - y0 + 1)
        a[y, x0:x1] = top * (1 - f) + bot * f
    patch = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    # feathered paste so the patch edge doesn't show
    fm = Image.new('L', (W, H), 0); fm.paste(255, (x0 + 3, y0 + 3, x1 - 3, y1 - 3)); fm = fm.filter(ImageFilter.GaussianBlur(3))
    out = img.copy(); out.paste(patch, (0, 0), fm)
    return out


class Skye:
    def __init__(self):
        self.base, self.blink, self.place, self.sprites = {}, {}, {}, {}
        tex_happy = np.asarray(Image.open(TEX / 'happy.png').convert('RGBA'))
        th = (tex_happy[..., 3] > 128) & (tex_happy[..., 0].astype(int) - tex_happy[..., 1] > 60)
        th[:690] = False  # mouth band only (eyes and blush are above)
        tb = bbox(th)
        for cam, (cx, cy) in FACE.items():
            box = MOUTH_BOX[cam]
            happy = load_still(f'{cam}_happy'); hb = bbox(lip_mask(happy, box))
            sx = (hb[2] - hb[0]) / (tb[2] - tb[0]); sy = (hb[3] - hb[1]) / (tb[3] - tb[1])
            self.place[cam] = (sx, sy, hb[0] - tb[0] * sx, hb[1] - tb[1] * sy)
            talk = load_still(f'{cam}_talk')
            lip = np.asarray(talk)[lip_mask(talk, box)].mean(0)  # rendered lip colour
            self.lip = lip
            self.base[cam] = erase(talk, lip_mask(talk, box))
            bl = STILLS / f'{cam}_blink.jpg'
            if bl.exists():
                b = load_still(f'{cam}_blink'); self.blink[cam] = erase(b, lip_mask(b, box))
            for name in MOUTHS:
                self.sprites[cam, name] = self._sprite(cam, name, lip)

    def _sprite(self, cam, name, lip):
        t = np.asarray(Image.open(TEX / f'{name}.png').convert('RGBA')).astype(np.float32)
        keep = np.zeros(t.shape[:2], bool); keep[690:] = True
        t[..., 3] *= keep
        # recolour: the texture's dark berry -> Studio's rendered lip colour, lighter parts (tongue, teeth) keep their offset
        berry = np.array([160, 30, 80], np.float32)
        t[..., :3] = np.clip(t[..., :3] - berry + lip, 0, 255)
        im = Image.fromarray(t.astype(np.uint8), 'RGBA')
        sx, sy, ox, oy = self.place[cam]
        x0, y0 = 200, 690; crop = im.crop((x0, y0, 830, 920))
        w, h = round(crop.width * sx), round(crop.height * sy)
        return crop.resize((w, h), Image.LANCZOS), (round(ox + x0 * sx), round(oy + y0 * sy))

    def frame(self, cam, mouth='mouth_closed', blink=False):
        img = (self.blink.get(cam) if blink else None) or self.base[cam]
        img = img.copy(); spr, xy = self.sprites[cam, mouth]
        img.paste(spr, xy, spr)
        return img
