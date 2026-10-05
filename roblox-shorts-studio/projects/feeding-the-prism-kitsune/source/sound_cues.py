"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/kitsune_clip.js; change both together."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def sparkle(t, g=0.07): T([1568, 2093, 2637, 3136], t, g, 0.07)
def gulp(t, g=0.4): A('impact_3', t, g * 0.6); T(260, t, g * 0.25, 0.22, sweep=-160)
def pop(t, g=0.3): A('click', t, g); T([1319, 1568], t + 0.03, 0.07, 0.1)
def thud(t, g=0.5): A('impact_4', t, g); T(55, t, 0.14, 0.3, square=True)
def roar(t, g=0.5, d=1.1): T(220, t, g * 0.3, d, sweep=-110, square=True); T(120, t + 0.02, g * 0.4, d * 1.1, sweep=-50, square=True); A('horror/reveal_hit', t, g * 0.7)
def slash(t, g=0.3): A('swish_2', t, g)
def chest(drop, op): A('swish_3', drop, 0.3); thud(drop + 0.3, 0.4); A('horror/latch', op, 0.45); T([1047, 1319, 1568, 2093], op + 0.05, 0.1, 0.11); sparkle(op + 0.45)

B = dict(land=W['fell'] + 0.15, blown=W['sky'] - 0.15, hungry=W['its'] - 0.15, speech=W['only'] - 0.25,
         dawn=W['dawn'] - 0.45, sparkle=W['sparkle'] - 0.15, fight=W['beat'] - 0.3, hit1=W['beat'] + 0.15, hit2=W['beat'] + 0.65, poof=W['drops'] - 0.25, egg=W['drops'] - 0.05,
         feed1=W['leo'] - 0.3, toss1=W['fed'] + 0.1, gulp1=W['one'], g2=W['two'] + 0.1, g3=W['three'] + 0.1, g4=W['four'] + 0.1, nothing=W['nothing'] - 0.1,
         g5=W['five'] + 0.1, drop=W['chest'] - 0.3, open=W['inside'] - 0.05, coins=W['double'] - 0.1,
         maxLook=W['but'] - 0.15, blade=W['blade'] - 0.35, pct=W['five2'] - 0.1, need=W['so'] - 0.15,
         hopShot=W['good'] - 0.2, thirty=W['thirty'] - 0.1, hop=W['thirty'] + 0.25, walk=W['walk'] - 0.05, passes=W['passes'] - 0.3,
         warn=W['better'] - 0.2, fall=W['lands'] - 0.45, lands=W['lands'], fightA=W['whole'] - 0.2, burst=W['bursts'] - 0.05,
         maxTwo=W['grabbed'] - 0.3, mia=W['mia'] - 0.25,
         maxFeed=W['fed2'] - 0.3, chest2=W['chest2'] - 0.05, train=W['training'] - 0.1, again=W['again'] - 0.15, coins2=W['coins2'] - 0.1,
         miaFeed=W['opened'] - 0.35, chest3=W['chest3'] - 0.1, rise=W['chest3'] + 0.2, blade2=W['blade2'] - 0.1,
         hurry=W['hurry'] - 0.25, look=W['leaves'] - 0.25, friday=W['friday'] - 0.2, cta=W['play'] - 0.15)
lerp = lambda a, b, u: a + (b - a) * u
streams = [(B['maxFeed'] + 0.15, B['chest2'] - 0.45), (B['again'] + 0.05, B['coins2'] - 0.5), (B['miaFeed'] + 0.05, B['chest3'] - 0.45)]

# Hook: falling whistle, the landing slam, banner.
T(1400, 0.0, 0.07, B['land'], sweep=-1100)
thud(B['land'], 0.75); A('impact_2', B['land'] + 0.02, 0.55); A('drum_hit', B['land'] + 0.04, 0.45); T(45, B['land'], 0.2, 0.7, square=True)
A('swish_3', B['land'] + 0.1, 0.35); sparkle(B['land'] + 0.2, 0.09); T([784, 988, 1175, 1568], B['land'] + 0.15, 0.08, 0.12)
# Hungry: stomach rumble, speech pop.
T(70, B['hungry'] + 0.3, 0.12, 0.9, square=True, sweep=30); T(90, B['hungry'] + 0.6, 0.08, 0.6, square=True, sweep=-20)
pop(B['speech'], 0.25); pop(W['eats'] - 0.1, 0.2)
# Dawn: soft rising chime in the beam, the beast sparkles; Leo's hits, the poof, the egg.
T([523, 659, 784, 1047], B['dawn'], 0.06, 0.35); T(400, B['dawn'] + 0.2, 0.04, 2.5, sweep=300)
sparkle(B['sparkle']); sparkle(B['sparkle'] + 0.5); roar(B['sparkle'] + 0.05, 0.35, 0.8)
slash(B['hit1'] - 0.1); A('impact_1', B['hit1'], 0.35); slash(B['hit2'] - 0.1); A('impact_1', B['hit2'], 0.35)
A('swish_4', B['poof'], 0.35); A('impact_3', B['poof'] + 0.02, 0.3); pop(B['egg'], 0.35); sparkle(B['egg'] + 0.1, 0.09)
# Leo's feeds: toss whoosh, gulp, meter ding; slower each time.
for toss, g, k in ((B['toss1'], B['gulp1'], 1), (B['g2'] - 0.5, B['g2'], 0.8), (B['g3'] - 0.5, B['g3'], 0.6), (B['g4'] - 0.5, B['g4'], 0.45), (B['g5'] - 0.45, B['g5'], 1)):
    A('swish_1', toss, 0.2); gulp(g, 0.45 * k + 0.1); T(880 + 120 * k, g + 0.08, 0.06, 0.1)
T([392, 349, 330], B['nothing'] + 0.2, 0.06, 0.2, square=True)                    # "nothing" deflate
T([1047, 1319, 1568, 2093], B['g5'] + 0.1, 0.11, 0.1)                              # 5/5
chest(B['drop'], B['open']); T([1568, 2093, 1568, 2093, 2637], B['coins'], 0.07, 0.06)
# The Blade: shimmer, the 5% stamp, determination.
T(600, B['maxLook'] + 0.2, 0.04, 1.4, sweep=900); sparkle(B['blade']); sparkle(B['blade'] + 0.4)
A('drum_hit', B['pct'], 0.5); A('impact_1', B['pct'] + 0.02, 0.35)
A('swish_2', B['need'] + 0.05, 0.25); T([523, 659], B['need'] + 0.1, 0.07, 0.15, square=True)
# The walk: hop, landing, plodding thuds, a ding per beast turning Prism.
A('swish_3', B['hop'], 0.4); thud(B['walk'], 0.5)
t = B['walk'] + 0.29
while t < B['warn'] - 0.1: A('impact_3', t, 0.16); t += 0.57
for x in (46, 62, 78, 94, 112):
    pt = B['walk'] + max(0, x - 8 - 8) / 15
    if pt < B['warn'] - 0.1: sparkle(pt, 0.08); T(1175, pt, 0.06, 0.12)
# The Alpha: alarm, the fall and slam, the fight, the burst, eggs landing.
for i in range(4): T([880, 660], B['warn'] + 0.1 + i * 0.5, 0.07, 0.2, square=True)
T(1600, B['fall'], 0.07, 0.45, sweep=-1300)
thud(B['lands'], 0.8); A('impact_2', B['lands'] + 0.02, 0.6); A('drum_hit', B['lands'] + 0.05, 0.5); T(40, B['lands'], 0.22, 0.8, square=True)
roar(B['lands'] + 0.3, 0.55, 1.2)
t = B['fightA'] + 0.1
while t < B['burst'] - 0.15: slash(t, 0.22); A('impact_1', t + 0.12, 0.18); t += 0.31
A('impact_2', B['burst'], 0.65); A('drum_hit', B['burst'] + 0.03, 0.5); sparkle(B['burst'] + 0.05, 0.1); T([1047, 1319, 1568, 2093, 2637], B['burst'] + 0.08, 0.1, 0.08)
for i in range(6): A('click', B['burst'] + 0.5 + i * 0.07, 0.15)
# Eggs split: Max's happy blip, Mia's tower walk (footsteps), Max's sad slide.
T([784, 988], B['maxTwo'] + 0.2, 0.07, 0.12)
t = B['mia'] - 0.1
while t < B['maxFeed'] - 0.2: A('horror/footstep', t, 0.25); t += 0.42
T([523, 392], B['mia'] + 0.5, 0.07, 0.25, square=True)
# The streams of eggs, the chests: training, coins; Mia's chest and the Blade.
for a, b in streams:
    for k in range(5): pt = lerp(a, b, (k + 1) / 5) + 0.05; gulp(pt, 0.22); T(900 + 90 * k, pt + 0.05, 0.05, 0.07)
chest(B['chest2'] - 0.25, B['chest2'] + 0.2); T([523, 659, 784], B['train'], 0.07, 0.12)
chest(B['coins2'] - 0.45, B['coins2']); T([392, 330, 262], B['coins2'] + 0.5, 0.06, 0.22, square=True)
chest(B['chest3'] - 0.3, B['chest3'] + 0.1)
T(500, B['rise'], 0.07, 1.0, sweep=1200); T([1047, 1319, 1568, 2093, 2637, 3136], B['rise'] + 0.6, 0.11, 0.1); A('drum_hit', B['rise'] + 0.6, 0.4)
A('horror/reveal_hit', B['rise'] + 0.7, 0.3)
# Deadline: ticking clock, the stamp; CTA chime.
t = B['hurry']
while t < B['cta'] - 0.1: A('click', t, 0.12); t += 0.5
A('drum_hit', B['friday'], 0.45); A('impact_1', B['friday'] + 0.02, 0.3)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
