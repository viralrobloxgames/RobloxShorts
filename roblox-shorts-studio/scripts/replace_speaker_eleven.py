"""Re-voice one speaker in finished chapters with an ElevenLabs voice, audio only (the ElevenLabs twin of
replace_speaker.py): every line keeps its exact start and length, so the picture, mouths and captions stay in sync.

    ELEVENLABS_API_KEY=... python3 scripts/replace_speaker_eleven.py projects/<slug> --chapters 2,3,6 --speaker DAD \
        [--voice-id JBFqnCBsd6RMkjVDRZzb] [--name eleven_george_warm] [--stability 0.45 --style 0.25] [--redo 2:5]

Per line of that speaker in audio/chapters/chNN/lines.json: generate the line as raw 24 kHz PCM (no MP3 step, no
limiter), tighten it, set its level like every other voice (narrate_multi.level: speech RMS to -20 dB, linear gain),
time-stretch it to exactly the old line's length (rubberband; if the take is more than 10% off, it is re-generated with
ElevenLabs' own speed setting first so the stretch stays close to 1.0), apply the line's note effect (offscreen etc.)
and paste it into narration.wav at the same start with 10 ms crossfades. Clips are cached in
audio/eleven/<name>/<sha1(name|text)[:12]>.wav. Each new line is checked with faster-whisper when it is installed.
"""
import argparse, hashlib, json, os, sys, time, urllib.request
from pathlib import Path
import numpy as np, soundfile as sf
sys.path.insert(0, str(Path(__file__).resolve().parent))
import narrate_multi as nm
from replace_speaker import stretch

SR = 24000


def eleven(text, voice_id, stability, similarity, style, speed):
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=pcm_{SR}'
    body = json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2',
                       'voice_settings': {'stability': stability, 'similarity_boost': similarity, 'style': style,
                                          'use_speaker_boost': True, 'speed': speed}}).encode()
    req = urllib.request.Request(url, data=body, headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY'],
                                                          'Content-Type': 'application/json'})
    for k in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                pcm = r.read()
            return np.frombuffer(pcm, dtype='<i2').astype(np.float32) / 32768.0
        except Exception as e:  # network hiccup or rate limit: back off and retry
            if k == 3:
                raise
            print(f'  retry after {e}', flush=True); time.sleep(2 ** (k + 1))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('project', type=Path); ap.add_argument('--chapters', required=True)
    ap.add_argument('--speaker', required=True)
    ap.add_argument('--voice-id', default='JBFqnCBsd6RMkjVDRZzb', help='ElevenLabs voice (default: George)')
    ap.add_argument('--name', default='eleven_george_warm', help='label written to lines.json "voice"')
    ap.add_argument('--stability', type=float, default=0.45); ap.add_argument('--similarity', type=float, default=0.75)
    ap.add_argument('--style', type=float, default=0.25)
    ap.add_argument('--redo', default='', help='ch:line list to generate again (ignores the cache)')
    ap.add_argument('--whisper', default='small.en')
    a = ap.parse_args()
    o = (a.project if a.project.is_absolute() or a.project.exists() else nm.ROOT / a.project).resolve()
    chs = [int(c) for c in a.chapters.split(',') if c.strip()]
    redo = {tuple(map(int, r.split(':'))) for r in a.redo.split(',') if r.strip()}
    cache = o / 'audio/eleven' / a.name; cache.mkdir(parents=True, exist_ok=True)
    tmp = cache / '.tmp'; tmp.mkdir(exist_ok=True)
    wh = None; report = []
    for c in chs:
        d = o / 'audio/chapters' / f'ch{c:02d}'; L = json.loads((d / 'lines.json').read_text(encoding='utf-8'))
        nar, sr = sf.read(d / 'narration.wav', dtype='float32'); nar = nar.copy()
        assert sr == SR, f'ch{c:02d} narration is {sr} Hz, expected {SR}'
        todo = [l for l in L['lines'] if l['speaker'] == a.speaker]
        for l in todo:
            s, e = int(round(l['start'] * sr)), int(round(l['end'] * sr)); tn = e - s
            name = hashlib.sha1(f'{a.name}|{l["text"]}'.encode()).hexdigest()[:12]
            clip = cache / f'{name}.wav'
            if (c, l['index']) in redo or not clip.is_file():
                speed, best = 1.0, None
                for att in range(3):
                    ty = nm.tighten(eleven(l['text'], a.voice_id, a.stability, a.similarity, a.style, speed), sr)
                    ratio = len(ty) / tn
                    if best is None or abs(np.log(ratio)) < abs(np.log(best[1])):
                        best = (ty, ratio, speed)
                    print(f'  ch{c}:{l["index"]} speed {speed:.2f}: {len(ty)/sr:.2f}s for {tn/sr:.2f}s (ratio {ratio:.2f})', flush=True)
                    if 0.9 <= ratio <= 1.1:
                        break
                    speed = float(np.clip(speed * ratio, 0.7, 1.2))
                ty = best[0]; sf.write(clip, ty, sr, subtype='PCM_16')
                (cache / f'{name}.json').write_text(json.dumps({'text': l['text'], 'voice_id': a.voice_id, 'speed': best[2],
                    'settings': [a.stability, a.similarity, a.style]}, indent=1))
            ty, _ = sf.read(clip, dtype='float32'); ratio = len(ty) / tn
            new = nm.effect(stretch(nm.level(ty), sr, tn, tmp), sr, l['note'] or '', tmp)[:tn]
            if len(new) < tn:
                new = np.concatenate([new, np.zeros(tn - len(new), np.float32)])
            f = int(0.01 * sr); g = np.linspace(0, 1, f, dtype=np.float32)
            new[:f] = nar[s:s + f] * (1 - g) + new[:f] * g; new[-f:] = new[-f:] * (1 - g) + nar[e - f:e] * g
            nar[s:e] = new
            msg = f'  ch{c}:{l["index"]} {a.speaker}{" (" + l["note"] + ")" if l["note"] else ""}: stretch {ratio:.2f}'
            try:
                if wh is None:
                    wh = nm.Whisper(a.whisper)
                _, bad = nm.align(l['text'], wh.words(nar[s:e].copy(), sr), 0, tn / sr)
                msg += ', words OK' if not bad else ', ' + '; '.join(f'script "{x}" / heard "{y}"' for x, y in bad)
            except Exception as ex:
                msg += f', whisper check skipped ({type(ex).__name__})'
            report.append(msg); print(msg, flush=True)
            l.update(voice=a.name, clip=str(clip.relative_to(o)), seed=None)
        if todo:
            sf.write(d / 'narration.wav', nar, sr, subtype='PCM_16')
            (d / 'lines.json').write_text(json.dumps(L, indent=1), encoding='utf-8')
            print(f'CH{c:02d}: replaced {len(todo)} {a.speaker} lines with {a.name}; length unchanged {len(nar)/sr:.3f}s', flush=True)
    import shutil; shutil.rmtree(tmp, ignore_errors=True)
    print('REPLACE_DONE\n' + '\n'.join(report))


if __name__ == '__main__':
    main()
