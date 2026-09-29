"""Mix narration/music/SFX, write captions + HUD (ASS), then with --encode assemble the GarageFarm PNGs.
No 3D rendering happens here. Run with Blender's bundled Python (needs numpy)."""
from pathlib import Path
import json, math, random, re, shutil, subprocess, sys, wave
import numpy as np

P = Path(__file__).resolve().parents[1]; STUDIO = P.parents[1]
sys.path.insert(0, str(STUDIO / 'scripts'))
from settings import tools, executable
FF = executable(tools(), 'ffmpeg')
sys.path.insert(0, str(P / 'source'))
from afk_timeline import SECONDS, END, FPS

A = P / 'audio'; D = P / 'delivery'; D.mkdir(exist_ok=True)
LIB = STUDIO / 'assets'
fonts = P / 'assets/fonts'; fonts.mkdir(parents=True, exist_ok=True)
shutil.copy2(LIB / 'fonts/LuckiestGuy-Regular.ttf', fonts / 'LuckiestGuy-Regular.ttf')
shutil.copy2(LIB / 'fonts/LuckiestGuy-LICENSE.txt', fonts / 'LuckiestGuy-LICENSE.txt')
NAME = 'The_AFK_Champion'
SR = 48000; N = math.ceil(SECONDS * SR)


def load(path):
    raw = subprocess.run([str(FF), '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


sfx = np.zeros(N, dtype=np.float32); rng = np.random.default_rng(5)


def place(buf, t, gain):
    i = int(t * SR); j = min(N, i + len(buf))
    if i < N:
        sfx[i:j] += buf[:j - i] * gain


def tone(hz, dur, sweep=0.0, square=False):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * (hz * t + .5 * sweep * t * t)
    w = np.sign(np.sin(ph)) * .6 if square else np.sin(ph) + .2 * np.sin(2 * ph)
    return (w * (1 - np.exp(-t * 300)) * np.exp(-t * 5 / dur)).astype(np.float32)


def rumble(dur):
    n = rng.standard_normal(int(dur * SR)).astype(np.float32)
    out = np.zeros_like(n); a = .02; acc = 0.0
    for k in range(len(n)):            # one-pole low-pass: soft wind/water bed
        acc += a * (n[k] - acc); out[k] = acc
    env = np.sin(np.linspace(0, np.pi, len(out)))
    return out * env * 4


lib = {k: load(LIB / f'audio/{k}.wav') for k in ('impact_1', 'impact_2', 'impact_3', 'impact_4', 'swish_1', 'swish_2', 'swish_3', 'click', 'drum_hit')}
ping = lambda: np.concatenate([tone(988, .12), tone(1319, .22)])
for t in (5.72, 15.1, 26.0, 32.8, 39.88):
    place(ping(), t, .22)
place(rumble(5.5), 0.0, .35); place(rumble(1.6), 62.9, .3)
place(lib['swish_1'], 6.4, .35)
for i, t in enumerate((16.3, 17.0, 18.0, 19.6, 20.9, 21.4, 21.9, 22.3, 23.2)):
    place(lib['swish_%d' % (i % 3 + 1)], t - .55, .18); place(lib['impact_%d' % (i % 4 + 1)], t, .35)
place(lib['drum_hit'], 24.3, .6); place(lib['impact_1'], 24.3, .5)
place(rumble(6.5), 26.2, .45); place(lib['swish_2'], 30.2, .4); place(lib['swish_3'], 31.1, .4)
place(lib['impact_3'], 39.2, .25)
for i in range(20):
    place(tone([1046, 1318, 1568, 1760][i % 4], .14), 40.3 + i * .15 + .5, .06)
place(tone(440, .18, square=True), 44.0, .08); place(tone(440, .18, square=True), 44.3, .08)
place(lib['click'], 46.2, .5)
for t in (49.0, 49.8, 50.6):
    place(tone(1250, .09, square=True), t, .07)
place(np.concatenate([tone(784, .09), tone(988, .09), tone(1319, .2)]), 52.0, .14)
place(tone(1800, .45, sweep=-3000), 53.5, .12); place(tone(1600, .35, sweep=-3000), 54.3, .12)
place(lib['swish_1'], 54.85, .3)
place(np.concatenate([tone(523, .12), tone(659, .12), tone(784, .12), tone(1046, .4)]), 56.2, .16)
place(lib['click'], 61.75, .6)

with wave.open(str(A / 'sfx.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(sfx, -.98, .98) * 32767).astype('<i2').tobytes())
shutil.copy2(LIB / 'audio/playful_history_music.wav', A / 'music.wav')
subprocess.run([str(FF), '-y', '-v', 'error', '-i', str(A / 'narration.wav'), '-stream_loop', '-1', '-i', str(A / 'music.wav'),
                '-i', str(A / 'sfx.wav'), '-filter_complex',
                f'[0:a]apad,atrim=0:{SECONDS},volume=1.5[v];[1:a]atrim=0:{SECONDS},volume=0.07,afade=t=out:st={SECONDS - 1.2}:d=1.2[m];'
                f'[2:a]volume=0.8[s];[v][m][s]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=9[a]',
                '-map', '[a]', '-ar', '48000', str(A / 'final_mix.wav')], check=True)


def ts(t):
    c = round(t * 100); return f'{c // 360000}:{c // 6000 % 60:02}:{c // 100 % 60:02}.{c % 100:02}'


ass = [
    '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', 'WrapStyle: 2', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    # Captions sit above TikTok's bottom UI; HUD top-left below the For You tabs; titles upper-middle.
    'Style: Words,Luckiest Guy,76,&H00FFFFFF,&H003DDAFF,&H00152435,&H80000000,0,0,0,0,100,100,1,0,1,6,2,2,90,150,640,1',
    'Style: HUD,Luckiest Guy,50,&H00FFFFFF,&H00FFFFFF,&H70152435,&H70152435,0,0,0,0,100,100,1,0,3,14,0,7,70,0,250,1',
    'Style: Out,Luckiest Guy,60,&H003F4BFF,&H003F4BFF,&H00FFFFFF,&H00000000,0,0,0,0,100,100,1,0,1,5,0,7,70,0,345,1',
    'Style: Title,Luckiest Guy,104,&H0036D4FF,&H0036D4FF,&H00152435,&H80000000,0,0,0,0,100,100,2,0,1,9,4,8,60,60,470,1',
    '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
]
ev = lambda layer, a, b, style, text: ass.append(f'Dialogue: {layer},{ts(a)},{ts(b)},{style},,0,0,0,,{text}')
HUD = [(0, 15.1, 1, 3), (15.1, 26.0, 2, 3), (26.0, 32.3, 3, 3), (32.3, 32.8, 3, 2), (32.8, 39.4, 4, 2), (39.4, 39.9, 4, 1),
       (39.9, 56.2, 5, 1), (62.9, SECONDS, 1, 3)]
for a, b, rnd, alive in HUD:
    ev(2, a, b, 'HUD', f'ROUND {rnd}/5   ALIVE {alive}')
for a, name in ((32.3, 'MAX'), (39.4, 'MIA')):
    ev(2, a, a + 1.8, 'Out', r'{\fad(80,200)}' + f'{name} ELIMINATED')
pop = r'{\fscx170\fscy170\t(0,140,\fscx100\fscy100)\fad(0,220)}'
for a, b, text in ((5.72, 7.5, 'ROUND 1\\NFLOOD'), (15.1, 16.9, 'ROUND 2\\NMETEOR SHOWER'), (26.0, 27.8, 'ROUND 3\\NTORNADO'),
                   (32.8, 34.7, 'ROUND 4\\NTHE FLOOR IS LAVA'), (39.88, 41.8, 'ROUND 5\\N???')):
    ev(3, a, b, 'Title', pop + text)
caps = json.loads((A / 'alignment/captions.json').read_text())
FIX = {'BY': 'BYE'}
for cap in caps:
    words = cap['words']
    for i, w in enumerate(words):
        a = w['start']; b = words[i + 1]['start'] if i + 1 < len(words) else cap['end']
        if b <= a:
            continue
        line = ' '.join((r'{\c&H003DDAFF&}' if k == i else r'{\c&H00FFFFFF&}') + FIX.get(x['word'].strip().upper().strip(',.?'), x['word'].strip().upper())
                        for k, x in enumerate(words))
        ev(1, a, b, 'Words', line)
(D / f'{NAME}.ass').write_text('\n'.join(ass) + '\n', encoding='utf-8')
srt = (A / 'alignment/captions.srt').read_text(encoding='utf-8').replace(' by Leo', ' bye Leo')
(D / f'{NAME}.srt').write_text(srt, encoding='utf-8')
print('Final mix, captions and HUD ready.')

if '--encode' in sys.argv:
    frames = list((P / 'renders/farm').glob('*.png'))
    num = lambda p: int(re.search(r'(\d+)$', p.stem).group(1))
    frames.sort(key=num)
    if [num(p) for p in frames] != list(range(1, END + 1)):
        raise RuntimeError(f'Need exactly frames 1..{END} without gaps or duplicates; found {len(frames)} files.')
    seq = P / 'renders/encode'; shutil.rmtree(seq, ignore_errors=True); seq.mkdir()
    for i, f in enumerate(frames, 1):
        shutil.copy2(f, seq / f'{i:04}.png')
    subprocess.run([str(FF), '-y', '-framerate', str(FPS), '-start_number', '1', '-i', 'renders/encode/%04d.png', '-i', 'audio/final_mix.wav',
                    '-vf', f'ass=delivery/{NAME}.ass:fontsdir=assets/fonts', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', str(SECONDS),
                    f'delivery/{NAME}.mp4'], cwd=P, check=True)
    subprocess.run([str(FF), '-v', 'error', '-i', f'delivery/{NAME}.mp4', '-f', 'null', '-'], cwd=P, check=True)
    print('Encoded delivery/' + NAME + '.mp4')
