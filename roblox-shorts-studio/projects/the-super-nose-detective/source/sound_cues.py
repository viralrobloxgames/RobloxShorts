"""Writes source/sound_cues.json from web/beats.js (run after source/beats.py), so the SFX follow the narration.
The beat formulas mirror the B = {...} block in web/nose_clip.js; change both together.
Custom sounds (source/make_audio.py): audio/sniff.wav, achoo.wav, splash.wav."""
import json
from pathlib import Path
P = Path(__file__).resolve().parent.parent
W = json.loads((P / 'web/beats.js').read_text().split('=', 1)[1].rsplit(';', 1)[0])
c = []
A = lambda a, t, g=0.35: c.append({'asset': a, 'start': round(t, 3), 'gain': g})
T = lambda f, t, g=0.1, d=0.1, **k: c.append({'tone': f, 'start': round(t, 3), 'gain': g, 'dur': d, **k})
def sting(t, notes=(196, 247, 294), g=0.12): T(list(notes), t, g, 0.09, square=True); A('drum_hit', t, 0.45)
def denied(t): T([392, 311], t, 0.09, 0.14, square=True)
def ding(t): T([1319, 1760], t, 0.09, 0.08)
def love(t): T([1047, 1319, 1568, 2093], t, 0.07, 0.07)
def sniffs(t, n=3, every=0.35, g=0.5):
    for i in range(n): A('sniff.wav', t + i * every, g)
def engine(a, b, g=0.08):
    T(70, a, g, b - a, sweep=60, square=True); A('swish_4', a, 0.35)

B = dict(logo=W['this'] - 0.05, pass_=W['super'] - 0.15, caseIn=W['case1'] - 0.3, chief=W['chief1'] - 0.3, slam=W['tonight'] - 0.05,
         scene=W['scene'] - 0.3, stop1=W['case2'] - 0.55, r1=W['case2'], clue=W['only'] - 0.3, sniff=W['cheap'] - 0.3, trailOn=W['trail1'] - 0.3,
         drive=W['trail1'] + 0.35, party=W['party'] + 0.45, stop2=W['case3'] - 0.55, r2=W['case3'], throw=W['threw'] + 0.05, achoo=W['achoo'],
         splash=W['achoo'] + 0.75, trailBack=W['guy2'] + 0.15, driveBack=W['trail2'] - 0.3, office=W['back'] + 0.2, feet=W['one2'] - 0.3,
         talk=W['said'] - 0.3, slide=W['slid'] - 0.1, tempt3=W['tempting3'] - 0.4, bite=W['bite'] - 0.1, cuff=W['read'] - 0.45,
         click=W['rights'] - 0.05, arrest=W['you'] - 0.35, closed=W['closed'] - 0.35,
         twitch=W['twitched'] - 0.35, cta=W['follow'] - 0.1)

# Hook: sniffing the bag; the logo slams on "this".
sniffs(0.15, 3, 0.55, 0.45); sniffs(B['logo'] + 0.4, 1)
A('impact_4', B['logo'], 0.55); sting(B['logo'], (165, 196, 247), 0.14)
# Gamepass: purchase click + chime; the smells everywhere (soft shimmer).
A('click', B['pass_'] + 0.1, 0.35); T([784, 988, 1175, 1568], B['pass_'] + 0.45, 0.1, 0.08)
T(600, W['smell'] - 0.2, 0.05, 1.6, sweep=500); sniffs(W['smell'] - 0.1, 2, 0.4, 0.4)
# The empty case: alarm; a hit on "stole".
for i in range(10): T([880, 660][i % 2], B['caseIn'] + 0.1 + i * 0.22, 0.035, 0.18, square=True)
A('impact_2', W['stole'], 0.5)
# Chief: the desk slam.
A('impact_3', B['slam'], 0.6); A('drum_hit', B['slam'], 0.5)
# Skye: a love chime on "single"; "Tempting." then the stop and the counter.
love(W['girl'] - 0.1); love(W['single'] + 0.1)
T(330, W['tempting1'], 0.05, 0.5, sweep=-60); denied(B['stop1']); ding(B['r1'])
# The clue and the sniff.
sting(B['clue'], (220, 262, 330), 0.1)
sniffs(B['sniff'] + 0.1, 4, 0.6, 0.55)
# The trail lights up; the drive; the pool party.
T(300, B['trailOn'], 0.08, 0.7, sweep=1400); A('swish_3', B['trailOn'], 0.35)
engine(B['drive'] - 0.1, B['party'] + 0.1); T(1800, B['party'] - 0.05, 0.05, 0.45, sweep=-900)            # tyre squeal
A('splash.wav', W['party'], 0.15)
# Mia: love; tempting; stop; counter.
love(W['liked'] - 0.15); T(330, W['tempting2'], 0.05, 0.5, sweep=-60); denied(B['stop2']); ding(B['r2'])
# The suspect: dun... dun.
sting(W['guy1'], (147, 156, 165), 0.14); sting(W['sunglasses'], (110, 117, 123), 0.14)
# The fight: the pepper, the swell, ACHOO, the flight, the splash.
A('swish_2', B['throw'], 0.5); A('impact_1', B['throw'] + 0.45, 0.25)
T(180, B['throw'] + 0.4, 0.06, B['achoo'] - B['throw'] - 0.45, sweep=500)
A('achoo.wav', B['achoo'] - 0.47, 0.9); A('impact_4', B['achoo'], 0.6); A('drum_hit', B['achoo'], 0.5)
T(1400, B['achoo'] + 0.05, 0.07, 0.7, sweep=-900); A('splash.wav', B['splash'], 0.8); A('impact_1', B['splash'], 0.3)
# Both socks: two dings as the camera finds them; "not my guy"; the trail turns back.
ding(W['socks'] - 0.2); ding(W['socks']); T([262, 196], W['guy2'], 0.08, 0.2, square=True)
T(300, B['trailBack'], 0.07, 0.6, sweep=1200); sniffs(B['trailBack'] - 0.3, 2, 0.3, 0.4)
engine(B['driveBack'], B['office'] - 0.05); T(1800, B['office'] - 0.25, 0.05, 0.35, sweep=-900)
# The office: Leo caught; three evidence hits; the slide; tempting; the bite; the cuffs; the arrest; CASE CLOSED; the twitch; CTA.
sting(B['office'] + 0.6, (196, 208, 220), 0.1)
for t in (B['feet'] + 0.2, W['sprinkles'], W['half']): A('impact_2', t, 0.4); T(1568, t, 0.05, 0.08)
A('swish_1', B['slide'], 0.4); A('click', B['slide'] + 0.6, 0.3)
T(110, B['tempt3'], 0.05, 2.0, sweep=20, square=True)
A('impact_1', B['bite'], 0.35); A('click', B['bite'] + 0.05, 0.3); A('click', B['bite'] + 0.15, 0.25)
for i in range(4): T([2093, 523][i % 2], B['bite'] + 0.1 + i * 0.08, 0.05, 0.06, square=True)         # counter glitch
# The cuffs snap on; outside, a short siren whoop as we cut to the police car.
A('click', B['click'], 0.6); T([2600, 1900], B['click'], 0.05, 0.05, square=True); A('impact_1', B['click'] + 0.02, 0.3)
for i in range(2): T(650, B['arrest'] + 0.05 + i * 0.9, 0.05, 0.45, sweep=900); T(1060, B['arrest'] + 0.5 + i * 0.9, 0.05, 0.4, sweep=-900)
A('impact_4', B['closed'], 0.6); A('drum_hit', B['closed'], 0.55); sting(B['closed'] + 0.05, (247, 294, 370), 0.12)
T(400, B['twitch'] + 0.1, 0.08, 0.4, sweep=900); sniffs(B['twitch'] + 0.4, 2, 0.3, 0.5); T(300, B['twitch'] + 0.9, 0.07, 0.6, sweep=1400)
A('swish_3', B['cta'] - 0.05, 0.35); T([1047, 1319, 1568], B['cta'], 0.12, 0.18)
c = [x for x in c if x['start'] >= 0]
c.sort(key=lambda x: x['start'])
(P / 'source/sound_cues.json').write_text(json.dumps(c, indent=1)); print(len(c), 'cues')
