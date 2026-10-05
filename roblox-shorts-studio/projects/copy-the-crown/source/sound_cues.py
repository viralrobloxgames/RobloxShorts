"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/sfx_assets.py).
Key times mirror T and COPY in web/crown_clip.js: the crown slam, the copied moves (one sound for the whole crowd, since
everyone moves at once), the splashes, the bonk, the crown landing on Mia and the win."""
import json, math
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T_FALL = math.sqrt(2 * 6 / 60)
T = dict(slam=0.2, grab=W['grabs'] + 0.05, grabLand=W['grabs'] + 0.38, respawn=W['respawns'] - 0.1, charge=W['charges'] - 0.05,
         bonk=W['bonk'], landMia=max(W['bonk'] + 0.7, W['hers'] - 0.05), leoDrop=W['splash2'] - T_FALL, maxDrop1=W['splash1'] - T_FALL,
         maxDrop2=W['splash3'] - T_FALL, win=W['splash3'] + 0.35, cta=W['follow'] + 0.75)
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g})
S = lambda n, t, g=0.35: A(f'sfx/{n}.wav', t, g)
TN = lambda f, t, g=0.05, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
thud = lambda t, g=0.04: TN([220, 330], t, g, 0.06, sweep=900)
# the crown slams onto the Noob
S('whoosh', 0.0, 0.25); A('impact_1', T['slam'], 0.4); S('chime', T['slam'] + 0.02, 0.25)
# the demonstration: arm, step, jump (everyone at once)
A('swish_1', W['copies'] - 0.12, 0.25)
thud(W['step1'] + 0.1, 0.05)
S('boing', W['jump1'] - 0.08, 0.22); thud(W['jump1'] + 0.45, 0.04)
# Leo snatches it
A('swish_2', T['grab'], 0.3); S('pop', T['grabLand'], 0.4); S('chime', T['grabLand'] + 0.02, 0.2)
# three steps (the whole crowd), Max walking on air, the drop and the splash
for k in range(3): thud(W['three1'] - 0.05 + k * 0.17, 0.045)
S('whoosh', T['maxDrop1'], 0.4)
S('fwoomp', W['splash1'], 0.6); S('hiss', W['splash1'] + 0.1, 0.45); A('impact_2', W['splash1'], 0.3)
# respawn, charge, yanked backwards
TN([523, 784], T['respawn'], 0.04, 0.14)
A('swish_3', T['charge'], 0.25)
TN([520, 260], W['backwards1'] - 0.18, 0.05, 0.5, sweep=-500)
A('drum_hit', W['never'] + 0.05, 0.25)                            # Max's stomp
# spins and the dance
A('swish_4', W['spins1'] - 0.05, 0.3); A('swish_1', W['spins2'] - 0.05, 0.3)
# ten seconds, the flattery, the bow and the bonk
TN([880], W['ten'], 0.05, 0.12); TN([880], W['ten'] + 1, 0.03, 0.08)
A('impact_3', T['bonk'], 0.45); S('boing', T['bonk'] + 0.02, 0.35)
S('whoosh', T['bonk'] + 0.1, 0.25); S('pop', T['landMia'], 0.35); S('chime', T['landMia'] + 0.02, 0.3)
# three seconds, one step back, two splashes
TN([880], W['three2'], 0.05, 0.12)
thud(W['back'] - 0.1, 0.05)
S('whoosh', T['leoDrop'], 0.35); S('fwoomp', W['splash2'], 0.55); S('hiss', W['splash2'] + 0.1, 0.35)
S('whoosh', T['maxDrop2'], 0.3); S('fwoomp', W['splash3'], 0.55); A('impact_2', W['splash3'], 0.25)
# the win and the CTA
S('fanfare', T['win'], 0.5); S('coins', T['win'] + 0.05, 0.45)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
