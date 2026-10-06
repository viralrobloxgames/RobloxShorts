"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/tornado_clip.js. A tornado roar with thunder and crashing planes in the hook; typewriter,
stamps, the door bang and speech-bubble pops in the office; ticking through the montage; radar pings and a tension
rise before "yes or no?"; the siren, hangar doors and rain while the base gets ready; an elevator ding in the daydream;
the clock striking six into the second roar; a fanfare and applause when the forecast comes true; the phone buzzing
with the alert at the end. SFX are listed in source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(days=W['five1'] - 0.1, notice=W['tornadoes1'] - 0.1, type=W['weather1'] - 0.1, general=W['but'] - 0.1, rain=W['if'] - 0.1,
         dig=W['so'] - 0.1, map=W['on'] - 0.1, eyes=W['night'] - 0.05, odds=W['odds'] - 0.1, billions=W['billions'] - 0.1,
         radar=W['general2'] - 0.1, yesno=W['another2'] - 0.1, yes=W['they2'] - 0.1, hangar=W['planes2'] - 0.1, shelter=W['everyone'] - 0.1,
         home=W['one3'] - 0.1, dream=W['wondering'] - 0.1, clock=W['at'] - 0.1, hit2=W['tornado4'] - 0.2, same=W['almost'] - 0.1,
         ready=W['this'] - 0.1, first=W['first'] - 0.1, phone=W['warnings'] - 0.1, cta=W['follow'] - 0.15, end=W['end'] + 2.0)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def bed(name, t0, t1, g, length):                         # a loop laid end to end (each piece cut to fit)
    t = t0
    while t < t1 - 0.05: S(name, t, g, dur=min(length, t1 - t + 0.15)); t += length - 0.15

# ---- the hook: the night of March 20
bed('tornado', 0.0, T['days'] + 0.1, 0.42, 5.5)
bed('forest_wind', 0.0, T['days'] + 0.1, 0.2, 8.0)
for t, g in ((0.0, 0.55), (1.35, 0.32), (2.25, 0.3)): S('thunder', t, g, dur=1.6)
A('drum_hit', 0.0, 0.35)
for t, a in ((0.35, 'impact_2'), (1.0, 'impact_3'), (1.75, 'impact_4'), (2.5, 'impact_2')): A(a, t, 0.28); S('clang', t + 0.02, 0.18)
S('whoosh', 0.15, 0.3); S('whoosh', 1.4, 0.25)
# ---- the office, five days later
A('swish_1', T['days'] - 0.05, 0.3); S('pop', W['two'] - 0.1, 0.3)
A('drum_hit', W['coming'] - 0.1, 0.35); A('impact_1', W['back'] - 0.05, 0.3)
A('swish_2', T['notice'], 0.25); S('flutter', T['notice'] + 0.05, 0.12, dur=0.8)
S('typewriter', T['type'] + 0.05, 0.4)
S('thud', W['allowed'] - 0.1, 0.45); A('impact_3', W['allowed'] - 0.08, 0.3); S('pop', W['word'] - 0.1, 0.25)
S('thud', T['general'] - 0.02, 0.55); A('swish_3', T['general'] + 0.05, 0.25); A('drum_hit', W['general1'] - 0.1, 0.3)
bed('rain', T['general'], T['dig'], 0.05, 5.7)
S('pop', T['rain'] + 0.05, 0.3)
# the montage: papers, the clock racing, a tick for each new day
S('flutter', T['dig'] + 0.05, 0.16); S('flutter', T['dig'] + 1.3, 0.12)
k = T['dig']
while k < T['map'] - 0.1: A('click', k, 0.12); k += 0.18
for d in range(5): TN([784 + 98 * d], T['dig'] + d * (T['map'] - 0.2 - T['dig']) / 5, 0.05, 0.1)
S('whoosh', W['map'] - 0.2, 0.3); S('thud', W['exactly'] - 0.05, 0.45); A('impact_2', W['exactly'] - 0.03, 0.25)
A('impact_1', T['eyes'], 0.3); TN([523, 415], T['eyes'] + 0.02, 0.05, 0.14)
# the odds
A('swish_4', T['odds'], 0.3); S('pop', T['odds'] + 0.1, 0.25)
k = W['odds'] + 0.2
while k < T['billions']: A('click', k, 0.1); k += 0.07
A('drum_hit', T['billions'], 0.4); A('impact_3', T['billions'] + 0.15, 0.3)
# the radar, yes or no
for d in (0.15, 1.05, 1.95): S('radar_ping', T['radar'] + d, 0.28)
S('thunder', T['radar'] + 0.4, 0.15, dur=2.0)
A('horror/tension_rise', T['yesno'] - 0.1, 0.2, dur=T['yes'] - T['yesno'] + 0.1); S('pop', W['another2'] - 0.05, 0.3)
A('impact_2', W['yes2'] - 0.08, 0.35); S('chime', W['yes2'] - 0.05, 0.35); S('typewriter', W['yes2'] + 0.25, 0.25, dur=1.0)
# getting ready: siren, hangar doors, rain, wind
S('siren', T['hangar'] - 0.25, 0.22); S('siren', T['hangar'] + 2.6, 0.2)
bed('rain', T['hangar'], T['dream'], 0.1, 5.7); bed('forest_wind', T['hangar'], T['dream'], 0.12, 8.0)
S('hangar_roll', W['hangars'] + 0.1, 0.35); S('hangar_roll', W['hangars'] + 0.55, 0.25); S('pop', W['hangars'] - 0.1, 0.2)
S('whoosh', T['shelter'] + 0.05, 0.3); S('pop', T['shelter'] + 0.05, 0.2)
S('thunder', T['home'] + 0.3, 0.18, dur=2.4)
# the daydream
A('swish_1', T['dream'], 0.25); S('desk_bell', T['dream'] + 0.55, 0.35); S('pop', W['job'] - 0.15, 0.25)
S('hangar_roll', T['dream'] + 1.9, 0.15, dur=1.0); TN([659, 523], T['dream'] + 1.7, 0.05, 0.25)
# six o'clock: the second tornado
A('click', T['clock'] + 0.15, 0.3); A('drum_hit', T['clock'] + 0.2, 0.4); TN([392], T['clock'] + 0.2, 0.06, 0.5)
bed('tornado', T['hit2'], T['same'] + 0.1, 0.45, 5.5); bed('rain', T['hit2'], T['same'], 0.1, 5.7)
for d in (0.3, 1.4): S('thunder', T['hit2'] + d, 0.35, dur=1.8)
S('hangar_roll', T['hit2'] + 0.6, 0.15, dur=1.0); A('impact_3', W['again'] - 0.1, 0.35)
S('whoosh', T['same'], 0.3); S('pop', T['same'] + 0.05, 0.2); S('pop', W['same2'] - 0.1, 0.2); A('impact_2', W['spot'] - 0.1, 0.3)
# the morning after
S('chime', W['ready'] - 0.1, 0.35); TN([784, 988, 1175], W['ready'] - 0.05, 0.04, 0.16)
S('fanfare', W['first'] - 0.05, 0.4); S('thud', W['true'] - 0.1, 0.4); S('applause', W['true'], 0.28)
# today: the phone
for d in (0.05, 0.95): S('buzz', T['phone'] + d, 0.4)
for i in range(3): TN([853, 960], T['phone'] + 0.15 + i * 0.6, 0.035, 0.22)
S('pop', W['born'] - 0.1, 0.25)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues, ends', round(max(x['start'] for x in c), 2), 's')
