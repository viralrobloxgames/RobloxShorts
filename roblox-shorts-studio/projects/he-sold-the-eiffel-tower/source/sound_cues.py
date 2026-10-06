"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/eiffel_clip.js: a stamp thud for SOLD, a whistle for the policeman, the newspaper whoosh and
a crash for A FORTUNE, a chime for the idea, typewriter and stamp, letters fluttering, the hotel bell, whispers, coins
for the bribe and the cash, the train whistle and steam, a sad trombone-ish bonk for SCAMMED, the phone ring and the
police whistle, waves and the ship horn, coins from Capone, the money box, the escape and CAUGHT AGAIN.
SFX: source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(buyer=W['buyer'] - 0.35, news=W['paris'] - 0.15, idea=W['victor'] - 0.1, letters=W['fakes'] - 0.1, stampT=W['letters'] - 0.1, hotel=W['fancy'] - 0.25,
         whisper=W['tower3'] - 0.15, poisson=W['one'] - 0.1, bribe=W['so1'] - 0.1, train=W['train'] - 0.35, shame=W['poisson3'] - 0.3, again=W['so2'] - 0.1,
         call=W['time'] - 0.2, flee=W['flees'] - 0.1, capone=W['tricks'] - 0.3, money=W['then'] - 0.1, rope=W['escapes'] - 0.1, cert=W['death'] - 0.25,
         cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
# hook: SOLD! stamp; the policeman strolls past, the buyer hides the deed
A('drum_hit', 0.0, 0.25); S('thud', W['sold'] - 0.1, 0.45); A('impact_1', W['sold'] - 0.1, 0.25); S('crowd', 0.0, 0.06, dur=T['news'])
S('police_whistle', W['police1'] - 0.35, 0.12); A('swish_2', W['police1'] - 0.2, 0.25); S('pop', W['police1'] - 0.1, 0.2)
# 1925: the newspaper spins in, rust, A FORTUNE
S('whoosh', T['news'], 0.35); S('flutter', T['news'] + 0.1, 0.25); A('impact_2', T['news'] + 0.5, 0.25)
S('shake', W['rusting'] - 0.05, 0.2); S('clang', W['rusting'] + 0.2, 0.15); S('coins', W['fortune'] - 0.15, 0.35); A('drum_hit', W['fortune'] - 0.15, 0.3)
# the idea
S('flutter', W['reads'] + 0.25, 0.2); S('chime', W['idea'] - 0.15, 0.4); TN([784, 988, 1319], W['idea'] - 0.1, 0.04, 0.14)
# the fake letters
S('typewriter', T['letters'] + 0.05, 0.3, dur=T['stampT'] - T['letters']); S('thud', T['stampT'] + 0.15, 0.45); S('desk_bell', T['stampT'] + 0.2, 0.15)
for i in range(5): S('flutter', W['invites'] - 0.2 + i * 0.12, 0.12)
S('whoosh', W['invites'] - 0.1, 0.25)
# the hotel: bell, hush, whisper, TOP SECRET
S('desk_bell', T['hotel'] + 0.05, 0.3); S('crowd', T['hotel'], 0.07, dur=T['whisper'] - T['hotel'])
S('hiss', T['whisper'] + 0.1, 0.08, dur=0.6); S('thud', W['secret'] - 0.1, 0.4); A('impact_3', W['secret'] - 0.1, 0.2); S('pop', W['wants1'] - 0.15, 0.25)
# Poisson wants it; the bribe; the cash
S('chime', T['poisson'] + 0.05, 0.25); S('boing', W['wants2'] - 0.1, 0.2)
S('coins', W['bribe'] - 0.1, 0.35); S('coins', W['pays'] - 0.05, 0.4); A('swish_3', W['grabs'] - 0.05, 0.3)
# the train out
S('train_whistle', T['train'] + 0.05, 0.3); S('hiss', T['train'] + 0.2, 0.18, dur=2.0)
k = W['train'] + 0.2; step = 0.45
while k < T['shame'] - 0.1: S('thud', k, 0.08); k += step; step = max(0.18, step * 0.88)
# SCAMMED
S('bonk', W['embarrassed'] - 0.15, 0.35); TN([392, 370, 349, 330], W['embarrassed'] + 0.05, 0.05, 0.22)
# back again
S('hiss', T['again'], 0.18, dur=1.2); S('squeak', W['comes'] - 0.1, 0.25); S('footstep', W['back'] - 0.05, 0.2); A('drum_hit', W['again1'] - 0.25, 0.3); S('pop', W['again1'] - 0.25, 0.25)
# the call: phone ring, POLICE!
S('ring', T['call'] + 0.0, 0.25, dur=0.6); S('police_whistle', W['police2'] - 0.25, 0.25); S('thud', W['police2'] - 0.2, 0.35)
# flee to America: waves, footsteps, ship horn
S('waves', T['flee'], 0.15, dur=T['capone'] - T['flee']); S('horn', W['america'] - 0.2, 0.3)
k = T['flee']
while k < T['capone'] - 0.1: S('footstep', k, 0.14); k += 0.22
# Capone: case on the desk, the reward
S('thud', W['gangster'], 0.25); S('coins', W['capone'] + 0.1, 0.35); A('swish_1', W['capone'], 0.2)
# the money box, the police, CAUGHT
k = T['money'] + 0.1
while k < W['caught1'] - 0.2: S('flutter', k, 0.08); k += 0.25
S('coins', T['money'] + 0.2, 0.2); S('police_whistle', W['caught1'] - 0.35, 0.22); S('thud', W['caught1'] - 0.1, 0.4); A('impact_1', W['caught1'] - 0.1, 0.25)
# the rope at night, CAUGHT AGAIN
S('crickets', T['rope'], 0.12, dur=T['cert'] - T['rope']); S('whoosh', W['rope'] - 0.2, 0.2); S('squeak', W['rope'], 0.12); S('squeak', W['rope'] + 0.6, 0.12)
S('police_whistle', W['caught2'] - 0.5, 0.22); S('thud', W['caught2'] - 0.2, 0.4); A('impact_2', W['caught2'] - 0.2, 0.25)
# the certificate
S('typewriter', W['apprentice'] - 0.1, 0.25, dur=W['salesman'] + 0.4 - W['apprentice']); S('thud', W['counterfeiter'] - 0.2, 0.4); A('drum_hit', W['counterfeiter'] - 0.2, 0.3)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
