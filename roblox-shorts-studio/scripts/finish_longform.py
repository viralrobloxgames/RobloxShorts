"""Finish one long-form chapter, or one frame-range segment of it: speaker-coloured captions burned in, one fixed encode.

python scripts/finish_longform.py <project> --chapter 3 --frames <png dir>                    -> delivery/chapters/ch03.mp4
python scripts/finish_longform.py <project> --chapter 3 --frames <png dir> --range 1-1050      -> delivery/chapters/ch03_a.mp4
python scripts/finish_longform.py <project> --chapter 3 --frames <png dir> --range 1051-2040   -> delivery/chapters/ch03_b.mp4
python scripts/finish_longform.py <project> --chapter 3 --ass-only                              -> delivery/chapters/ch03.ass (look at it)

Video only: the soundtrack (narration, SFX, music, loudness) is built once for the whole film by stitch_longform.py.
Frames are render.mjs output (web_0001.png ... numbered from the chapter's frame 1; --range picks frames A..B of them).
The chapter's total frame count is taken from <frames>/frame_hashes.json (written by render.mjs) when present, or --total.

Captions: audio/chapters/chNN/captions.json (words with start, end, speaker, line), grouped by line into chunks that fit
the frame, upper case, in the speaker's colour (VO/SKYE pink, MAX teal, DAD amber, LILY yellow; VO italic), bottom
centre in the lower third. Optional web/chNN_captions.json {"top": [[t0, t1], ...]} moves captions that start inside those
times to the top of the frame for shots where a face sits low.

Every chapter and segment uses ENCODE (below) unchanged, so stitch_longform.py can join them by stream copy. A
<name>.json sidecar records the range, frame count, settings and checksum.
"""
from pathlib import Path
import argparse, hashlib, json, re, subprocess, sys

S = Path(__file__).resolve().parent; ROOT = S.parent
FPS, W, H = 30, 1920, 1080
# The one encode setting for every chapter and segment (never change it per chapter: the stitch stream-copies).
ENCODE = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-level:v', '4.2', '-pix_fmt', 'yuv420p',
          '-r', str(FPS), '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-bf', '2', '-flags', '+cgop',
          '-x264-params', 'open-gop=0:force-cfr=1', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-color_range', 'tv', '-video_track_timescale', '15360', '-movflags', '+faststart', '-an']
ENCODE_ID = 'x264-medium-crf18-high42-yuv420p-g60cgop-bf2-bt709-tb15360-v1'

# Speaker colours (ASS &HBBGGRR) and italics.
SPEAKERS = {
    'VO': ('&H00B56FFF', 1), 'SKYE': ('&H00B56FFF', 0),   # pink  #FF6FB5
    'MAX': ('&H00D6E62E', 0),                              # teal  #2EE6D6
    'DAD': ('&H0020B0FF', 0),                              # amber #FFB020
    'LILY': ('&H004DE1FF', 0),                             # yellow #FFE14D
}
FONT, SIZE, MARGIN_V, MAX_W = 'Luckiest Guy', 72, 60, 1500     # MAX_W: widest caption in px (frame 1920, sides 210 each)
LIBASS_SCALE = 0.845                                             # burned-in width / PIL advance width (finish.py measure)


def ts(t):
    c = max(0, round(t * 100)); return f'{c // 360000}:{c // 6000 % 60:02}:{c // 100 % 60:02}.{c % 100:02}'


def width_fn():
    try:
        from PIL import ImageFont
        font = ImageFont.truetype(str(next((ROOT / 'assets/fonts').glob('LuckiestGuy*.ttf'))), SIZE)
        return lambda s: font.getlength(s) * LIBASS_SCALE
    except Exception:
        return lambda s: len(s) * SIZE * 0.55


def chunks_of(words, width):
    """Split one line's words into consecutive chunks that each fit MAX_W (and at most 7 words), as evenly as possible."""
    text = lambda ws: ' '.join(w['word'].strip().upper() for w in ws)
    if len(words) < 2 or (width(text(words)) <= MAX_W and len(words) <= 7):
        return [words]
    cut = min(range(1, len(words)), key=lambda k: max(width(text(words[:k])), width(text(words[k:]))))
    return chunks_of(words[:cut], width) + chunks_of(words[cut:], width)


def caption_events(P, ch):
    """[(start, end, speaker, text, top)] for the whole chapter, in chapter time."""
    cj = P / f'audio/chapters/ch{ch:02d}/captions.json'
    if not cj.exists():
        print(f'WARNING: {cj.relative_to(P)} missing: no captions'); return []
    data = json.loads(cj.read_text(encoding='utf-8'))
    words = data['words'] if isinstance(data, dict) else data
    zones = P / f'web/ch{ch:02d}_captions.json'
    top = json.loads(zones.read_text(encoding='utf-8')).get('top', []) if zones.exists() else []
    width = width_fn(); lines = []
    for w in words:                                     # group by spoken line (fallback: speaker change)
        key = (w.get('line'), w.get('speaker'))
        if lines and lines[-1][0] == key: lines[-1][1].append(w)
        else: lines.append((key, [w]))
    chunks = []
    for (_, sp), ws in lines:
        for c in chunks_of([w for w in ws if w['word'].strip()], width):
            if c: chunks.append((sp or 'VO', c))
    ev = []
    for i, (sp, c) in enumerate(chunks):
        s, e = c[0]['start'], c[-1]['end'] + 0.35        # held 0.35 s after the last word, or until the next chunk
        nxt = chunks[i + 1][1][0]['start'] if i + 1 < len(chunks) else None
        if nxt is not None:
            e = nxt if nxt - c[-1]['end'] <= 0.35 else min(e, nxt)
        if nxt is None or nxt >= s + 0.5: e = max(e, s + 0.5)
        text = ' '.join(w['word'].strip().upper() for w in c).replace('{', '(').replace('}', ')')
        ev.append((s, e, sp.upper(), text, any(a <= s < b for a, b in top)))
    return ev


def write_ass(path, events, t0, t1):
    head = ['[Script Info]', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}', 'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '',
            '[V4+ Styles]', 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, '
            'StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding']
    for sp, (col, it) in SPEAKERS.items():
        head.append(f'Style: {sp},{FONT},{SIZE},{col},{col},&H00152435,&H90000000,0,{it},0,0,100,100,1,0,1,6,2,2,180,180,{MARGIN_V},1')
    head += ['', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
    n = 0
    for s, e, sp, text, top in events:
        s2, e2 = max(s, t0) - t0, min(e, t1) - t0          # shift into the segment and clip to it
        if e2 <= s2: continue
        style = sp if sp in SPEAKERS else 'VO'
        tag = r'{\an8}' if top else ''
        head.append(f'Dialogue: 1,{ts(s2)},{ts(e2)},{style},,0,0,{60 if top else 0},,{tag}{text}'); n += 1
    path.write_text('\n'.join(head) + '\n', encoding='utf-8')
    return n


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('project'); p.add_argument('--chapter', type=int, required=True); p.add_argument('--frames')
    p.add_argument('--range', help='A-B: chapter frames A..B (1-based, inclusive)'); p.add_argument('--part', help='a/b/... (default: from --range)')
    p.add_argument('--total', type=int, help="the chapter's total frames (default: <frames>/frame_hashes.json)")
    p.add_argument('--ass-only', action='store_true'); p.add_argument('--no-captions', action='store_true', help='tests only')
    p.add_argument('--out', help='output MP4 (default delivery/chapters/chNN[_part].mp4)')
    a = p.parse_args(); P = Path(a.project).resolve(); ch = a.chapter
    D = P / 'delivery/chapters'; D.mkdir(parents=True, exist_ok=True)
    events = [] if a.no_captions else caption_events(P, ch)
    if a.ass_only:
        n = write_ass(D / f'ch{ch:02d}.ass', events, 0, 1e9); print(f'{n} caption events -> {D / f"ch{ch:02d}.ass"}'); return
    if not a.frames: raise SystemExit('--frames <png dir> is needed (render.mjs output, web_0001.png ...)')
    F = Path(a.frames).resolve()
    have = sorted(int(m.group(1)) for f in F.glob('web_*.png') if (m := re.fullmatch(r'web_(\d+)\.png', f.name)))
    hj = F / 'frame_hashes.json'
    hjd = json.loads(hj.read_text()) if hj.exists() else {}
    total = a.total or hjd.get('total')
    A, B = (map(int, a.range.split('-'))) if a.range else (1, total or (have[-1] if have else 0))
    missing = [f for f in range(A, B + 1) if f not in set(have)]
    if missing or B < A: raise SystemExit(f'frames {A}..{B} needed in {F}; missing {len(missing)} (first: {missing[:5]})')
    if total and B > total: raise SystemExit(f'range ends at {B} but the chapter has {total} frames')
    part = a.part or ('' if (A == 1 and (not a.range or B == total)) else ('a' if A == 1 else 'b'))
    name = f'ch{ch:02d}' + (f'_{part}' if part else '')
    out = Path(a.out).resolve() if a.out else D / f'{name}.mp4'
    t0, t1, n = (A - 1) / FPS, B / FPS, B - A + 1
    ass = out.with_suffix('.ass'); ne = write_ass(ass, events, t0, t1)
    esc = lambda x: Path(x).resolve().as_posix().replace(':', r'\:').replace("'", r"\'")
    vf = f"ass=filename='{esc(ass)}':fontsdir='{esc(ROOT / 'assets/fonts')}',scale={W}:{H}:out_color_matrix=bt709:out_range=tv,format=yuv420p"
    cmd = ['ffmpeg', '-y', '-v', 'error', '-framerate', str(FPS), '-start_number', str(A), '-i', str(F / 'web_%04d.png'),
           '-frames:v', str(n), '-vf', vf, *ENCODE, str(out)]
    subprocess.run(cmd, check=True)
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
                                                'stream=width,height,nb_read_frames,r_frame_rate,pix_fmt,profile,codec_name', '-of', 'json', str(out)], text=True))['streams'][0]
    if int(probe['nb_read_frames']) != n or (probe['width'], probe['height']) != (W, H) or probe['r_frame_rate'] != f'{FPS}/1':
        raise SystemExit(f'encode check failed: {probe} (wanted {n} frames {W}x{H} @ {FPS})')
    rep = {'chapter': ch, 'part': part or None, 'code': hjd.get('code'), 'first_frame': A, 'last_frame': B, 'frames': n, 'chapter_total': total,
           'start_s': round(t0, 4), 'seconds': round(n / FPS, 4), 'encode': ENCODE_ID, 'captions': ne, 'file': out.name,
           'sha256': hashlib.sha256(out.read_bytes()).hexdigest(), 'probe': probe}
    out.with_suffix('.json').write_text(json.dumps(rep, indent=1))
    print(f'{out.relative_to(P) if out.is_relative_to(P) else out}: frames {A}-{B} ({n}), {ne} captions, {out.stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
