"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/sfx_assets.py).
Key times mirror T in web/umbrella_clip.js: rain plays (looped) exactly while the umbrella is open, with a pop each time
it opens and a thunder roll as the storm rolls in."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(sunny=W['sky'] - 0.12, open1=W['opens1'] + 0.05, close1=W['closes'] + 0.12, open1b=W['sharing'] + 0.12, close2=W['after'] - 0.12,
         bump=W['fit'] + 0.05, zap=W['thunderstorm'] + 0.15, flip=W['flips'] - 0.05, boom=W['volcano'] - 0.05, toTable=W['table'] - 0.15,
         toNapkins=W['napkins'] - 0.1, toCastle=W['bouncy'] - 0.1, panic=W['screams'] - 0.15, open2=W['opens2'] + 0.1,
         hiss=W['hisses'] - 0.15, out=W['gone'] + 0.1, cheer=W['thirty'] - 0.1, cta=W['follow'] - 0.15)
END = W['end'] + 1.6
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.35: A(f'sfx/{n}.wav', t, g)
H = lambda n, t, g=0.35: A('horror/' + n, t, g)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})


def loop(name, a, b, length, g):                         # a looped effect from a to b (clips overlap by 0.25 s)
    t = a
    while t < b - 0.3: S(name, t, g); t += length - 0.25


# Rain while it is open (the 6 s loop is 5.7 s long once its seam is trimmed).
for a, b in [(0, T['sunny']), (T['open1'], T['close1']), (T['open1b'], T['close2']), (T['open2'], END)]:
    loop('rain', a + 0.05, b + 0.3, 5.7, 0.38)
for at in (T['open1'], T['open1b'], T['open2']):
    S('pop', at - 0.02, 0.45); S('thunder', at + 0.15, 0.4)
S('pop', T['close1'] - 0.05, 0.3); S('pop', T['close2'] - 0.05, 0.3)
S('shake', W['soaked4'] + 0.05, 0.4)
for i in range(4): H('footstep', W['sharing'] + 0.35 + i * 0.28, 0.12)
S('boing', T['bump'], 0.45)
S('thunder', T['zap'] - 0.02, 0.6); S('zap', T['zap'], 0.6)
for i in range(6): H('footstep', W['after'] - 0.1 + i * 0.4, 0.12)
TN([523, 659, 784], W['then'], 0.04, 0.14)                 # party jingle
A('swish_2', T['flip'], 0.35); A('click', T['flip'] + 0.55, 0.3)
S('fwoomp', T['boom'], 0.75); A('impact_2', T['boom'] + 0.02, 0.35)
loop('fire', T['boom'] + 0.4, T['out'], 3.8, 0.3)
A('swish_3', T['toTable'] - 0.35, 0.3); S('fwoomp', T['toTable'], 0.35)
S('fwoomp', T['toNapkins'], 0.3); A('swish_4', T['toCastle'] - 0.55, 0.3); S('fwoomp', T['toCastle'], 0.45)
for i in range(16): H('footstep', T['panic'] + 0.1 + i * 0.11, 0.14)
S('whoosh', T['open2'] - 0.15, 0.35)
S('hiss', T['hiss'], 0.65); S('hiss', T['hiss'] + 0.5, 0.4)
S('applause', T['cheer'], 0.6); S('applause', T['cheer'] + 2.4, 0.35)
for i in range(4): H('footstep', W['ducks'] - 0.2 + i * 0.25, 0.1)
TN([784, 1047], W['moves'] + 0.1, 0.04, 0.12)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
