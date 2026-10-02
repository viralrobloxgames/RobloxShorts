"""ViralRoblox News #1: assemble the 9:16 picture from Studio stills, evidence screenshots and the news overlay.

    python source/compose_frames.py                 all frames -> renders/frames/0001.png..
    python source/compose_frames.py --only 1,200    just those frames (for review) -> renders/review/
    python source/compose_frames.py --cues          only rewrite source/sound_cues.json
    python source/compose_frames.py --range 1,660   one worker's share (run several in parallel; resumable)

Studio can't be filmed through the MCP, so Skye is pose-to-pose: one still per camera and face (source/stills/,
captured with the rolled-camera trick), swapped on the word timings for lip flap and blinks. Shots, pop-ups and
sound cues all come from the timeline below, keyed to words in audio/alignment/captions.json.
Captions are not drawn here: finish.py burns them in from the same timings.
"""
import argparse, json, math, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

P = Path(__file__).resolve().parents[1]
ROOT = P.parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from assemble_narration import shift

W, H, FPS = 1080, 1920, 30
SECONDS = 66.0
N = round(SECONDS * FPS)
LG = str(ROOT / 'assets/fonts/LuckiestGuy-Regular.ttf')
SEG = 'C:/Windows/Fonts/segoeuib.ttf'
HOT, PURPLE, PLUM, PLUM_D = (255, 64, 160), (150, 70, 255), (66, 24, 92), (30, 10, 44)
WHITE, RED, YEL = (255, 255, 255), (230, 30, 50), (255, 212, 0)
_fonts = {}


def font(path, size):
    return _fonts.setdefault((path, size), ImageFont.truetype(path, size))


# ---------------------------------------------------------------------------------------------------- timing
WORDS = [w for c in json.loads((P / 'audio/alignment/captions.json').read_text(encoding='utf-8')) for w in c['words']]


def at(word, after=0.0):
    """Start time of the first word (case-insensitive, punctuation stripped) at or after `after` seconds."""
    key = word.lower().strip(',.?!')
    for w in WORDS:
        if w['start'] >= after - 1e-6 and w['word'].lower().strip(',.?!') == key:
            return w['start']
    raise KeyError(word)


S = shift  # raw-take time -> final time
T = dict(
    breaking=0.30, sting=S(5.32) + 0.12, sting_end=S(6.06) - 0.12,
    rdc=S(6.06), by_end=S(11.46), no_app=S(15.46), no_install=S(16.08), link_beat=S(18.9),
    link=at('link.', S(19.0)), search=at('search', S(20.0)), youtube=at('youtube', S(20.0)), x=at('x', S(21.5)), email=at('email', S(22.0)),
    click=S(24.16), not_all=S(26.4), offline=S(27.76), plane=S(33.22), planned=S(36.18), mid2027=at('mid-2027', S(36.0)),
    so_what=S(40.14), one_link=at('link.', S(45.0)), follow=S(46.98), would=S(50.46), comment=at('comment', S(52.0)),
    skye=S(54.78), last_word=WORDS[-1]['end'],
)
CUT = 0.08  # cut slightly ahead of the line so the picture leads the voice
SHOTS = [  # (start, end, kind, args)
    (0.0, T['rdc'] - CUT if False else S(3.38) - CUT, 'skye', {'cam': 'M', 'emote': (0.0, 0.42, 'M_surprised')}),
    (S(3.38) - CUT, T['rdc'] - CUT, 'skye', {'cam': 'W'}),
    (T['rdc'] - CUT, T['by_end'] - CUT, 'card', {'img': 'vertical/01_header', 'a': (0, 545, 1040, 895), 'zoom': (1.0, 1.04), 'focus': (520, 720)}),
    (T['by_end'] - CUT, T['no_app'] - CUT, 'card', {'img': 'cards/web', 'zoom': (1.0, 1.04)}),
    (T['no_app'] - CUT, T['link_beat'] - CUT, 'card', {'img': 'cards/noapp', 'zoom': (1.0, 1.04)}),
    (T['link_beat'] - CUT, T['click'] - CUT, 'skye', {'cam': 'C'}),
    (T['click'] - CUT, T['not_all'] - CUT, 'card', {'img': 'cards/link', 'zoom': (1.0, 1.04)}),
    (T['not_all'] - CUT, T['offline'] - CUT, 'skye', {'cam': 'M', 'emote': (T['not_all'] - CUT, T['offline'], 'M_surprised')}),
    (T['offline'] - CUT, T['plane'] - CUT, 'card', {'img': 'cards/offline', 'zoom': (1.0, 1.04)}),
    (T['plane'] - CUT, T['planned'] - CUT, 'skye', {'cam': 'M'}),
    (T['planned'] - CUT, T['so_what'] - CUT, 'card', {'img': 'cards/mid2027', 'zoom': (1.0, 1.04)}),
    (T['so_what'] - CUT, T['follow'] - CUT, 'skye', {'cam': 'C'}),
    (T['follow'] - CUT, T['would'] - CUT, 'skye', {'cam': 'M'}),
    (T['would'] - CUT, T['skye'] - CUT, 'skye', {'cam': 'C'}),
    (T['skye'] - CUT, SECONDS, 'skye', {'cam': 'M', 'wave': True}),
]
POPS = [  # (start, end, kind, args)
    (T['sting'], T['sting_end'], 'sting', {}),
    (T['no_app'], T['link_beat'] - CUT, 'stamp', {'text': 'NO APP', 'xy': (290, 1165), 'rot': -6}),
    (T['no_install'], T['link_beat'] - CUT, 'stamp', {'text': 'NO INSTALL', 'xy': (750, 1175), 'rot': 4}),
    (T['link'], T['click'] - CUT, 'chip', {'text': 'ONE LINK', 'xy': (540, 360), 'big': True}),
    (T['search'], T['click'] - CUT, 'chip', {'text': 'SEARCH', 'xy': (230, 480)}),
    (T['youtube'], T['click'] - CUT, 'chip', {'text': 'YOUTUBE', 'xy': (500, 480)}),
    (T['x'], T['click'] - CUT, 'chip', {'text': 'X', 'xy': (700, 480)}),
    (T['email'], T['click'] - CUT, 'chip', {'text': 'EMAIL', 'xy': (870, 480)}),
    (T['click'] + 0.5, T['not_all'] - CUT, 'stamp', {'text': 'PLAY INSTANTLY', 'xy': (540, 1170), 'rot': -4}),
    (T['offline'] + 0.3, T['plane'] - CUT, 'stamp', {'text': 'OFFLINE PLAY', 'xy': (540, 1170), 'rot': -5}),
    (T['mid2027'], T['so_what'] - CUT, 'stamp', {'text': 'MID-2027', 'xy': (540, 1170), 'rot': -6}),
    (T['one_link'], T['follow'] - CUT, 'chip', {'text': 'JUST ONE LINK', 'xy': (540, 400), 'big': True}),
    (T['follow'], T['would'] - CUT, 'follow', {}),
    (T['comment'], T['skye'] - CUT, 'comment', {}),
    (T['last_word'] + 0.1, SECONDS, 'follow', {'small': True}),
]


def cues():
    out = [{'asset': 'impact_1', 'start': T['breaking'] + 0.1, 'gain': 0.3}, {'tone': [988, 1319, 1568], 'dur': 0.12, 'start': T['sting'], 'gain': 0.16}]
    out += [{'asset': f'swish_{i % 4 + 1}', 'start': max(0, s - 0.08), 'gain': 0.22} for i, (s, e, k, a) in enumerate(SHOTS) if k == 'card']
    for i, (s, e, k, a) in enumerate(POPS):
        if k == 'stamp':
            out.append({'asset': f'impact_{i % 3 + 2}', 'start': s, 'gain': 0.26})
        elif k in ('chip', 'comment'):
            out.append({'asset': 'click', 'start': s, 'gain': 0.22})
        elif k == 'follow' and not a.get('small'):
            out.append({'tone': [1319, 1760], 'dur': 0.1, 'start': s, 'gain': 0.14})
    (P / 'source/sound_cues.json').write_text(json.dumps(out, indent=1), encoding='utf-8')
    return out


# ---------------------------------------------------------------------------------------------------- assets
def load_still(name):
    im = Image.open(P / 'source/stills' / f'{name}.jpg').convert('RGB').rotate(90, expand=True)  # rolled capture -> portrait
    return im.crop((0, 4, 648, 1156)).resize((W, H), Image.LANCZOS)


STILLS = {}
FACE = {'M': (533, 893), 'C': (533, 993), 'W': (533, 943)}  # face centre per camera in the 1080x1920 still


def still(name):
    if name not in STILLS:
        STILLS[name] = load_still(name)
    return STILLS[name]


def mouth_open(t):
    for w in WORDS:
        if w['start'] <= t < w['end']:
            return int((t - w['start']) / 0.1) % 2 == 0
    return False


def blinking(t):
    return (t % 3.7) < 0.12


def skye_frame(cam, t, s0, s1, args):
    if args.get('wave'):
        if mouth_open(t):
            name = 'M_waveA_talk'
        else:
            name = 'M_waveA_happy' if int(t * 30 / 7) % 2 == 0 else 'M_waveB_happy'
    elif args.get('emote') and args['emote'][0] <= t < args['emote'][1]:
        name = args['emote'][2]
    elif mouth_open(t):
        name = f'{cam}_talk'
    elif blinking(t) and cam in ('M', 'C'):
        name = f'{cam}_blink'
    else:
        name = f'{cam}_happy'
    base = still(name)
    p = (t - s0) / max(0.01, s1 - s0)
    punch = max(0.0, 1 - (t - s0) * FPS / 6) * 0.05  # small punch-in on each cut
    return zoom(base, 1.0 + 0.05 * p + punch, FACE[cam])


def zoom(img, z, focus):
    if z <= 1.0001:
        return img.copy()
    w, h = W / z, H / z
    x0 = min(max(focus[0] - w / 2, 0), W - w); y0 = min(max(focus[1] - h / 2, 0), H - h)
    return img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + h))


EVID = {}
BACKDROP = None


def evidence(name):
    if name not in EVID:
        EVID[name] = Image.open(P / 'source/evidence' / f'{name}.png').convert('RGB')
    return EVID[name]


def backdrop():
    global BACKDROP
    if BACKDROP is None:
        b = still('M_happy').filter(ImageFilter.GaussianBlur(22))
        BACKDROP = Image.blend(b, Image.new('RGB', (W, H), PLUM_D), 0.45)
    return BACKDROP


def rounded_mask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255); return m


def card_frame(t, s0, s1, args):
    frame = backdrop().copy()
    src = evidence(args['img']); ax0, ay0, ax1, ay1 = args.get('a', (0, 0) + src.size)
    p = (t - s0) / max(0.01, s1 - s0); p = p * p * (3 - 2 * p)
    z = args['zoom'][0] + (args['zoom'][1] - args['zoom'][0]) * p
    aw, ah = ax1 - ax0, ay1 - ay0; w, h = aw / z, ah / z
    fx, fy = args.get('focus', ((ax0 + ax1) / 2, (ay0 + ay1) / 2))
    x0 = min(max(fx - w / 2, ax0), ax1 - w); y0 = min(max(fy - h / 2, ay0), ay1 - h)
    cw = 960; ch = round(cw * ah / aw); pad = 36
    card = src.resize((cw, ch), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h))
    intro = min(1.0, (t - s0) * FPS / 7)  # slide up + fade in over 7 frames
    cx, cy = (W - cw) // 2, 760 - ch // 2 + round((1 - ease_out(intro)) * 60)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.rounded_rectangle((cx - pad, cy - pad + 18, cx + cw + pad, cy + ch + pad + 18), 40, fill=(0, 0, 0, 130))
    sh = sh.filter(ImageFilter.GaussianBlur(14)); frame.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(frame); d.rounded_rectangle((cx - pad - 8, cy - pad - 8, cx + cw + pad + 8, cy + ch + pad + 8), 44, fill=HOT)
    d.rounded_rectangle((cx - pad, cy - pad, cx + cw + pad, cy + ch + pad), 36, fill=src.getpixel((2, 2)))
    frame.paste(card, (cx, cy))
    pip(frame, t)
    return frame


def pip(frame, t):
    """Skye in a circle while the evidence is up, still lip-syncing."""
    name = 'C_talk' if mouth_open(t) else ('C_blink' if blinking(t) else 'C_happy')
    fx, fy = FACE['C']; r = 330
    face = still(name).crop((fx - r, fy - r + 60, fx + r, fy + r + 60)).resize((300, 300), Image.LANCZOS)
    m = Image.new('L', (300, 300), 0); ImageDraw.Draw(m).ellipse((0, 0, 299, 299), fill=255)
    x, y = 744, 168  # top right: clear of the logo bug, the stamps and TikTok's side buttons
    ImageDraw.Draw(frame).ellipse((x - 8, y - 8, x + 308, y + 308), fill=HOT)
    frame.paste(face, (x, y), m)


# ---------------------------------------------------------------------------------------------------- overlay
def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_back(p, s=1.8):
    p = min(max(p, 0), 1); return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2


def paste_center(frame, img, xy, scale=1.0, rot=0):
    if scale <= 0.01:
        return
    im = img
    if scale != 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.BICUBIC)
    if rot:
        im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    frame.paste(im, (round(xy[0] - im.width / 2), round(xy[1] - im.height / 2)), im)


_sprites = {}


def sprite(key, maker):
    if key not in _sprites:
        _sprites[key] = maker()
    return _sprites[key]


def make_stamp(text):
    f = font(LG, 84); tw = f.getlength(text)
    im = Image.new('RGBA', (round(tw) + 80, 134), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((6, 6, im.width - 6, im.height - 6), 26, fill=RED, outline=WHITE, width=8)
    d.text((im.width / 2, im.height / 2 + 4), text, font=f, fill=WHITE, anchor='mm', stroke_width=4, stroke_fill=(90, 0, 20))
    return im


def make_chip(text, big=False):
    f = font(LG, 74 if big else 52); tw = f.getlength(text); h = 116 if big else 86
    im = Image.new('RGBA', (round(tw) + 70, h + 10), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((4, 10, im.width - 4, h + 6), h // 2, fill=(0, 0, 0, 90))
    d.rounded_rectangle((4, 2, im.width - 4, h - 2), h // 2, fill=WHITE, outline=HOT, width=6)
    d.text((im.width / 2, h / 2 + 2), text, font=f, fill=PLUM, anchor='mm')
    return im


def make_follow(small=False):
    s = 0.75 if small else 1.0
    f1, f2 = font(LG, round(84 * s)), font(SEG, round(40 * s))
    w, h = round(560 * s), round(150 * s)
    im = Image.new('RGBA', (w + 20, h + round(80 * s)), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 10, w + 10, h + 10), h // 2, fill=HOT, outline=WHITE, width=round(8 * s))
    d.text((w / 2 + 10, h / 2 + 14), '+ FOLLOW', font=f1, fill=WHITE, anchor='mm', stroke_width=3, stroke_fill=(120, 0, 60))
    d.text((w / 2 + 10, h + round(50 * s)), '@viralrobloxgames', font=f2, fill=WHITE, anchor='mm', stroke_width=4, stroke_fill=PLUM_D)
    return im


def make_comment():
    f = font(LG, 70)
    im = Image.new('RGBA', (640, 250), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 10, 630, 150), 40, fill=WHITE, outline=HOT, width=8)
    d.text((320, 84), 'COMMENT BELOW', font=f, fill=PLUM, anchor='mm')
    d.polygon([(270, 160), (370, 160), (320, 240)], fill=HOT)
    return im


def make_sting():
    im = Image.new('RGBA', (900, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 10, 890, 410), 60, fill=PLUM, outline=HOT, width=12)
    d.text((450, 150), 'ViralRoblox', font=font(LG, 130), fill=WHITE, anchor='mm')
    d.rounded_rectangle((250, 235, 650, 360), 28, fill=RED)
    d.text((450, 302), 'NEWS', font=font(LG, 110), fill=WHITE, anchor='mm')
    return im


def draw_pop(frame, t, s, e, kind, a):
    if not (s <= t < e):
        return
    p = (t - s) * FPS
    if kind == 'stamp':
        sc = 1.6 - 0.6 * ease_out(min(1, p / 5))
        paste_center(frame, sprite(('stamp', a['text']), lambda: make_stamp(a['text'])), a['xy'], sc, a['rot'])
    elif kind == 'chip':
        paste_center(frame, sprite(('chip', a['text'], a.get('big')), lambda: make_chip(a['text'], a.get('big'))), a['xy'], ease_back(p / 6))
    elif kind == 'follow':
        pulse = 1 + 0.035 * math.sin((t - s) * 8)
        y = 1120 if a.get('small') else 470
        paste_center(frame, sprite(('follow', a.get('small')), lambda: make_follow(a.get('small'))), (540, y), ease_back(p / 7) * pulse)
    elif kind == 'comment':
        bob = math.sin((t - s) * 6) * 10
        paste_center(frame, sprite('comment', make_comment), (540, 470 + bob), ease_back(p / 7))
    elif kind == 'sting':
        dur = (e - s) * FPS
        sc = ease_back(p / 8) if p < dur - 5 else max(0.0, (dur - p) / 5)
        if p < 5:
            fl = Image.new('RGB', (W, H), WHITE); frame.paste(Image.blend(frame, fl, 0.55 * (1 - p / 5)))
        paste_center(frame, sprite('sting', make_sting), (540, 760), sc)


def draw_hud(frame, t):
    d = ImageDraw.Draw(frame, 'RGBA')
    # logo bug, top-left under TikTok's tabs
    d.rounded_rectangle((40, 150, 520, 262), 22, fill=PLUM + (235,)); d.rounded_rectangle((40, 150, 520, 262), 22, outline=HOT, width=4)
    d.text((66, 166), 'ViralRoblox', font=font(LG, 44), fill=WHITE)
    d.rounded_rectangle((346, 162, 500, 214), 12, fill=RED); d.text((423, 190), 'NEWS', font=font(LG, 40), fill=WHITE, anchor='mm')
    if int(t * 2) % 2 == 0:
        d.ellipse((68, 224, 88, 244), fill=RED)
    d.text((98, 218), 'LIVE  ·  #1  ·  OCT 2, 2026', font=font(SEG, 26), fill=WHITE)
    # BREAKING lower third, slides in at the start
    y = 1250; slide = ease_out(min(1, max(0, (t - T['breaking']) * FPS / 8)))
    if slide > 0:
        off = round((1 - slide) * -W)
        d.rectangle((off, y, off + 300, y + 84), fill=RED); d.text((off + 150, y + 44), 'BREAKING', font=font(LG, 54), fill=WHITE, anchor='mm')
        d.rectangle((off + 300, y, off + W, y + 84), fill=WHITE); d.text((off + 330, y + 46), 'ROBLOX WITHOUT THE APP', font=font(LG, 50), fill=PLUM, anchor='lm')
        d.rectangle((off, y + 84, off + W, y + 92), fill=HOT)
    # ticker
    ty = 1530
    d.rectangle((0, ty, W, ty + 64), fill=PLUM + (245,)); d.rectangle((0, ty, W, ty + 5), fill=HOT)
    msg = 'FOLLOW @viralrobloxgames FOR DAILY ROBLOX NEWS   •   ROBLOX IN YOUR BROWSER BY THE END OF 2026   •   OFFLINE PLAY BY MID-2027   •   '
    f = font(SEG, 30); L = f.getlength(msg); x = 210 - (t * 130) % L
    while x < W:
        d.text((x, ty + 33), msg, font=f, fill=WHITE, anchor='lm'); x += L
    d.rectangle((0, ty, 190, ty + 64), fill=HOT); d.text((95, ty + 34), 'DAILY', font=font(LG, 38), fill=WHITE, anchor='mm')


def render(i):
    t = (i - 1) / FPS
    s0, s1, kind, args = next((s, e, k, a) for s, e, k, a in SHOTS if s <= t < e)
    frame = skye_frame(args['cam'], t, s0, s1, args) if kind == 'skye' else card_frame(t, s0, s1, args)
    for s, e, k, a in POPS:
        if k == 'sting':
            draw_pop(frame, t, s, e, k, a)
    draw_hud(frame, t)
    for s, e, k, a in POPS:
        if k != 'sting':
            draw_pop(frame, t, s, e, k, a)
    return frame


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only'); ap.add_argument('--cues', action='store_true')
    ap.add_argument('--range', help='first,last frame (resumable: existing frames are skipped)'); a = ap.parse_args()
    cues()
    if a.cues:
        return
    assert abs(SHOTS[0][0]) < 1e-9 and SHOTS[-1][1] == SECONDS and all(SHOTS[k][1] == SHOTS[k + 1][0] for k in range(len(SHOTS) - 1))
    if a.only:
        out = P / 'renders/review'; out.mkdir(parents=True, exist_ok=True)
        for i in [int(x) for x in a.only.split(',')]:
            render(i).save(out / f'{i:04}.jpg', quality=90)
        print('review frames in', out); return
    out = P / 'renders/frames'; out.mkdir(parents=True, exist_ok=True)
    lo, hi = (int(x) for x in a.range.split(',')) if a.range else (1, N)
    for i in range(lo, hi + 1):
        f = out / f'{i:04}.png'
        if f.exists() and f.stat().st_size > 0:
            continue
        render(i).save(f.with_suffix('.tmp.png'), compress_level=2); f.with_suffix('.tmp.png').replace(f)
        if i % 150 == 0:
            print(f'{i}/{N}', flush=True)
    print('done', N, 'frames')


if __name__ == '__main__':
    main()
