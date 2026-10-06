"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py and source/make_sfx.py).
Key times mirror T in web/marathon_clip.js. The car puttering and honking past the runners in the hook; the crowd at
the finish; heat and dust; a splash at the one well; the horn and the engine at mile nine; footsteps for the mailman,
chatter pops, an apple crunch, a sour sting and snores; barks for the dog; the hiss and a clank when the car dies; the
tape snapping, a fanfare and applause at the line; a record-scratch drop when officials hear about the car, the BANNED
thud; a last fanfare for fourth. SFX are listed in source/make_sfx.py (audio/sfx/)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(medal=W['and1'] - 0.1, heat=W['st'] - 0.1, dust=W['cars'] - 0.1, water=W['theres'] - 0.1, quit=W['at1'] - 0.1, mail=W['behind'] - 0.1,
         chat=W['stops'] - 0.1, apple=W['eats'] - 0.1, nap=W['rotten'] - 0.1, dog=W['another'] - 0.1, brk=W['then'] - 0.1, jog=W['so2'] - 0.1,
         cross=W['crosses'] - 0.1, caught=W['about'] - 0.1, banned=W['banned'] - 0.1, fourth=W['and3'] - 0.1, cta=W['follow'] - 0.15, end=W['end'] + 2.0)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})
def bed(name, t0, t1, g, length):                         # a loop laid end to end (each piece cut to fit)
    t = t0
    while t < t1 - 0.05: S(name, t, g, dur=min(length, t1 - t + 0.15)); t += length - 0.15

# ---- hook: the car putters past the runners, honking
bed('engine', 0.0, T['medal'], 0.32, 2.2); bed('steps', 0.0, T['medal'], 0.12, 1.0)
A('drum_hit', 0.0, 0.3); S('horn', 0.35, 0.4); S('horn', 2.6, 0.32); S('whoosh', 1.2, 0.2)
A('impact_2', W['eleven'] - 0.08, 0.25); S('pop', W['eleven'] - 0.05, 0.2)
# ---- nearly got the gold
S('applause', T['medal'], 0.18, dur=T['heat'] - T['medal']); S('chime', W['gold'] - 0.1, 0.35); TN([784, 988, 1175], W['gold'] - 0.05, 0.04, 0.16)
# ---- St. Louis: the heat, then they set off
A('swish_1', T['heat'], 0.25); S('pop', W['over'] - 0.1, 0.2)
k = W['over']
while k < W['degrees'] + 0.2: TN([600 + 900 * (k - W['over']) / max(0.1, W['degrees'] + 0.2 - W['over'])], k, 0.03, 0.05); k += 0.08
A('impact_1', W['ninety'] - 0.08, 0.3); bed('steps', W['degrees'], T['dust'], 0.12, 1.0)
# ---- dust
bed('engine', T['dust'], T['water'], 0.28, 2.2); S('whoosh', T['dust'] + 0.1, 0.3); A('impact_3', W['dust'] - 0.08, 0.3); bed('steps', T['dust'], T['water'], 0.1, 1.0)
# ---- the one water stop
bed('steps', T['water'], T['water'] + 1.8, 0.12, 1.0); S('splash', T['water'] + 2.0, 0.3); S('pop', W['one1'] - 0.1, 0.25); A('drum_hit', W['whole'] - 0.1, 0.25)
# ---- mile nine: quits, the car pulls up, in he climbs, off they go
A('swish_2', T['quit'], 0.25); S('thud', W['quits'] - 0.1, 0.4)
bed('engine', T['quit'], T['mail'], 0.28, 2.2); S('horn', W['climbs'] - 0.4, 0.35); S('whoosh', W['climbs'] + 0.05, 0.22)
S('pop', W['car2'] - 0.1, 0.25); S('horn', W['car2'] + 0.2, 0.3)
# ---- the mailman
bed('steps', T['mail'], T['chat'], 0.12, 1.0); S('pop', W['cuban'] - 0.1, 0.25); S('pop', W['cut'] - 0.1, 0.2)
# ---- chatting
S('pop', W['chat'] - 0.1, 0.3); TN([660, 880], W['chat'] + 0.3, 0.035, 0.1); TN([740, 990], W['crowd1'] + 0.1, 0.035, 0.1)
# ---- apples, rotten, the nap
S('pop', W['apples'] - 0.1, 0.25); S('crunch', W['apples'] + 0.3, 0.4); S('crunch', W['orchard'] + 0.1, 0.3)
A('impact_1', T['nap'] + 0.05, 0.3); TN([311, 233], T['nap'] + 0.08, 0.06, 0.25)
S('thud', W['lies'] + 0.15, 0.3); S('snore', W['nap'], 0.3); S('snore', W['nap'] + 2.1, 0.25, dur=max(0.3, T['dog'] - W['nap'] - 2.1))
# ---- the dog
bed('steps', T['dog'], T['brk'], 0.12, 1.0); S('bark', W['chased'] - 0.75, 0.4); S('bark', W['chased'] + 0.4, 0.35); S('bark', W['course'], 0.3)
A('impact_2', W['chased'] - 0.1, 0.3); S('whoosh', W['mile2'] - 0.1, 0.2)
# ---- breakdown and the jog in
bed('engine', T['brk'] - 0.1, W['breaks'] + 0.3, 0.28, 2.2); S('clang', W['breaks'] + 0.25, 0.3); S('hiss', W['breaks'] + 0.3, 0.35)
A('impact_3', W['breaks'] - 0.08, 0.3); S('hiss', T['jog'] + 0.2, 0.15)
S('whoosh', T['jog'] + 0.05, 0.22); S('thud', T['jog'] + 0.45, 0.3); bed('steps', T['jog'] + 0.7, T['cross'], 0.13, 1.0); S('pop', W['jogs'] - 0.1, 0.25)
# ---- across the line, the crowd roars
bed('steps', T['cross'], W['first2'] + 0.4, 0.13, 1.0); S('flutter', W['first2'] - 0.05, 0.3); S('fanfare', W['first2'] - 0.05, 0.35)
S('applause', W['crowd2'], 0.35, dur=T['caught'] - W['crowd2'] + 0.4)
# ---- officials hear about the car
TN([523, 494, 466, 440], W['until'] - 0.05, 0.05, 0.12); S('pop', W['officials'] - 0.1, 0.3); A('impact_1', W['car4'] - 0.05, 0.3)
# ---- banned
S('thud', T['banned'] + 0.02, 0.55); A('impact_4', T['banned'] + 0.04, 0.35); A('drum_hit', T['banned'] + 0.05, 0.3)
# ---- fourth
bed('steps', T['fourth'], T['fourth'] + 2.0, 0.1, 1.0); S('snore', T['fourth'] + 0.1, 0.15, dur=1.0)
S('pop', W['napped'] - 0.1, 0.25); S('thud', W['fourth'] - 0.15, 0.4); S('fanfare', W['fourth'] - 0.1, 0.35); S('applause', W['fourth'], 0.25, dur=2.5)
TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues, ends', round(max(x['start'] for x in c), 2), 's')
