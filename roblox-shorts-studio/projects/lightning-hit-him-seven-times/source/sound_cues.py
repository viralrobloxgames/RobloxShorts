"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T / HIT in web/lightning_clip.js. A rain bed through the storm (quiet in the office), thunder and a zap
crackle on every strike, a fwoomp and a fire loop whenever his hair catches, a hiss of steam when the water can puts it
out, a drum hit on each STRIKE title and a ding as the counter fills, a pop for the toenail, a growl and a chomp for the
bear, a fanfare and applause for the record.
SFX in audio/sfx/ are copied from The Backwards Umbrella (thunder, rain, zap, fire, hiss, fwoomp, pop, boing, whoosh,
applause; synthesized there), Every Lie Comes True (roar, chomp, thud) and Copy the Crown (chime, fanfare)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
HIT = [W['hits'], W['window'] - 0.03, W['yard'] - 0.06, W['sets'], W['hair2'], W['gets'], W['hair3']]
T = dict(every=W['every'] - 0.1, office=W['s4'] - 0.1, can=W['now'] - 0.1, seven=W['seven2'] - 0.1, museum=W['record'] - 0.1,
         cta=W['follow'] - 0.15, bear=W['bear'] - 0.3, end=W['end'] + 2.0)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})

# rain: a bed of 5.6 s loops through the storm, quieter in the office, gone when the sky clears at the pond
t = 0.0
while t < T['seven']:
    g = 0.05 if T['office'] <= t < T['can'] else 0.12
    S('rain', t, g, dur=min(5.7, T['seven'] - t + 0.2)); t += 5.55
def strike(t, g=0.55):                                    # thunder crack + zap crackle as it lands
    S('thunder', t - 0.02, g); S('zap', t, g * 0.9); A('impact_2', t, 0.25)
strike(0.0, 0.6)                                          # the hook
for t in (W['keeps'], W['hitting'], W['tower']): S('thunder', t - 0.05, 0.32, dur=1.4); S('zap', t - 0.03, 0.2)
S('thud', W['runs'] - 0.28, 0.3); A('swish_2', W['runs'] - 0.2, 0.3)                       # the door bangs open, he bolts
for h in HIT: strike(h)
for h in HIT: TN([1319, 1760], h + 0.12, 0.05, 0.12)                                        # the counter fills
for k in ('s1', 's2', 's3', 's4', 's5', 's6', 's7'): A('drum_hit', W[k] - 0.05, 0.3)          # STRIKE n titles
for k in ('toenail', 'eyebrows', 'yard', 'fire1', 'fire2', 'ankle', 'catches'): A('impact_1', W[k], 0.2)   # what it took
S('pop', W['toenail'] + 0.02, 0.5); TN([2093], W['toenail'] + 0.1, 0.05, 0.1)               # the toenail pings off
S('thunder', W['comes'] - 0.02, 0.4); S('zap', W['comes'], 0.3)                            # strike two hits the tree first
S('hiss', W['burns'] - 0.05, 0.35, dur=0.6); S('pop', W['burns'], 0.25)                    # eyebrows gone
S('thud', W['eyebrows'] + 2.15, 0.2)                                                       # the truck stops at the rail
S('thunder', W['own'] - 0.04, 0.45); S('zap', W['own'], 0.4)                               # the transformer
S('fwoomp', W['hair1'] - 0.1, 0.45); S('fire', W['hair1'], 0.22, dur=W['now'] - W['hair1'])       # hair on fire
S('chime', W['can'] - 0.1, 0.4); TN([1047, 1568], W['can'] - 0.1, 0.05, 0.14)              # NEW ITEM: water can
S('thunder', W['cloud'] - 0.1, 0.22, dur=1.6)                                              # he spots the cloud
S('whoosh', W['races'] - 0.1, 0.45); A('swish_1', W['races'] + 0.4, 0.25)                  # races away
S('fwoomp', W['fire2'] - 0.1, 0.4); S('fire', W['fire2'], 0.2, dur=W['again'] + 0.7 - W['fire2'])
S('hiss', W['again'] + 0.35, 0.45, dur=1.2)                                                # the water can puts it out
A('swish_3', W['stand'], 0.2)                                                              # the girls leave the bench
S('thunder', W['flashes'] + 0.5, 0.2, dur=2.0)                                             # far-off rumble
TN([660, 880], W['says'] - 0.1, 0.04, 0.1); A('swish_4', W['later'] + 0.1, 0.25)            # the boss: bubble, off he goes
for k in range(3): S('boing', W['gets'] + 0.55 + k * 0.42, 0.15)                           # hopping on one leg
S('pop', W['fishing'] + 0.3, 0.3); A('swish_1', W['fishing'] + 0.6, 0.25); S('thud', W['fishing'] + 0.95, 0.2)   # bite, reel, catch on the stump
S('fwoomp', W['catches'] - 0.1, 0.4); S('fire', W['catches'], 0.18, dur=T['bear'] - W['catches'])
S('roar', W['walks'] + 0.1, 0.22); S('chomp', W['fish'] - 0.02, 0.55)                      # the bear
S('whoosh', W['chases'] - 0.05, 0.35); S('roar', W['chases'] + 0.35, 0.18)                 # chased off
S('fanfare', W['seven2'] - 0.05, 0.4); A('impact_3', W['survived'] - 0.02, 0.35); S('chime', W['survived'], 0.3)
S('applause', W['record'], 0.22); TN([1047, 1319, 1568], W['stands'] - 0.05, 0.06, 0.18)   # still the record
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
