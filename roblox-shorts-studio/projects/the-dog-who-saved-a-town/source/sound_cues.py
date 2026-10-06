"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/dog_clip.js. Clock ticks under RUNNING OUT OF TIME, wind through the snowy shots, a pop for
the medicine card, a clang + buzz on NO SHIPS and NO PLANES, barks and a whoosh as the team bursts in, pings along the
relay strip, a buzz on THE HARDEST PART, a bark for Togo, pops on GOT IT! and RACE BACK!, a howling blizzard on the ice,
creaks and crunches as the ice breaks up at night, a chime on JUST IN TIME, rising dings for 261 MILES, a fanfare for
OUTBREAK STOPPED, crowd and applause at Balto's statue, a sad low tone for Togo, a chime when his statue rises.
SFX in audio/sfx/ are copied from She Raced Around The World (pop, chime, whoosh, clang, buzz, applause, thud, fanfare,
crowd, desk_bell), He Flew A Lawn Chair (wind) and other projects' audio/sfx (bark, woof, creak, crunch)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(sick=W['kids'] - 0.1, ships=W['ships'] - 0.1, planes=W['planes'] - 0.1, dogs=W['dogs'] - 0.75, relay=W['twenty'] - 0.1,
         hardest=W['one'] - 0.1, togo=W['leader'] - 0.1, run=W['run'] - 0.3, back=W['turn'] - 0.35, ice=W['togo2'] - 0.1,
         night=W['night'] - 0.35, miles=W['two'] - 0.1, arrive=W['five'] - 0.1, statue=W['but'] - 0.1, wait=W['togo3'] - 0.1,
         cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})

S('pop', 0.05, 0.3); S('wind', 0.1, 0.14, dur=T['sick'] - 0.2)                     # 1925, the town at night
t = 0.5
while t < T['sick']: TN([1760], t, 0.03, 0.03); t += 0.5                        # the clock ticking
S('whoosh', W['time1'] - 0.4, 0.3); A('impact_3', W['time1'] - 0.1, 0.25)          # RUNNING OUT OF TIME
S('pop', W['medicine1'] - 0.2, 0.3); S('chime', W['seven'] - 0.2, 0.2)             # the card: 700 MILES
S('wind', T['ships'], 0.14, dur=T['dogs'] - T['ships'])
S('clang', W['ice1'] - 0.4, 0.35); S('buzz', W['ice1'] - 0.35, 0.3)               # NO SHIPS
S('clang', W['cold'] - 0.4, 0.35); S('buzz', W['cold'] - 0.35, 0.3)               # NO PLANES
S('whoosh', T['dogs'] + 0.1, 0.45); S('bark', W['dogs'] - 0.1, 0.35); S('woof', W['dogs'] + 0.35, 0.25)
t = T['dogs'] + 0.3
while t < T['ice'] - 0.5: S('wind', t, 0.12, dur=min(8.0, T['ice'] - t)); t += 7.8
for i in range(5): TN([880 + i * 110], T['relay'] + 0.3 + i * (T['hardest'] - T['relay'] - 0.4) / 5, 0.04, 0.08)   # relay pings
S('buzz', W['hardest'] - 0.3, 0.3); A('impact_3', W['hardest'] - 0.2, 0.25)        # THE HARDEST PART
S('bark', W['togo1'] - 0.1, 0.4); S('pop', W['twelve'] - 0.2, 0.25)               # TOGO, AGE 12
S('pop', W['reach'], 0.4); S('chime', W['reach'] + 0.05, 0.25)                     # GOT IT!
S('whoosh', T['back'] + 0.4, 0.4); S('pop', W['back'] - 0.2, 0.3)                  # the U-turn, RACE BACK!
S('wind', T['ice'], 0.35, dur=T['night'] - T['ice'] + 0.3); S('wind', T['ice'] + 1.5, 0.25, dur=T['night'] - T['ice'] - 1.2)   # the blizzard
S('whoosh', W['shortcut'] - 0.2, 0.3); S('clang', W['blizzard'] - 0.15, 0.2)
S('wind', T['night'], 0.18, dur=T['miles'] - T['night'])
S('creak', W['storm'] - 0.1, 0.35); S('crunch', W['ice2'] - 0.1, 0.4); S('creak', W['sea2'] - 0.2, 0.3); S('crunch', W['sea2'] + 0.2, 0.3)
S('chime', W['crossed'] - 0.2, 0.35); A('impact_2', W['crossed'] - 0.1, 0.25)       # JUST IN TIME
for k, f in (('two', [880, 1175]), ('sixtyone', [1175, 1568])): TN(f, W[k] - 0.1, 0.06, 0.14)
S('woof', W['more'], 0.25)
S('pop', W['five'] - 0.1, 0.3); S('fanfare', W['stopped'] - 0.3, 0.3)              # 5 1/2 DAYS, OUTBREAK STOPPED
S('crowd', T['statue'], 0.16, dur=T['wait'] - T['statue']); S('whoosh', W['statue'] - 0.2, 0.3); S('applause', W['statue'] + 0.1, 0.25)
S('pop', W['balto'] - 0.2, 0.3)
TN([392, 330], T['wait'] + 0.1, 0.05, 0.4)                                         # a sad low tone for Togo
for i in range(6): TN([1320], T['wait'] + 0.3 + i * (W['years'] + 0.2 - T['wait'] - 0.3) / 6, 0.03, 0.03)   # the years ticking
S('chime', W['years'] + 0.05, 0.35); S('woof', W['years'] + 0.5, 0.3)          # 2001: his statue rises
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
