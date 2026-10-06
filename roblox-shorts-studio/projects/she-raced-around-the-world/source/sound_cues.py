"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py).
Key times mirror T in web/race_clip.js. A pop on the opening 80 DAYS?, a bell and a desk thud in the editor's office,
a ship's horn and waves for the sailing, pops for 1 DRESS / 1 COAT / 1 BAG, a door knock and a chime at the author's
house, map pings as the route reaches each stop, a telegraph for the news in Hong Kong, the rival's train whistle, a
typewriter on the front page, rain and thunder in the storm, a buzz on -2 DAYS, the special train (whistle and engine),
crowd and applause at the finish with a rising ding per number, a fanfare on ALMOST 8 DAYS FASTER, a thud on +4.5 DAYS.
SFX in audio/sfx/ are copied from He Flew A Lawn Chair (pop, chime, whoosh, clang, typewriter, buzz, applause, wind,
thud, fanfare), He Flew The Wrong Way (telegraph, waves, thunder, horn, crowd, engine, desk_bell), He Sold The Eiffel
Tower (train_whistle) and The Backwards Umbrella (rain)."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
T = dict(editor=W['editor'] - 0.1, reply=W['start'] - 0.15, sail=W['two1'] - 0.1, verne=W['france'] - 0.1, route=W['suez'] - 0.15,
         hong=W['hong'] - 0.1, rival=W['magazine'] - 0.1, race=W['papers'] - 0.1, storm=W['storms'] - 0.1, train=W['newspaper'] - 0.1,
         finish=W['seventytwo'] - 0.1, book=W['beat2'] - 0.1, rival2=W['rival2'] - 0.1, cta=W['follow'] - 0.15)
c = []
A = lambda a, t, g=0.3, **k: c.append({'asset': a, 'start': round(max(0, t), 3), 'gain': g, **k})
S = lambda n, t, g=0.3, **k: A(f'sfx/{n}.wav', t, g, **k)
TN = lambda f, t, g=0.08, d=0.1, **k: c.append({'tone': f, 'start': round(max(0, t), 3), 'gain': g, 'dur': d, **k})

S('pop', 0.05, 0.35); S('waves', 0.2, 0.12, dur=T['editor'] - 0.3)                # 80 DAYS? at the pier
S('whoosh', W['faster'] - 0.2, 0.35); A('impact_3', W['faster'] - 0.05, 0.3)       # SHE SAYS: FASTER
S('desk_bell', T['editor'] + 0.05, 0.2); S('buzz', W['job'] - 0.25, 0.3)          # A JOB FOR A MAN!
S('thud', W['start'] - 0.1, 0.4); S('pop', W['beat1'] - 0.35, 0.3)                # her hand on the desk; I'LL BEAT HIM.
S('horn', T['sail'], 0.3); S('waves', T['sail'] + 0.3, 0.16, dur=T['verne'] - T['sail'] - 0.3)
for k in ('dress', 'coat', 'bag'): S('pop', W[k] - 0.08, 0.35)                     # 1 DRESS / 1 COAT / 1 BAG
S('chime', W['wrote'] - 0.3, 0.3)                                                 # THE AUTHOR!
S('whoosh', T['route'] + 0.05, 0.3); S('waves', T['route'] + 0.2, 0.12, dur=T['hong'] - T['route'])
for k, f in (('suez', [880, 1175]), ('ceylon', [988, 1319]), ('singapore', [1175, 1568])): TN(f, W[k] - 0.05, 0.05, 0.13)   # map stops
S('telegraph', W['news'] - 0.3, 0.3)                                              # the telegram
S('train_whistle', T['rival'] + 0.1, 0.25); S('engine', T['rival'] + 0.2, 0.15, dur=T['race'] - T['rival'] - 0.2)
S('pop', W['rival1'] - 0.2, 0.3); S('whoosh', W['other'] - 0.25, 0.3); S('clang', W['same'] - 0.15, 0.3)   # THE RIVAL / THE OTHER WAY / SAME DAY!
S('whoosh', W['papers'] - 0.15, 0.35); S('typewriter', W['papers'] + 0.3, 0.25)    # THE GREAT RACE front page
S('rain', T['storm'], 0.25, dur=T['train'] - T['storm']); S('thunder', T['storm'] + 0.3, 0.35)
S('buzz', W['two2'] - 0.3, 0.35); A('impact_2', W['two2'] - 0.2, 0.3)              # -2 DAYS
S('train_whistle', T['train'] + 0.05, 0.35); S('engine', T['train'] + 0.2, 0.22, dur=T['finish'] - T['train'] - 0.2)
S('whoosh', W['special'] - 0.25, 0.3)                                             # SPECIAL TRAIN!
S('crowd', T['finish'], 0.18, dur=T['book'] - T['finish'])
for k, f in (('seventytwo', [880, 1175]), ('six', [988, 1319]), ('eleven', [1175, 1568])): TN(f, W[k] - 0.1, 0.06, 0.14)
S('applause', W['minutes'], 0.25)
S('fanfare', W['eight'] - 0.2, 0.3); S('clang', W['eight'] - 0.05, 0.2)            # ALMOST 8 DAYS FASTER, the 80 crossed out
S('crowd', T['rival2'], 0.1, dur=2.0); S('thud', W['four'] - 0.2, 0.35); A('impact_3', W['four'] - 0.15, 0.25)   # +4.5 DAYS
S('waves', T['cta'], 0.12, dur=W['end'] + 2.0 - T['cta']); TN([988, 1319], T['cta'] + 0.1, 0.05, 0.12)
(P / 'source/sound_cues.json').write_text(json.dumps(sorted(c, key=lambda x: x['start']), indent=1))
print(len(c), 'cues')
