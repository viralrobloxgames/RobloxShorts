"""Stitch the long-form video: every chapter segment in order, the whole soundtrack built once, one loudness pass.

python scripts/stitch_longform.py <project>                    all eleven chapters
python scripts/stitch_longform.py <project> --chapters 1-5     a block (e.g. pass one); output name gets _ch01-05
          [--music playful_history_music] [--music-gain 0.05] [--out NAME.mp4] [--no-split]

Video: delivery/chapters/chNN.mp4, or its segments chNN_a.mp4, chNN_b.mp4 ... (finish_longform.py, with their .json
sidecars). Segments must cover frames 1..total of their chapter without gaps or overlaps. If every segment carries the
same encode id, the video is joined by stream copy; otherwise it is re-encoded once with finish_longform.ENCODE.

Audio, built here once (chapters' MP4s are silent): each chapter's audio/chapters/chNN/narration.wav placed at the
chapter's first frame (cut or padded to the chapter's length), its SFX cues source/sound/chNN.json (finish.py cue format:
{"asset": "impact_1", "start": 3.2, "gain": 0.35, "dur"?} or {"tone": [988], "dur": 0.15, "start": 5.7, "gain": 0.2},
times in chapter seconds) at the same place, one music bed looped under the whole film at a low level (fade in 1 s, out
3 s), then one loudness pass to -14 LUFS integrated, -1 dBTP (two-pass loudnorm). AAC 48 kHz stereo.

Writes delivery/<Title>.mp4, delivery/youtube_chapters.txt (from the script's chapter headers and the measured chapter
starts) and delivery/stitch_report.json. Checks: the decoded film's per-frame checksums equal the segments' in order (no
gap, no duplicated or dropped frame at any seam), frame count = sum of chapters, audio length = video length (A/V sync).
Over 95 MB: also delivery/<Title>.mp4.part_aa, _ab, ... (split -b 95M) with the join command in delivery/README.md;
commit only the parts (delivery/.gitignore keeps the whole file out of git).
"""
from pathlib import Path
import argparse, hashlib, json, re, subprocess, sys, wave
import numpy as np

S = Path(__file__).resolve().parent; ROOT = S.parent
sys.path.insert(0, str(S))
from finish_longform import ENCODE, ENCODE_ID, FPS

SR = 48000; SPF = SR // FPS                     # 1600 samples per video frame
TITLE = 'I_Secretly_Lived_In_My_Enemys_House'


def run(cmd, **kw): return subprocess.run(cmd, check=True, **kw)


def load(path):
    raw = run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def tone(hz, dur, sweep=0.0, square=False):
    t = np.arange(int(dur * SR)) / SR; ph = 2 * np.pi * (hz * t + .5 * sweep * t * t)
    w = np.sign(np.sin(ph)) * .6 if square else np.sin(ph) + .2 * np.sin(2 * ph)
    return (w * (1 - np.exp(-t * 300)) * np.exp(-t * 5 / dur)).astype(np.float32)


def framemd5(path):
    out = run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-f', 'framemd5', '-'], capture_output=True, text=True).stdout
    return [l.split(',')[-1].strip() for l in out.splitlines() if l and not l.startswith('#')]


def segments(P, ch):
    D = P / 'delivery/chapters'
    whole = D / f'ch{ch:02d}.mp4'
    parts = sorted(D.glob(f'ch{ch:02d}_*.mp4'))
    if whole.exists() and parts: raise SystemExit(f'ch{ch:02d}: both {whole.name} and segments {[p.name for p in parts]} exist; remove the stale one')
    files = [whole] if whole.exists() else parts
    if not files: raise SystemExit(f'ch{ch:02d}: no MP4 in {D}')
    segs = []
    for f in files:
        j = f.with_suffix('.json')
        if not j.exists(): raise SystemExit(f'{f.name}: sidecar {j.name} missing (encode it with finish_longform.py)')
        segs.append(dict(json.loads(j.read_text()), path=f))
    segs.sort(key=lambda s: s['first_frame'])
    nxt = 1
    for s in segs:
        if s['first_frame'] != nxt: raise SystemExit(f'ch{ch:02d}: {s["path"].name} starts at frame {s["first_frame"]}, expected {nxt} (gap or overlap)')
        nxt = s['last_frame'] + 1
    totals = {s['chapter_total'] for s in segs if s.get('chapter_total')}
    if len(totals) > 1: raise SystemExit(f'ch{ch:02d}: segments disagree on the chapter length {totals}')
    if totals and nxt - 1 != totals.pop(): raise SystemExit(f'ch{ch:02d}: segments end at frame {nxt - 1}, chapter has more frames')
    return segs, nxt - 1


def chapter_titles(P):
    heads = {}
    for line in (P / 'script.txt').read_text(encoding='utf-8').splitlines():
        m = re.match(r'#\s*CH(\d+)\s*\|([^|]*)\|([^|]*)\|(.*)$', line)
        if m: heads[int(m.group(1))] = m.group(4).strip()
    return heads


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('project'); p.add_argument('--chapters', default='1-11'); p.add_argument('--music', default='playful_history_music')
    p.add_argument('--music-gain', type=float, default=0.05); p.add_argument('--voice-gain', type=float, default=1.4)
    p.add_argument('--sfx-gain', type=float, default=0.7); p.add_argument('--out'); p.add_argument('--no-split', action='store_true')
    p.add_argument('--audio-dir', default='audio/chapters', help='where chNN/narration.wav live (tests: a stand-in folder)')
    a = p.parse_args(); P = Path(a.project).resolve(); D = P / 'delivery'; D.mkdir(exist_ok=True)
    lo, _, hi = a.chapters.partition('-'); chs = list(range(int(lo), int(hi or lo) + 1))
    full = chs == list(range(1, 12))
    out = Path(a.out).resolve() if a.out else D / (f'{TITLE}.mp4' if full else f'{TITLE}_ch{chs[0]:02d}-{chs[-1]:02d}.mp4')
    work = D / '.stitch'; work.mkdir(exist_ok=True)

    # ---- video
    plan, start, starts = [], 0, {}
    for ch in chs:
        segs, n = segments(P, ch); starts[ch] = (start, n); plan += segs; start += n
    total = start
    ids = {s.get('encode') for s in plan}
    lst = work / 'concat.txt'; lst.write_text(''.join(f"file '{s['path'].as_posix()}'\n" for s in plan))
    video = work / 'video.mp4'
    copy = ids == {ENCODE_ID}
    if copy:
        run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-map', '0:v:0', '-c', 'copy', '-movflags', '+faststart', str(video)])
    else:
        print(f'encode ids differ {ids}: re-encoding the video once')
        run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-map', '0:v:0', *ENCODE, str(video)])

    # ---- audio: narration + SFX per chapter at its first frame, one music bed, one loudness pass
    N = total * SPF
    voice = np.zeros(N, np.float32); sfx = np.zeros(N, np.float32); cache = {}; notes = []
    for ch in chs:
        f0, n = starts[ch]; i0, L = f0 * SPF, n * SPF
        nw = P / a.audio_dir / f'ch{ch:02d}/narration.wav'
        if nw.exists():
            y = load(nw)
            if len(y) > L + SR * 0.05: notes.append(f'ch{ch:02d}: narration {len(y) / SR:.2f}s is longer than the picture {n / FPS:.2f}s; cut')
            y = y[:L]; voice[i0:i0 + len(y)] += y
        else: notes.append(f'ch{ch:02d}: no narration.wav')
        cf = P / f'source/sound/ch{ch:02d}.json'
        for c in json.loads(cf.read_text(encoding='utf-8')) if cf.exists() else []:
            if 'asset' in c:
                name = c['asset']
                src = next((x for x in (P / 'audio' / name, ROOT / 'assets/audio' / name, ROOT / 'assets/audio' / (name + '.wav'),
                                        ROOT / 'assets/audio/horror' / name, ROOT / 'assets/audio/horror' / (name + '.wav')) if x.is_file()), None)
                if not src: raise SystemExit(f'ch{ch:02d}: sound cue asset not found: {name}')
                buf = cache.setdefault(src, load(src))
                if c.get('dur'):
                    k = min(len(buf), int(c['dur'] * SR)); f = min(k, int(0.15 * SR)); buf = buf[:k].copy(); buf[k - f:] *= np.linspace(1, 0, f, dtype=np.float32)
            else:
                hz = c['tone'] if isinstance(c['tone'], list) else [c['tone']]
                buf = np.concatenate([tone(h, c.get('dur', .15), c.get('sweep', 0), c.get('square', False)) for h in hz])
            i = i0 + int(c['start'] * SR); j = min(i0 + L, i + len(buf))   # a cue never spills into the next chapter
            if i0 <= i < j: sfx[i:j] += buf[:j - i] * c.get('gain', .3)
    mpath = Path(a.music) if Path(a.music).is_file() else ROOT / 'assets/audio' / (a.music + ('' if a.music.endswith('.wav') else '.wav'))
    m = load(mpath); xf = int(0.08 * SR)                                # loop with a short crossfade at each seam
    body = m[:-xf].copy(); body[:xf] = body[:xf] * np.linspace(0, 1, xf) + m[-xf:] * np.linspace(1, 0, xf)
    bed = np.tile(body, N // len(body) + 1)[:N]
    bed[:SR] *= np.linspace(0, 1, SR); bed[-3 * SR:] *= np.linspace(1, 0, 3 * SR)
    mix = voice * a.voice_gain + sfx * a.sfx_gain + bed * a.music_gain
    raw = work / 'mix_raw.wav'
    with wave.open(str(raw), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -.999, .999) * 32767).astype('<i2').tobytes())
    st = 'aformat=channel_layouts=stereo'           # measure and normalise the stereo file that gets delivered
    meas = run(['ffmpeg', '-v', 'info', '-i', str(raw), '-af', f'{st},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
               capture_output=True, text=True).stderr
    mj = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}:measured_LRA={mj['input_lra']}:"
          f"measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}:linear=true")
    final_wav = work / 'mix.wav'
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-af', f'{st},{ln},aresample={SR},apad,atrim=0:{total / FPS}', '-ac', '2', '-ar', str(SR), str(final_wav)])

    # ---- mux
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), '-i', str(final_wav), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR), '-movflags', '+faststart', str(out)])

    # ---- checks
    got = framemd5(out); want = [h for s in plan for h in framemd5(s['path'])]
    seams = []
    acc = 0
    for s in plan[:-1]:
        acc += s['frames']; seams.append({'after': s['path'].name, 'frame': acc, 'ok': got[acc - 1:acc + 1] == want[acc - 1:acc + 1]})
    pr = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,duration,nb_frames', '-of', 'json', str(out)],
                        capture_output=True, text=True).stdout)['streams']
    vdur = next(float(s['duration']) for s in pr if s['codec_type'] == 'video'); adur = next(float(s['duration']) for s in pr if s['codec_type'] == 'audio')
    post = run(['ffmpeg', '-v', 'info', '-i', str(out), '-map', '0:a', '-af', 'loudnorm=I=-14:TP=-1:print_format=json', '-f', 'null', '-'],
               capture_output=True, text=True).stderr
    pj = json.loads(post[post.rindex('{'):post.rindex('}') + 1])
    titles = chapter_titles(P)
    lines = [f'{int(starts[ch][0] / FPS) // 60}:{int(starts[ch][0] / FPS) % 60:02d} {titles.get(ch, f"Chapter {ch}")}' for ch in chs]
    if full or chs[0] == 1: (D / 'youtube_chapters.txt' if full else work / 'youtube_chapters.txt').write_text('\n'.join(lines) + '\n')
    rep = {
        'file': out.name, 'chapters': chs, 'frames': len(got), 'frames_expected': total, 'seconds': round(total / FPS, 3),
        'video_join': 'stream copy' if copy else 're-encoded', 'frames_match_segments': got == want, 'seams': seams,
        'video_s': vdur, 'audio_s': adur, 'av_diff_s': round(adur - vdur, 4), 'loudness_I': pj['input_i'], 'true_peak': pj['input_tp'],
        'chapter_starts': {f'ch{c:02d}': {'frame': starts[c][0], 's': round(starts[c][0] / FPS, 3), 'frames': starts[c][1]} for c in chs},
        'youtube_chapters': lines, 'notes': notes, 'size_mb': round(out.stat().st_size / 1e6, 1),
        'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
    }
    ok = (rep['frames'] == total and rep['frames_match_segments'] and abs(rep['av_diff_s']) <= 1 / FPS + 0.03
          and abs(float(pj['input_i']) + 14) <= 0.5 and float(pj['input_tp']) <= -1.0)
    rep['ok'] = ok
    if not a.no_split and out.stat().st_size > 95e6:
        for old in D.glob(out.name + '.part_*'): old.unlink()
        run(['split', '-b', '95M', out.name, out.name + '.part_'], cwd=out.parent)
        rep['parts'] = sorted(x.name for x in out.parent.glob(out.name + '.part_*'))
        gi = out.parent / '.gitignore'; g = gi.read_text() if gi.exists() else ''
        if f'/{out.name}\n' not in g: gi.write_text(g + f'/{out.name}\n')
        rm = out.parent / 'README.md'; r = rm.read_text() if rm.exists() else '# Delivery\n'
        cmd = f'cat {out.name}.part_* > {out.name}'
        if cmd not in r: rm.write_text(r.rstrip('\n') + f'\n\n`{out.name}` is committed in parts (GitHub file limit). Join: `{cmd}`\n')
    (D / ('stitch_report.json' if full else f'stitch_report_ch{chs[0]:02d}-{chs[-1]:02d}.json')).write_text(json.dumps(rep, indent=1))
    print(json.dumps({k: rep[k] for k in ('file', 'frames', 'frames_expected', 'video_join', 'frames_match_segments', 'av_diff_s', 'loudness_I', 'true_peak', 'size_mb', 'ok')}))
    for s in seams: print(f"seam after {s['after']} at frame {s['frame']}: {'clean' if s['ok'] else 'MISMATCH'}")
    for n_ in notes: print('NOTE', n_)
    if not ok: raise SystemExit('STITCH CHECK FAILED (see stitch report)')


if __name__ == '__main__':
    main()
