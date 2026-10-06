"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/wrongway_clip.js. The engine drone under every flying shot (rolling, climbing, over the sea,
in the cockpit), a sputter as it slows in Dublin; stamps thudding in the office; wind and a whoosh into the cloud bank;
drips and the screwdriver punch; a telegraph run under the telegram; waves and the liner's horn; a crowd, applause,
ticker-tape flutter and a fanfare for the parade. SFX are listed in source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(ire=W['twentyeight'] - 0.1, ask=W['for'] - 0.1, denied=W['officials1'] - 0.1, patched=W['his1'] - 0.1, plan=W['so'] - 0.1,
         takeoff=W['at'] - 0.1, east=W['kept'] - 0.1, radio=W['no2'] - 0.1, leak=W['then'] - 0.1, screw=W['punched'] - 0.1,
         dublin=W['lands2'] - 0.1, whereami=W['just'] - 0.15, excuse=W['excuse'] - 0.1, telegram=W['officials2'] - 0.1,
         ship=W['punishment'] - 0.1, parade=W['new3'] - 0.1, bigger=W['bigger'] - 0.1, name=W['they'] - 0.1, admit=W['and4'] - 0.1,
         cta=W['follow'] - 0.15, end=W['end'] + 2.5)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def bed(name, t0, t1, g, length):                         # a loop laid end to end (each piece cut to fit)
    t = t0
    while t < t1 - 0.05: S(name, t, g, dur=min(length, t1 - t + 0.15)); t += length - 0.15

# ---- the hook: rolling down the runway, then Ireland
bed('engine', 0.0, T['ire'] + 0.1, 0.4, 4.0)
A('drum_hit', 0.0, 0.3); S('whoosh', 0.2, 0.2)
S('whoosh', T['ire'] - 0.05, 0.3); bed('engine', T['ire'], T['ask'], 0.3, 4.0)
S('thud', W['ireland'] - 0.35, 0.35); A('impact_2', W['ireland'] - 0.1, 0.3); S('pop', W['ireland'] - 0.1, 0.25)
# ---- the office: asking, DENIED, the patched plane, the flight plan, APPROVED
A('swish_1', T['ask'] - 0.05, 0.3); S('pop', T['ask'] + 0.05, 0.25)
S('thud', W['no1'] - 0.05, 0.55); A('impact_3', W['no1'] - 0.03, 0.3); TN([392, 311], W['no1'] + 0.1, 0.05, 0.22)
A('swish_2', T['patched'], 0.25); S('flutter', T['patched'] + 0.2, 0.18, dur=1.2); S('pop', W['old'] - 0.15, 0.25); S('pop', W['patched'] - 0.15, 0.25)
A('swish_3', T['plan'], 0.25); S('pop', W['flight'] - 0.1, 0.2)
S('thud', W['california2'] - 0.02, 0.5); S('chime', W['california2'] + 0.02, 0.3)
# ---- dawn: take-off, east into the clouds
S('sputter', T['takeoff'] - 0.1, 0.3); bed('engine', T['takeoff'] + 0.5, T['radio'], 0.42, 4.0)
S('whoosh', W['took'] - 0.1, 0.3)
A('swish_4', T['east'], 0.3); bed('forest_wind', T['east'], T['dublin'], 0.12, 8.0)
k = T['east'] + 0.3
for i in range(4): TN([523 + 60 * i], k + i * 0.35, 0.03, 0.08)
A('drum_hit', W['east'] - 0.1, 0.35); S('whoosh', W['clouds1'] - 0.2, 0.4)
# ---- the cockpit: no radio, the compass, the leak, the screwdriver
bed('engine', T['radio'], T['dublin'], 0.22, 4.0)
A('impact_1', W['radio'] - 0.15, 0.3); S('pop', W['twenty'] - 0.1, 0.25); TN([660, 620, 700, 600], W['twenty'], 0.025, 0.12)
for i in range(7): S('drip', T['leak'] + 0.25 + i * 0.32, 0.3)
A('impact_2', W['fuel'] - 0.1, 0.3); TN([440, 415, 392], W['leaked'], 0.04, 0.16)
for d in (0.75, 1.15): S('thud', T['screw'] + d, 0.5); S('clang', T['screw'] + d + 0.01, 0.2)
for i in range(3): S('drip', T['screw'] + 1.4 + i * 0.25, 0.2)
S('pop', W['screwdriver'] - 0.1, 0.2)
# ---- Dublin: the engine dies away, "where am I?", the compass excuse
S('sputter', T['dublin'] - 0.1, 0.25); S('chime', W['dublin'] - 0.05, 0.25)
S('pop', T['whereami'] + 0.05, 0.3); TN([523, 659], W['am'] + 0.15, 0.04, 0.16)
A('swish_1', T['excuse'], 0.25); S('pop', W['clouds2'] - 0.1, 0.25)
k = W['clouds2']
while k < T['telegram'] - 0.1: A('click', k, 0.1); k += 0.09
A('drum_hit', W['compass2'] - 0.1, 0.3)
# ---- the telegram: telegraph beeps, the strip unrolling
S('telegraph', T['telegram'], 0.25); S('telegraph', T['telegram'] + 1.6, 0.2)
S('flutter', T['telegram'] + 0.15, 0.25, dur=1.6); S('pop', W['sent'] - 0.1, 0.2); A('impact_3', W['rules'] - 0.1, 0.3)
# ---- the ship home
bed('waves', T['ship'], T['parade'], 0.28, 6.0)
S('horn', T['ship'] + 0.1, 0.35)
S('thud', W['flying2'] - 0.12, 0.5); A('impact_2', W['flying2'] - 0.1, 0.3)
k = W['until']
while k < W['home'] - 0.1: A('click', k, 0.12); k += 0.12
S('chime', W['home'] - 0.1, 0.35); S('horn', W['home'] - 0.05, 0.25, dur=1.6)
# ---- New York: the parade
bed('crowd', T['parade'], T['end'], 0.3, 5.0)
S('fanfare', T['parade'] + 0.05, 0.35); S('applause', T['parade'] + 0.3, 0.3); S('flutter', T['parade'] + 0.1, 0.2, dur=2.0)
S('pop', W['parade'] - 0.15, 0.25)
A('drum_hit', T['bigger'], 0.35); S('pop', W['lindberghs'] - 0.1, 0.3); S('applause', T['bigger'] + 0.4, 0.25)
S('flutter', T['name'], 0.2, dur=2.0); S('pop', W['wrong'] - 0.1, 0.3)
S('pop', T['admit'] + 0.05, 0.25); TN([392, 466], W['admitted'] - 0.1, 0.05, 0.2); A('impact_1', W['thing'] - 0.1, 0.3)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues, ends', round(max(x['start'] for x in c), 2), 's')
