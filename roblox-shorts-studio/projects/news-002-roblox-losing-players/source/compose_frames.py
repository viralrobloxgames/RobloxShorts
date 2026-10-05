"""ViralRoblox News #2: assemble the 9:16 picture in the cloud (no Studio takes).

    python source/compose_frames.py                 all frames -> renders/frames/0001.png..
    python source/compose_frames.py --only 1,200    just those frames (for review) -> renders/review/
    python source/compose_frames.py --cues          only rewrite source/sound_cues.json
    python source/compose_frames.py --range 1,660   one worker's share (run several in parallel; resumable)

Skye comes from the Studio stills via source/skye2d.py: lip-sync from the voice's loudness using her own glam_doll mouth
shapes, blinks, and a slow camera drift and push-in, so no Roblox Studio recording is needed. If Studio takes exist in
renders/takes/<CAM>/ (news-001's perform.luau + extract_takes.py route), they are used instead.
Shots, pop-ups and sound cues all come from the timeline below, keyed to words in audio/alignment/captions.json.
Captions are not drawn here: finish.py burns them in from the same timings.
"""
import argparse, json, math, sys, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

P = Path(__file__).resolve().parents[1]
ROOT = P.parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from skye2d import Skye, FACE  # noqa: E402

W, H, FPS = 1080, 1920, 30
SECONDS = json.loads((P / 'source/project.json').read_text(encoding='utf-8'))['seconds']
N = round(SECONDS * FPS)
LG = str(ROOT / 'assets/fonts/LuckiestGuy-Regular.ttf')
SEG = next((f for f in ('C:/Windows/Fonts/segoeuib.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') if Path(f).exists()))
HOT, PURPLE, PLUM, PLUM_D = (255, 64, 160), (150, 70, 255), (66, 24, 92), (30, 10, 44)
WHITE, RED, YEL = (255, 255, 255), (230, 30, 50), (255, 212, 0)
NEWS1 = ROOT / 'projects/news-001-roblox-in-your-browser/source/evidence'
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


def end(word, after=0.0):
    key = word.lower().strip(',.?!')
    for w in WORDS:
        if w['start'] >= after - 1e-6 and w['word'].lower().strip(',.?!') == key:
            return w['end']
    raise KeyError(word)


T = dict(breaking=0.30, million=at('million'), this=at('this'))
T.update(viralnews_end=end('news', T['this']))
T.update(last=at('last', T['this']), peak=at('152', T['this']) if any(w['word'].strip(',.') == '152' for w in WORDS) else at('million', T['this']),
         now=at('now', T['this']))
T.update(three=at("that's", T['now']), wall=at('and', T['now']))
T.update(stock=at("roblox's", T['wall']), seventy=at('70', T['wall']) if any(w['word'].strip(',.') == '70' for w in WORDS) else at('percent', T['wall']),
         sept=at('on', T['wall']), jefferies=at('jefferies', T['wall']))
T.update(why=at('so', T['jefferies']))
T.update(age=at('roblox', T['why']), younger=at('younger', T['why']), viral=at("last", T['why']))
T.update(ceo=at('but', T['viral']), seasonal=at('seasonal', T['viral']))
T.update(so_what=at('so', T['seasonal']))
T.update(dying=at("roblox", T['so_what']), still=at('it', T['so_what']))
T.update(expect=at('but', T['still']), browser=at('browser', T['still']))
T.update(follow=at('follow', T['browser']))
T.update(would=at('is', T['follow']), comment=at('comment', T['follow']))
T.update(skye=at("i'm", T['comment']), last_word=WORDS[-1]['end'])

CUT = 0.08  # cut slightly ahead of the line so the picture leads the voice
SHOTS = [  # (start, end, kind, args)
    (0.0, T['this'] - CUT, 'skye', {'cam': 'M', 'push': (1.0, 1.08)}),
    (T['this'] - CUT, T['last'] - CUT, 'skye', {'cam': 'M', 'push': (1.04, 1.0)}),
    (T['last'] - CUT, T['now'] - CUT, 'chart', {'upto': 0}),
    (T['now'] - CUT, T['three'] - CUT, 'card', {'img': 'cards/dau123'}),
    (T['three'] - CUT, T['wall'] - CUT, 'chart', {'upto': 3}),
    (T['wall'] - CUT, T['stock'] - CUT, 'skye', {'cam': 'C', 'push': (1.0, 1.06)}),
    (T['stock'] - CUT, T['sept'] - CUT, 'stock', {}),
    (T['sept'] - CUT, T['why'] - CUT, 'card', {'img': 'cards/jefferies'}),
    (T['why'] - CUT, T['age'] - CUT, 'skye', {'cam': 'C', 'push': (1.06, 1.0)}),
    (T['age'] - CUT, T['younger'] - CUT, 'card', {'img': 'cards/agecheck'}),
    (T['younger'] - CUT, T['viral'] - CUT, 'skye', {'cam': 'M', 'push': (1.0, 1.05)}),
    (T['viral'] - CUT, T['ceo'] - CUT, 'skye', {'cam': 'C', 'push': (1.0, 1.05)}),
    (T['ceo'] - CUT, T['so_what'] - CUT, 'skye', {'cam': 'M', 'push': (1.05, 1.0)}),
    (T['so_what'] - CUT, T['still'] - CUT, 'skye', {'cam': 'C', 'push': (1.0, 1.06)}),
    (T['still'] - CUT, T['expect'] - CUT, 'card', {'img': 'cards/yoy'}),
    (T['expect'] - CUT, T['follow'] - CUT, 'card', {'img': 'cards/web', 'dir': NEWS1}),
    (T['follow'] - CUT, T['would'] - CUT, 'skye', {'cam': 'M', 'push': (1.0, 1.04)}),
    (T['would'] - CUT, T['skye'] - CUT, 'skye', {'cam': 'C', 'push': (1.0, 1.05)}),
    (T['skye'] - CUT, SECONDS, 'skye', {'cam': 'M', 'push': (1.04, 1.0)}),
]
POPS = [  # (start, end, kind, args)
    (T['million'], T['this'] - CUT, 'stamp', {'text': '-29 MILLION', 'xy': (540, 1150), 'rot': -5}),
    (T['this'] + 0.1, T['viralnews_end'] + 0.25, 'sting', {}),
    (T['peak'], T['now'] - CUT, 'chip', {'text': '152 MILLION A DAY', 'xy': (540, 1170), 'big': True}),
    (T['three'] + 0.25, T['wall'] - CUT, 'stamp', {'text': '3 DROPS IN A ROW', 'xy': (540, 1170), 'rot': -4}),
    (T['seventy'], T['sept'] - CUT, 'stamp', {'text': '-70%', 'xy': (800, 1120), 'rot': -8}),
    (T['jefferies'] + 0.4, T['why'] - CUT, 'stamp', {'text': 'COULD FALL FURTHER', 'xy': (540, 1170), 'rot': -4}),
    (T['why'] + 0.1, T['age'] - CUT, 'chip', {'text': 'WHY?', 'xy': (540, 420), 'big': True}),
    (T['age'] + 0.3, T['younger'] - CUT, 'stamp', {'text': 'AGE CHECK TO CHAT', 'xy': (540, 1170), 'rot': -4}),
    (T['younger'], T['viral'] - CUT, 'chip', {'text': 'YOUNGER PLAYERS HIT HARDEST', 'xy': (540, 420)}),
    (T['viral'] + 0.1, T['ceo'] - CUT, 'chip', {'text': 'VIRAL HITS COOLED OFF', 'xy': (540, 420)}),
    (T['seasonal'], T['so_what'] - CUT, 'chip', {'text': 'CEO: "SEASONAL"', 'xy': (540, 420), 'big': True}),
    (T['still'] + 0.3, T['expect'] - CUT, 'stamp', {'text': 'NOT DYING', 'xy': (540, 1170), 'rot': -5}),
    (T['browser'], T['follow'] - CUT, 'chip', {'text': 'ROBLOX IN YOUR BROWSER', 'xy': (540, 1170)}),
    (T['follow'], T['would'] - CUT, 'follow', {}),
    (T['comment'], T['skye'] - CUT, 'comment', {}),
    (T['last_word'] + 0.1, SECONDS, 'follow', {'small': True}),
]


def cues():
    out = [{'asset': 'impact_1', 'start': T['breaking'] + 0.1, 'gain': 0.3}, {'tone': [988, 1319, 1568], 'dur': 0.12, 'start': T['this'] + 0.1, 'gain': 0.16}]
    out += [{'asset': f'swish_{i % 4 + 1}', 'start': max(0, s - 0.08), 'gain': 0.22} for i, (s, e, k, a) in enumerate(SHOTS) if k in ('card', 'chart', 'stock')]
    for i, (s, e, k, a) in enumerate(POPS):
        if k == 'stamp':
            out.append({'asset': f'impact_{i % 3 + 2}', 'start': s, 'gain': 0.26})
        elif k in ('chip', 'comment'):
            out.append({'asset': 'click', 'start': s, 'gain': 0.22})
        elif k == 'follow' and not a.get('small'):
            out.append({'tone': [1319, 1760], 'dur': 0.1, 'start': s, 'gain': 0.14})
    (P / 'source/sound_cues.json').write_text(json.dumps(out, indent=1), encoding='utf-8')
    return out


# ---------------------------------------------------------------------------------------------------- Skye
SK = None
ENV = None
ROUND = {'no', 'so', 'who', 'you', 'to', 'two', 'row', 'now', 'though', 'show', 'own', 'go', 'do', 'more', 'four', 'oh'}


def skye():
    global SK
    if SK is None:
        SK = Skye()
    return SK


def envelope():
    """Voice loudness per video frame (0..1), smoothed a little so the mouth doesn't chatter."""
    global ENV
    if ENV is None:
        with wave.open(str(P / 'audio/narration.wav')) as w:
            sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
            if w.getnchannels() == 2:
                a = a.reshape(-1, 2).mean(1)
        hop = sr / FPS; e = np.zeros(N + 2)
        for i in range(N + 2):
            s = a[int(i * hop): int((i + 1) * hop)]
            e[i] = math.sqrt(float((s * s).mean())) if len(s) else 0.0
        e = e / (np.percentile(e[e > 0.01], 95) + 1e-9)
        ENV = np.clip(np.convolve(e, [0.25, 0.5, 0.25], mode='same'), 0, 1.2)
    return ENV


def word_at(t):
    return next((w['word'].lower().strip(',.?!') for w in WORDS if w['start'] <= t < w['end']), None)


def mouth(t):
    i = min(N + 1, max(0, round(t * FPS))); e = envelope()[i]
    w = word_at(t)
    if w is None or e < 0.12:
        return 'happy' if t > T['last_word'] else 'mouth_closed'
    if w in ROUND and e > 0.3:
        return 'mouth_o'
    if e < 0.35:
        return 'mouth_small'
    if e < 0.7:
        return 'mouth_e' if i % 6 < 3 else 'mouth_small'
    return 'mouth_wide'


def blinking(t):
    """A 4-frame blink about every 3.3 s, jittered so it doesn't look mechanical."""
    k = int(t / 3.3); start = k * 3.3 + 1.1 + (k * 0.731 % 1.0)
    return start <= t < start + 4 / FPS


def take_frame(cam, t):
    i = min(N, max(1, round(t * FPS) + 1))
    f = P / f'renders/takes/{cam}/{i:04}.jpg'
    if f.exists():
        return Image.open(f).convert('RGB')
    return skye().frame(cam, mouth(t), blinking(t))


def skye_frame(cam, t, s0, s1, args):
    p = (t - s0) / max(0.01, s1 - s0); p = p * p * (3 - 2 * p)
    z0, z1 = args.get('push', (1.0, 1.04))
    punch = max(0.0, 1 - (t - s0) * FPS / 6) * 0.05  # small punch-in on each cut
    drift = (math.sin(t * 0.9) * 14, math.sin(t * 0.63 + 1.0) * 10)  # slow handheld drift
    fx, fy = FACE[cam]
    return zoom(take_frame(cam, t), 1.03 + z0 + (z1 - z0) * p - 1.0 + punch, (fx + drift[0], fy + 120 + drift[1]))


def zoom(img, z, focus):
    if z <= 1.0001:
        return img.copy()
    w, h = W / z, H / z
    x0 = min(max(focus[0] - w / 2, 0), W - w); y0 = min(max(focus[1] - h / 2, 0), H - h)
    return img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + h))


# ---------------------------------------------------------------------------------------------------- cards and charts
EVID = {}
BACKDROP = None


def evidence(name, d=None):
    key = (str(d), name)
    if key not in EVID:
        EVID[key] = Image.open((d or P / 'source/evidence') / f'{name}.png').convert('RGB')
    return EVID[key]


def backdrop():
    global BACKDROP
    if BACKDROP is None:
        b = skye().base['M'].filter(ImageFilter.GaussianBlur(22))
        BACKDROP = Image.blend(b, Image.new('RGB', (W, H), PLUM_D), 0.45)
    return BACKDROP


def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_back(p, s=1.8):
    p = min(max(p, 0), 1); return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2


def panel(frame, t, s0, box, fill):
    """Drop shadow + hot-pink rim + panel, sliding up and fading in over 7 frames. Returns the y offset used."""
    intro = min(1.0, (t - s0) * FPS / 7); dy = round((1 - ease_out(intro)) * 60)
    x0, y0, x1, y1 = box; y0 += dy; y1 += dy
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.rounded_rectangle((x0, y0 + 18, x1, y1 + 18), 40, fill=(0, 0, 0, 130))
    sh = sh.filter(ImageFilter.GaussianBlur(14)); frame.paste(sh, (0, 0), sh)
    d = ImageDraw.Draw(frame); d.rounded_rectangle((x0 - 8, y0 - 8, x1 + 8, y1 + 8), 44, fill=HOT)
    d.rounded_rectangle((x0, y0, x1, y1), 36, fill=fill)
    return dy


def card_frame(t, s0, s1, args):
    frame = backdrop().copy()
    src = evidence(args['img'], args.get('dir'))
    p = (t - s0) / max(0.01, s1 - s0); p = p * p * (3 - 2 * p); z = 1.0 + 0.04 * p
    aw, ah = src.size; w, h = aw / z, ah / z; x0, y0 = (aw - w) / 2, (ah - h) / 2
    cw = 960; ch = round(cw * ah / aw); pad = 36
    cx, cy = (W - cw) // 2, 760 - ch // 2
    dy = panel(frame, t, s0, (cx - pad, cy - pad, cx + cw + pad, cy + ch + pad), src.getpixel((2, 2)))
    frame.paste(src.resize((cw, ch), Image.LANCZOS, box=(x0, y0, x0 + w, y0 + h)), (cx, cy + dy))
    pip(frame, t)
    return frame


DAU = [("Q3 '25", 152), ("Q4 '25", 144), ("Q1 '26", 132), ("Q2 '26", 123)]


def chart_frame(t, s0, s1, args):
    """Daily players by quarter: one series, zero baseline, bars grow in; the bar being talked about is full strength."""
    frame = backdrop().copy()
    x0, y0, x1, y1 = 60, 340, 1020, 1100
    dy = panel(frame, t, s0, (x0, y0, x1, y1), PLUM_D)
    d = ImageDraw.Draw(frame, 'RGBA')
    d.text((W // 2, y0 + dy + 70), 'ROBLOX DAILY PLAYERS', font=font(LG, 66), fill=WHITE, anchor='mm')
    base = y1 + dy - 110; top = y0 + dy + 170; scale = (base - top) / 160
    d.line((x0 + 50, base, x1 - 50, base), fill=(255, 255, 255, 120), width=3)
    bw, gap = 170, 44; left = W // 2 - (4 * bw + 3 * gap) // 2
    for k, (q, v) in enumerate(DAU):
        grow = ease_out(min(1.0, max(0.0, ((t - s0) * FPS - 4 - k * 4) / 10)))
        hgt = v * scale * grow; bx = left + k * (bw + gap)
        on = k == args['upto'] or (args['upto'] == 3 and k in (0, 3))
        col = HOT + (255,) if on else HOT + (120,)
        if hgt > 4:
            d.rounded_rectangle((bx, base - hgt, bx + bw, base), 8, fill=col)
            d.rectangle((bx, base - 8, bx + bw, base), fill=col)  # flat at the baseline, rounded at the data end
        if grow > 0.6:
            d.text((bx + bw // 2, base - hgt - 40), f'{v}M', font=font(LG, 58 if on else 48), fill=WHITE if on else (255, 255, 255, 170), anchor='mm')
        d.text((bx + bw // 2, base + 46), q, font=font(SEG, 34), fill=(255, 255, 255, 200), anchor='mm')
    pip(frame, t)
    return frame


def stock_frame(t, s0, s1, args):
    """Hero number: the stock's high against its price now (no line chart: we only quote two points)."""
    frame = backdrop().copy()
    x0, y0, x1, y1 = 60, 400, 1020, 1040
    dy = panel(frame, t, s0, (x0, y0, x1, y1), PLUM_D)
    d = ImageDraw.Draw(frame, 'RGBA'); p = (t - s0) * FPS
    d.text((W // 2, y0 + dy + 80), 'ROBLOX STOCK', font=font(LG, 70), fill=WHITE, anchor='mm')
    d.text((300, y0 + dy + 230), 'HIGH', font=font(SEG, 40), fill=(255, 255, 255, 190), anchor='mm')
    d.text((300, y0 + dy + 330), '$142', font=font(LG, 130), fill=WHITE, anchor='mm')
    if p > 8:
        d.text((540, y0 + dy + 330), '→', font=font(SEG, 110), fill=HOT, anchor='mm')
    if p > 12:
        d.text((780, y0 + dy + 230), 'NOW', font=font(SEG, 40), fill=(255, 255, 255, 190), anchor='mm')
        d.text((780, y0 + dy + 330), '$44', font=font(LG, 130), fill=YEL, anchor='mm')
    d.text((W // 2, y1 + dy - 110), 'Oct 2, 2026 close', font=font(SEG, 34), fill=(255, 255, 255, 150), anchor='mm')
    pip(frame, t)
    return frame


def pip(frame, t):
    """Skye in a circle while a card is up, still talking (close-up)."""
    fx, fy = FACE['C']; r = 330
    face = take_frame('C', t).crop((fx - r, fy - r + 60, fx + r, fy + r + 60)).resize((300, 300), Image.LANCZOS)
    m = Image.new('L', (300, 300), 0); ImageDraw.Draw(m).ellipse((0, 0, 299, 299), fill=255)
    x, y = 744, 168  # top right: clear of the logo bug, the stamps and TikTok's side buttons
    ImageDraw.Draw(frame).ellipse((x - 8, y - 8, x + 308, y + 308), fill=HOT)
    frame.paste(face, (x, y), m)


# ---------------------------------------------------------------------------------------------------- overlay
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


TICKER = ('FOLLOW @viralrobloxgames FOR DAILY ROBLOX NEWS   •   ROBLOX DAILY PLAYERS: 152M → 123M   •   '
          'JEFFERIES RATES ROBLOX "UNDERPERFORM"   •   ROBLOX IN YOUR BROWSER BY THE END OF 2026   •   ')


def draw_hud(frame, t):
    d = ImageDraw.Draw(frame, 'RGBA')
    # logo bug, top-left under TikTok's tabs
    d.rounded_rectangle((40, 150, 520, 262), 22, fill=PLUM + (235,)); d.rounded_rectangle((40, 150, 520, 262), 22, outline=HOT, width=4)
    d.text((66, 166), 'ViralRoblox', font=font(LG, 44), fill=WHITE)
    d.rounded_rectangle((346, 162, 500, 214), 12, fill=RED); d.text((423, 190), 'NEWS', font=font(LG, 40), fill=WHITE, anchor='mm')
    if int(t * 2) % 2 == 0:
        d.ellipse((68, 224, 88, 244), fill=RED)
    d.text((98, 218), 'LIVE  ·  #2  ·  OCT 5, 2026', font=font(SEG, 26), fill=WHITE)
    # BREAKING lower third, slides in at the start
    y = 1250; slide = ease_out(min(1, max(0, (t - T['breaking']) * FPS / 8)))
    if slide > 0:
        off = round((1 - slide) * -W)
        d.rectangle((off, y, off + 300, y + 84), fill=RED); d.text((off + 150, y + 44), 'BREAKING', font=font(LG, 54), fill=WHITE, anchor='mm')
        d.rectangle((off + 300, y, off + W, y + 84), fill=WHITE); d.text((off + 330, y + 46), 'ROBLOX IS LOSING PLAYERS', font=font(LG, 50), fill=PLUM, anchor='lm')
        d.rectangle((off, y + 84, off + W, y + 92), fill=HOT)
    # ticker
    ty = 1530
    d.rectangle((0, ty, W, ty + 64), fill=PLUM + (245,)); d.rectangle((0, ty, W, ty + 5), fill=HOT)
    f = font(SEG, 30); L = f.getlength(TICKER); x = 210 - (t * 130) % L
    while x < W:
        d.text((x, ty + 33), TICKER, font=f, fill=WHITE, anchor='lm'); x += L
    d.rectangle((0, ty, 190, ty + 64), fill=HOT); d.text((95, ty + 34), 'DAILY', font=font(LG, 38), fill=WHITE, anchor='mm')


def render(i):
    t = (i - 1) / FPS
    s0, s1, kind, args = next((s, e, k, a) for s, e, k, a in SHOTS if s <= t < e)
    frame = {'skye': lambda: skye_frame(args['cam'], t, s0, s1, args), 'card': lambda: card_frame(t, s0, s1, args),
             'chart': lambda: chart_frame(t, s0, s1, args), 'stock': lambda: stock_frame(t, s0, s1, args)}[kind]()
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
    assert all(s < e for s, e, k, a in SHOTS), [(s, e, k) for s, e, k, a in SHOTS if s >= e]
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
