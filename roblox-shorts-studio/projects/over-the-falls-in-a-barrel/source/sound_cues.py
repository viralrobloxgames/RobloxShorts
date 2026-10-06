"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/barrel_clip.js. The falls roar under the river shots (louder near the brink); a creak as
she steps in; a party horn of tones for the birthday; a sting on BROKE and coins in the daydream; a meow and the test
barrel going over, then a happy meow below; pump strokes; the lid knock, the push and a big splash; rushing rapids into
the drop; a fanfare and applause when she climbs out alive; the newspaper whoosh and the crowd; the barrel rumbling
off down the path; coins counting away to nothing. SFX are listed in source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(nobody=W['nobody'] - 0.1, bday=W['its'] - 0.1, younger=W['tells'] - 0.1, broke=W['shes2'] - 0.1, catin=W['two'] - 0.1, catover=W['first'] - 0.1,
         catok=W['cat2'] - 0.1, pump=W['so'] - 0.1, seal=W['they'] - 0.1, current=W['current'] - 0.1, over=W['over3'] - 0.1, rescue=W['about'] - 0.1,
         alive=W['climbs2'] - 0.1, verdict=W['verdict'] - 0.1, famous=W['shes3'] - 0.1, manager=W['then'] - 0.1, detect=W['spends'] - 0.1, cta=W['follow'] - 0.15, end=W['end'] + 2.0)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def bed(name, t0, t1, g, length):
    t = t0
    while t < t1 - 0.05: S(name, t, g, dur=min(length, t1 - t + 0.15)); t += length - 0.15
# the river under everything above the falls, the roar near the brink
bed('rapids', 0.0, T['catok'], 0.08, 5.0); bed('roar', 0.0, T['catok'], 0.07, 6.0)
A('drum_hit', 0.0, 0.3); S('creak', 0.25, 0.35); S('thud', 1.2, 0.25); A('impact_2', 0.05, 0.2)
S('whoosh', T['nobody'], 0.3); bed('roar', T['nobody'], T['bday'], 0.25, 6.0); A('impact_3', W['survived1'] - 0.1, 0.35)
# birthday
S('pop', W['birthday'] - 0.15, 0.3); TN([523, 659, 784, 1047], W['birthday'] - 0.1, 0.05, 0.12)
# younger: a slide whistle down for the strike
S('pop', W['tells'] - 0.05, 0.25); TN([880, 784, 698, 587], W['twenty1'] - 0.05, 0.05, 0.07); A('click', W['younger'] - 0.1, 0.3)
# broke
S('thud', W['broke'] - 0.1, 0.45); A('impact_1', W['broke'] - 0.08, 0.3); S('pop', W['thinks'] - 0.1, 0.25); S('coins', W['rich'] - 0.2, 0.3)
# the cat
S('meow', T['catin'] + 0.15, 0.4); S('whoosh', T['catin'] + 0.6, 0.2); S('knock', W['first'] - 0.3, 0.3)
bed('roar', T['catover'], T['catok'], 0.35, 6.0); S('whoosh', T['catover'] + 0.9, 0.3); S('splash', T['catover'] + 1.7, 0.3)
bed('roar', T['catok'], T['pump'], 0.18, 6.0); S('meow', W['survived2'] - 0.05, 0.45); S('chime', W['survived2'] - 0.1, 0.3); TN([784, 988, 1175], W['survived2'], 0.04, 0.14)
# the pump, the lid, the push
bed('rapids', T['pump'], T['current'], 0.07, 5.0); k = T['pump'] + 0.3
while k < T['seal'] - 0.1: S('pump', k + 0.05, 0.28); k += 0.62
S('creak', W['seal'] - 0.3, 0.3); S('knock', W['seal'] + 0.2, 0.45); A('impact_2', W['seal'] - 0.05, 0.25)
S('roll', W['adrift'] - 0.8, 0.2, dur=0.8); S('splash', W['adrift'] + 0.38, 0.5); S('pop', W['adrift'] + 0.35, 0.2)
# the current and the drop
bed('rapids', T['current'], T['over'], 0.35, 5.0); bed('roar', T['current'], T['rescue'], 0.4, 6.0); A('impact_3', W['edge'] - 0.15, 0.3)
S('whoosh', T['over'] + 0.2, 0.35); S('whoosh', T['over'] + 0.9, 0.3); A('drum_hit', W['horseshoe'] - 0.1, 0.35); S('splash', T['rescue'] - 0.25, 0.45)
# rescue and alive
bed('rapids', T['rescue'], T['verdict'], 0.1, 5.0); S('splash', W['grab'] - 0.05, 0.25); S('pop', W['grab'] - 0.1, 0.25)
S('creak', T['alive'] + 0.05, 0.35); TN([660, 620, 700, 600], T['alive'] + 0.35, 0.04, 0.12)
S('fanfare', W['alive'] - 0.1, 0.4); S('applause', W['alive'], 0.22, dur=2.2)
# the verdict
S('pop', W['never'] - 0.1, 0.3); A('impact_1', W['again'] - 0.05, 0.3)
# famous
S('flutter', T['famous'] + 0.05, 0.3); S('whoosh', T['famous'] + 0.05, 0.3); S('thud', T['famous'] + 0.45, 0.3); S('applause', T['famous'] + 0.2, 0.3, dur=T['manager'] - T['famous'])
S('coins', W['money'] - 0.1, 0.2); TN([440, 415], W['pouring'] + 0.1, 0.05, 0.25)
# the manager
S('roll', W['manager'] - 0.1, 0.4); S('roll', W['manager'] + 1.9, 0.3); A('impact_4', W['runs'] - 0.1, 0.3); TN([523, 494, 466, 440], W['barrel5'] - 0.1, 0.05, 0.12)
# the detectives
k = W['savings'] - 0.1
while k < W['back']: S('coins', k, 0.16, dur=0.3); k += 0.32
S('thud', W['back'] - 0.05, 0.4); A('impact_3', W['back'], 0.25)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues, ends', round(max(x['start'] for x in c), 2), 's')
