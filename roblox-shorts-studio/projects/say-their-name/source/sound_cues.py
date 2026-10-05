"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/sfx_assets.py).
Key times mirror T in web/tower_clip.js: a pop + whoosh on every teleport, hop thuds on the fast climbs, crickets for
"Nothing.", the lava splash, coins and a fanfare for the win."""
import json, math
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
lerp = lambda a, b, u: a + (b - a) * u
evenly = lambda a, b, n: [a if n == 1 else lerp(a, b, k / (n - 1)) for k in range(n)]
T = dict(tp0=0.32, leap=W['leo2'] - 0.3, tp1=min(W['pop1'] - 0.02, W['leo2'] + 0.75), maxUp=W['climbs'] - 0.25, tp2=W['pop2'] - 0.02,
         leoUp=W['up1'] - 0.12, tp3=W['down1'] - 0.02, maxUp2=W['up2'] - 0.12, tp4=W['down2'] - 0.02, type0=W['changes'] - 0.1,
         steve=W['steve1'], steveUp=W['steve1'] + 0.45, tp5=W['pop3'] - 0.02, unsteve=W['pop3'] + 0.75, tpMax=W['pop4'] - 0.02,
         tpLeo=W['pop5'] - 0.02, drop=W['straight'] + 0.05, respawn=W['now'] + 0.4, noobLand=W['jumps'] + 0.15, tpNoob=W['pop6'] - 0.02,
         cta=W['follow'] - 0.15)
T['splash'] = T['drop'] + math.sqrt(2 * (3.5 * 8 + 0.45) / 60)
END = W['end'] + 1.6
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.35: A(f'sfx/{n}.wav', t, g)
TN = lambda f, t, g=0.05, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
for k in ('tp0', 'tp1', 'tp2', 'tp3', 'tp4', 'tp5', 'tpMax', 'tpLeo', 'tpNoob'):
    S('whoosh', T[k] - 0.12, 0.3); S('pop', T[k], 0.55)
# hops: a soft thud per landing on the fast climbs (period from the clip's schedules)
for a, b, n, air in ((T['maxUp'], T['tp2'] - 0.12, 8, 0.3), (T['leoUp'], W['leo4'] + 0.3, 5, 0.26), (T['maxUp2'], W['max4'] + 0.1, 5, 0.26), (T['steveUp'], W['max5'] - 0.4, 6, 0.4)):
    for t in evenly(a, b, n):
        if t + air < b + 0.1: TN([220, 330], t, 0.035, 0.06, sweep=900)
TN([196, 392], T['leap'], 0.05, 0.12, sweep=1400)            # Leo's big leap
for i in range(5): A('click', T['type0'] + 0.15 + i * 0.13, 0.18)   # typing the new name
S('chime', T['steve'], 0.35); S('chime', T['unsteve'], 0.2)
S('crickets', W['nothing'] + 0.05, 0.45)
S('whoosh', T['drop'], 0.4)
S('fwoomp', T['splash'], 0.6); S('hiss', T['splash'] + 0.1, 0.45); A('impact_2', T['splash'], 0.3)
TN([523, 784], T['respawn'], 0.04, 0.14)
TN([660, 880], W['easy'], 0.03, 0.1)
S('boing', T['noobLand'] - 0.45, 0.25)
S('fanfare', T['noobLand'], 0.5); S('coins', T['noobLand'] + 0.05, 0.5)
S('coins', T['tpNoob'] + 0.05, 0.35)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
