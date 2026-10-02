"""Local narration with Qwen3-TTS in one background run: generate, join, time, check. Prints a short report.

~/Qwen3-TTS/.venv/Scripts/python.exe scripts/narrate.py projects/<slug> [--voice george] [--take take-01] [--redo 3,7]

script.txt holds one sentence or beat per line. Each line becomes one clip, cached by its text in
audio/qwen/<take>/clips/, so a re-run only generates lines that are new or changed. --redo regenerates the
listed line numbers anyway (for a bad read). Then it joins the clips with 0.4 s gaps (a blank line in script.txt
makes a longer --beat pause between sections) into audio/narration.wav,
writes audio/narration-source.json, measures word timings (transcribe.py) and compares them with the script.
Logs go to audio/qwen/<take>/narrate.log, so only the report reaches stdout.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time
import numpy as np, soundfile as sf
S = Path(__file__).resolve().parent
sys.path.insert(0, str(S))
from settings import load

QWEN = Path(os.environ.get('QWEN_TTS_DIR', Path.home() / 'Qwen3-TTS'))
GAP = 0.4


def norm(text):
    return re.findall(r"[a-z0-9']+", text.lower().replace('...', ' '))


def clip_name(voice, text):
    return hashlib.sha1(f'{voice}|{text}'.encode()).hexdigest()[:12] + '.wav'


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('project', type=Path); p.add_argument('--voice', default='george'); p.add_argument('--take', default='take-01')
    p.add_argument('--redo', default='', help='comma list of line numbers to regenerate')
    p.add_argument('--beat', type=float, default=0.9, help='pause in seconds at a blank line in script.txt')
    a = p.parse_args(); o = a.project.resolve(); cfg = load()
    raw = [l.strip() for l in (o / 'script.txt').read_text(encoding='utf-8-sig').splitlines()]
    lines = [l for l in raw if l]
    pause = []  # pause after each line: --beat if a blank line follows it, else GAP
    for i, l in enumerate(raw):
        if l:
            pause.append(GAP)
        elif pause:
            pause[-1] = a.beat
    take = o / 'audio/qwen' / a.take; clips = take / 'clips'; clips.mkdir(parents=True, exist_ok=True)
    log = open(take / 'narrate.log', 'a', encoding='utf-8'); log.write(f'\n=== {time.ctime()}\n'); log.flush()
    redo = {int(n) for n in a.redo.split(',') if n.strip()}
    names = [clip_name(a.voice, t) for t in lines]
    todo = sorted({i for i, n in enumerate(names) if i + 1 in redo or not (clips / n).is_file()})

    t0 = time.time()
    if todo:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / 'todo.txt'; src.write_text('\n'.join(lines[i] for i in todo), encoding='utf-8')
            r = subprocess.run([str(QWEN / '.venv/Scripts/python.exe'), str(QWEN / 'tts.py'), '--file', str(src), '--clone', a.voice,
                                '-o', str(Path(tmp) / 'out')], stdout=log, stderr=subprocess.STDOUT)
            if r.returncode:
                raise SystemExit(f'Qwen3-TTS failed (exit {r.returncode}); see {take / "narrate.log"}')
            for k, i in enumerate(todo, 1):
                shutil.move(str(Path(tmp) / 'out' / f'{k:03d}.wav'), clips / names[i])
    gen_min = (time.time() - t0) / 60

    parts, report, sr = [], [], None
    for i, n in enumerate(names):
        wav, sr = sf.read(clips / n, dtype='float32')
        secs = len(wav) / sr; wps = len(norm(lines[i])) / max(secs, .1)
        if wps < 1.3 or wps > 4.5:
            report.append(f'  line {i + 1}: {secs:.1f}s for {len(norm(lines[i]))} words - odd pace, listen (redo with --redo {i + 1})')
        parts += [wav, np.zeros(int(sr * pause[i]), dtype='float32')]
    full = np.concatenate(parts[:-1]); sf.write(o / 'audio/narration.wav', full, sr, subtype='PCM_16')
    dur = len(full) / sr
    (o / 'audio/narration-source.json').write_text(json.dumps({
        'engine': 'qwen3-tts', 'model': 'Qwen3-TTS-12Hz-0.6B-Base', 'voice': f'{a.voice} (local clone)', 'take': a.take,
        'clips': f'audio/qwen/{a.take}/clips', 'gap_seconds': GAP, 'beat_seconds': a.beat, 'speech_end_seconds': round(dur, 2)}, indent=2), encoding='utf-8')

    py = cfg.get('transcription_python') if cfg.get('transcription_python') and Path(cfg['transcription_python']).is_file() else sys.executable
    r = subprocess.run([py, str(S / 'transcribe.py'), str(o / 'audio/narration.wav'), '--output', str(o / 'audio/alignment'), '--force'],
                       stdout=log, stderr=subprocess.STDOUT)
    if r.returncode:
        raise SystemExit(f'Narration saved, but transcribe failed; see {take / "narrate.log"}')

    heard = [w['word'] for seg in json.loads((o / 'audio/alignment/transcript.json').read_text(encoding='utf-8'))['segments'] for w in seg['words']]
    heard = norm(' '.join(heard)); script, owner = [], []
    for i, t in enumerate(lines):
        ws = norm(t); script += ws; owner += [i + 1] * len(ws)
    import difflib
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, script, heard, autojunk=False).get_opcodes():
        if tag != 'equal':
            ln = owner[min(i1, len(owner) - 1)]
            report.append(f'  line {ln}: script "{" ".join(script[i1:i2])}" / heard "{" ".join(heard[j1:j2])}"')

    print(f'NARRATION_READY {o.name}: {len(lines)} lines, {dur:.1f}s, generated {len(todo)} in {gen_min:.1f} min')
    print('CHECK (whisper mishearings are common; only redo lines that sound wrong):' if report else 'CHECK clean: every script word was heard')
    print('\n'.join(report[:15]) + (f'\n  ...{len(report) - 15} more in transcript.json' if len(report) > 15 else ''))


if __name__ == '__main__':
    main()
