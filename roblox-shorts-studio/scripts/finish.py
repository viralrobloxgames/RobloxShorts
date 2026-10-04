"""Finish a Roblox Short: SFX track, music bed, final mix, word-highlight captions, then (--encode) the MP4.

python finish.py <project>            mix audio + write delivery/<Title>.ass/.srt (no picture needed)
python finish.py <project> --encode   also assemble renders/farm PNGs into delivery/<Title>.mp4

No 3D rendering happens here. Needs numpy (Blender's bundled Python has it) and ffmpeg.

Project inputs
  source/project.json       title, seconds, fps, optional "finish" block (see references/captions.md)
  audio/narration.wav|mp3   final narration
  audio/alignment/captions.json   measured word timings (transcribe.py or voice.py)
  source/sound_cues.json    optional list of cues:
      {"asset": "impact_1", "start": 3.2, "gain": 0.35}           library WAV (assets/audio) or a file in audio/
      {"tone": [988, 1319], "dur": 0.15, "start": 5.7, "gain": 0.2, "square": false, "sweep": 0}
  source/overlays.json      optional extra ASS events: {"start","end","style","text","layer"}

Set "finish": {"narration": false} in project.json for a clip without voice (music + SFX only, no word captions).
"""
from pathlib import Path
import argparse, json, re, shutil, subprocess, sys, wave
import numpy as np
S = Path(__file__).resolve().parent; ROOT = S.parent
sys.path.insert(0, str(S))
from settings import tools, executable

SR = 48000
DEFAULTS = {
    'music': 'playful_history_music', 'voice_gain': 1.4, 'music_gain': 0.065, 'sfx_gain': 0.7, 'loudness': -16,
    'caption_font_size': 76, 'caption_margin_v': 640, 'caption_highlight': '&H003DDAFF', 'word_fixes': {},
}
STYLES = [
    'Style: Words,Luckiest Guy,{size},&H00FFFFFF,{hl},&H00152435,&H80000000,0,0,0,0,100,100,1,0,1,6,2,2,90,150,{mv},1',
    'Style: HUD,Luckiest Guy,50,&H00FFFFFF,&H00FFFFFF,&H70152435,&H70152435,0,0,0,0,100,100,1,0,3,14,0,7,70,0,250,1',
    'Style: Out,Luckiest Guy,60,&H003F4BFF,&H003F4BFF,&H00FFFFFF,&H00000000,0,0,0,0,100,100,1,0,1,5,0,7,70,0,345,1',
    'Style: Title,Luckiest Guy,104,&H0036D4FF,&H0036D4FF,&H00152435,&H80000000,0,0,0,0,100,100,2,0,1,9,4,8,60,60,470,1',
]


def ts(t):
    c = round(t * 100); return f'{c // 360000}:{c // 6000 % 60:02}:{c // 100 % 60:02}.{c % 100:02}'


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('project'); p.add_argument('--encode', action='store_true'); p.add_argument('--frames', help='PNG folder (default renders/farm)')
    a = p.parse_args(); P = Path(a.project).resolve(); cfg = tools(); FF = executable(cfg, 'ffmpeg')
    meta = json.loads((P / 'source/project.json').read_text(encoding='utf-8'))
    opt = dict(DEFAULTS, **meta.get('finish', {}))
    SECONDS = float(meta['seconds']); FPS = int(meta.get('fps', 30)); END = round(SECONDS * FPS)
    name = re.sub(r'[^A-Za-z0-9]+', '_', meta['title']).strip('_')
    A = P / 'audio'; D = P / 'delivery'; D.mkdir(exist_ok=True); N = int(np.ceil(SECONDS * SR))

    def load(path):
        raw = subprocess.run([FF, '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
        return np.frombuffer(raw, dtype=np.float32).copy()

    def tone(hz, dur, sweep=0.0, square=False):
        t = np.arange(int(dur * SR)) / SR; ph = 2 * np.pi * (hz * t + .5 * sweep * t * t)
        w = np.sign(np.sin(ph)) * .6 if square else np.sin(ph) + .2 * np.sin(2 * ph)
        return (w * (1 - np.exp(-t * 300)) * np.exp(-t * 5 / dur)).astype(np.float32)

    # --- SFX track from cues
    sfx = np.zeros(N, dtype=np.float32); cache = {}
    cues_file = P / 'source/sound_cues.json'
    for c in json.loads(cues_file.read_text(encoding='utf-8')) if cues_file.exists() else []:
        if 'asset' in c:
            src = A / c['asset'] if (A / c['asset']).is_file() else ROOT / 'assets/audio' / (c['asset'] + ('' if c['asset'].endswith('.wav') else '.wav'))
            if not src.is_file():
                raise SystemExit(f'Sound cue asset not found: {c["asset"]}')
            buf = cache.setdefault(src, load(src))
        else:
            hz = c['tone'] if isinstance(c['tone'], list) else [c['tone']]
            buf = np.concatenate([tone(h, c.get('dur', .15), c.get('sweep', 0), c.get('square', False)) for h in hz])
        i = int(c['start'] * SR); j = min(N, i + len(buf))
        if 0 <= i < N:
            sfx[i:j] += buf[:j - i] * c.get('gain', .3)
    with wave.open(str(A / 'sfx.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(sfx, -.98, .98) * 32767).astype('<i2').tobytes())

    # --- mix: narration + looping music bed + sfx, mastered for Shorts/TikTok
    voiced = opt.get('narration', True) is not False
    narr = next((A / f for f in ('narration.wav', 'narration.mp3') if (A / f).is_file()), None)
    if voiced and not narr:
        raise SystemExit('audio/narration.wav or audio/narration.mp3 is missing.')
    if not voiced:  # no voice: silent stand-in keeps one mixing graph
        narr = A / 'silence.wav'
        subprocess.run([FF, '-y', '-v', 'error', '-f', 'lavfi', '-i', f'anullsrc=r={SR}:cl=mono', '-t', str(SECONDS), str(narr)], check=True)
    music = ROOT / 'assets/audio' / (opt['music'] + '.wav') if not Path(opt['music']).is_file() else Path(opt['music'])
    fade = max(0.0, SECONDS - 1.2)
    subprocess.run([FF, '-y', '-v', 'error', '-i', str(narr), '-stream_loop', '-1', '-i', str(music), '-i', str(A / 'sfx.wav'), '-filter_complex',
                    f'[0:a]apad,atrim=0:{SECONDS},volume={opt["voice_gain"]}[v];[1:a]atrim=0:{SECONDS},volume={opt["music_gain"]},afade=t=out:st={fade}:d=1.2[m];'
                    f'[2:a]volume={opt["sfx_gain"]}[s];[v][m][s]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I={opt["loudness"]}:TP=-1.5:LRA=9[a]',
                    '-map', '[a]', '-ar', str(SR), str(A / 'final_mix.wav')], check=True)

    # --- captions: current word highlighted, uppercase, above the TikTok/Shorts bottom UI
    ass = ['[Script Info]', 'ScriptType: v4.00+', f'PlayResX: {meta.get("width", 1080)}', f'PlayResY: {meta.get("height", 1920)}', 'WrapStyle: 2', '',
           '[V4+ Styles]', 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, '
           'ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding']
    ass += [s.format(size=opt['caption_font_size'], hl=opt['caption_highlight'], mv=opt['caption_margin_v']) for s in STYLES]
    ass += ['', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    fixes = {k.upper(): v.upper() for k, v in opt['word_fixes'].items()}
    word = lambda x: fixes.get(x.strip().upper().strip(',.?!'), x.strip().upper())
    for cap in json.loads((A / 'alignment/captions.json').read_text(encoding='utf-8')) if voiced else []:
        ws = cap['words']
        for i, w in enumerate(ws):
            s, e = w['start'], ws[i + 1]['start'] if i + 1 < len(ws) else cap['end']
            if e > s:
                line = ' '.join((r'{\c' + opt['caption_highlight'] + '&}' if k == i else r'{\c&H00FFFFFF&}') + word(x['word']) for k, x in enumerate(ws))
                ass.append(f'Dialogue: 1,{ts(s)},{ts(min(e, SECONDS))},Words,,0,0,0,,{line}')
    ov = P / 'source/overlays.json'
    for o in json.loads(ov.read_text(encoding='utf-8')) if ov.exists() else []:
        ass.append(f'Dialogue: {o.get("layer", 2)},{ts(o["start"])},{ts(o["end"])},{o["style"]},,0,0,0,,{o["text"]}')
    (D / f'{name}.ass').write_text('\n'.join(ass) + '\n', encoding='utf-8')
    srt = (A / 'alignment/captions.srt').read_text(encoding='utf-8') if voiced else ''
    for k, v in opt['word_fixes'].items():
        srt = re.sub(rf'\b{re.escape(k)}\b', v, srt)
    (D / f'{name}.srt').write_text(srt, encoding='utf-8')
    print(f'Final mix and captions ready: audio/final_mix.wav, delivery/{name}.ass')
    if not a.encode:
        return

    # --- picture: farm PNGs (frame number at the end of each name) -> contiguous 0001.png.. -> verified MP4
    src = Path(a.frames).resolve() if a.frames else P / 'renders/farm'
    num = lambda f: int(re.search(r'(\d+)$', f.stem).group(1)) if re.search(r'(\d+)$', f.stem) else -1
    frames = sorted(src.glob('*.png'), key=num)
    if [num(f) for f in frames] != list(range(1, END + 1)):
        raise SystemExit(f'Need exactly frames 1..{END} in {src} without gaps or duplicates; found {len(frames)} files.')
    seq = P / 'renders/encode'; shutil.rmtree(seq, ignore_errors=True); seq.mkdir(parents=True)
    for i, f in enumerate(frames, 1):
        shutil.copy2(f, seq / f'{i:04}.png')
    subprocess.run([sys.executable, str(S / 'export.py'), '--frames', str(seq), '--out', str(D / f'{name}.mp4'), '--fps', str(FPS),
                    '--audio', str(A / 'final_mix.wav'), '--captions', str(D / f'{name}.ass')], check=True)
    if (D / 'post.json').exists():                                       # copy-ready post text next to the MP4
        subprocess.run([sys.executable, str(S / 'post_md.py'), str(P)], check=True)


if __name__ == '__main__':
    main()
