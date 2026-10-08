"""Re-voice one speaker in finished chapters, audio only: every line keeps its exact start and length, so the picture,
mouths and captions stay in sync (lines.json / captions.json timings are not touched; only voice/clip/seed of the
replaced lines are updated).

    python3 scripts/replace_speaker.py projects/<slug> --chapters 1,2 --speaker MAX --voice max_boy [--take take-01] [--redo 1:5]

Per line of that speaker in audio/chapters/chNN/lines.json: generate the line with the new clone voice (narrate_multi's
cache, tighten, level and note effect; the clip is cached as audio/qwen/<take>/clips/<sha1(voice|text)[:12]>.wav), time-stretch
it to exactly the old line's length (ffmpeg rubberband; a take needing a ratio outside 0.85-1.18 is re-taken with the next
seed, best of 4 kept), and paste it into narration.wav at the same start with 10 ms crossfades. Every new line is checked
with faster-whisper against the script; the report also checks that the old clip really sat at that spot.
"""
import argparse, json, subprocess, sys, time
from pathlib import Path
import numpy as np, soundfile as sf
sys.path.insert(0, str(Path(__file__).resolve().parent))
import narrate_multi as nm

LO, HI = 0.85, 1.18


def stretch(y, sr, target_n, tmp):
    """Time-stretch y to exactly target_n samples (rubberband, pitch kept)."""
    tempo = len(y) / target_n
    a, b = tmp / 'st_in.wav', tmp / 'st_out.wav'; sf.write(a, y, sr, subtype='FLOAT')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', f'rubberband=tempo={tempo:.6f}:transients=smooth:formant=preserved',
                    '-ar', str(sr), '-ac', '1', '-c:a', 'pcm_f32le', str(b)], check=True)
    out, _ = sf.read(b, dtype='float32')
    out = out[:target_n] if len(out) >= target_n else np.concatenate([out, np.zeros(target_n - len(out), np.float32)])
    f = min(int(0.005 * sr), target_n // 4)
    if f:
        out[-f:] *= np.linspace(1, 0, f)
    return out


def f0_p95(y, sr, q=95):
    import librosa
    f0, vf, _ = librosa.pyin(librosa.resample(y, orig_sr=sr, target_sr=16000), fmin=70, fmax=500, sr=16000)
    f0 = f0[vf & ~np.isnan(f0)]
    return float(np.percentile(f0, q)) if len(f0) else 0.0


_REF = {}
def speaker_sim(tts, voice, y):
    # cosine similarity of the take's speaker embedding to the voice sample's (Qwen3 Base speaker encoder)
    def emb(a):
        e = tts.m.create_voice_clone_prompt(ref_audio=a, x_vector_only_mode=True)[0].ref_spk_embedding.float().flatten().numpy()
        return e / np.linalg.norm(e)
    if voice not in _REF:
        _REF[voice] = emb(str(nm.V / f'{voice}.wav'))
    return float(emb((y, nm.SR)) @ _REF[voice])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('project', type=Path); ap.add_argument('--chapters', required=True)
    ap.add_argument('--speaker', required=True); ap.add_argument('--voice', required=True)
    ap.add_argument('--take', default='take-01'); ap.add_argument('--seed', type=int, default=77)
    ap.add_argument('--redo', default='', help='ch:line list to re-take with the next seed')
    ap.add_argument('--whisper', default='small.en')
    ap.add_argument('--max-f0', type=float, default=330, help='re-take a line whose pitch p95 is above this (squeaks)')
    ap.add_argument('--min-f0', type=float, default=0, help='re-take a line whose median pitch is below this (the clone drifting into a deeper voice)')
    ap.add_argument('--tries', type=int, default=4, help='takes per line before keeping the best')
    ap.add_argument('--min-sim', type=float, default=0, help='re-take a line whose speaker similarity to the voice sample is below this (sounds like someone else)')
    a = ap.parse_args()
    o = (a.project if a.project.is_absolute() or a.project.exists() else nm.ROOT / a.project).resolve()
    if not (nm.V / f'{a.voice}.wav').is_file():
        raise SystemExit(f'no voice sample assets/audio/voices/{a.voice}.wav')
    chs = [int(c) for c in a.chapters.split(',') if c.strip()]
    redo = {tuple(map(int, r.split(':'))) for r in a.redo.split(',') if r.strip()}
    take = o / 'audio/qwen' / a.take; clips, raw = take / 'clips', take / 'clips_raw'
    clips.mkdir(parents=True, exist_ok=True); raw.mkdir(exist_ok=True); tmp = take / '.tmp_replace'; tmp.mkdir(exist_ok=True)
    logf = open(take / 'gen.log', 'a', encoding='utf-8')
    def log(m):
        logf.write(f'{time.strftime("%H:%M:%S")} {m}\n'); logf.flush(); print(m, flush=True)
    log(f'=== replace_speaker {a.speaker} -> {a.voice}, chapters {chs}')
    tts = wh = None; report = []
    for c in chs:
        d = o / 'audio/chapters' / f'ch{c:02d}'; L = json.loads((d / 'lines.json').read_text(encoding='utf-8'))
        nar, sr = sf.read(d / 'narration.wav', dtype='float32'); nar = nar.copy()
        todo = [l for l in L['lines'] if l['speaker'] == a.speaker]
        if not todo:
            log(f'CH{c:02d}: no {a.speaker} lines'); continue
        for l in todo:
            s, e = int(round(l['start'] * sr)), int(round(l['end'] * sr)); tn = e - s
            # was the old clip really at this spot? (correlation of its levelled + effected take with the mix)
            old = o / l['clip'] if l.get('clip') else None; corr = None
            if old and old.is_file():
                oy, _ = sf.read(old, dtype='float32'); oy = nm.effect(nm.level(oy), sr, l['note'] or '', tmp)
                if l['index'] == 1 and l['start'] == 0.0:
                    oy = oy[len(oy) - tn:] if len(oy) > tn else oy
                n = min(len(oy), tn) - 100; corr = -1.0  # lines.json times are rounded to 1 ms: search +-2 ms
                for lag in range(-48, 49, 2):
                    seg = nar[max(0, s + 50 + lag):max(0, s + 50 + lag) + n]; ref = oy[50:50 + len(seg)]
                    corr = max(corr, float(np.dot(seg, ref) / (np.linalg.norm(seg) * np.linalg.norm(ref) + 1e-9)))
            name = nm.clip_name(a.voice, l['text']); side = clips / f'{name}.json'
            meta = json.loads(side.read_text()) if side.is_file() else {}
            force = (c, l['index']) in redo
            if force or not (clips / f'{name}.wav').is_file():
                if tts is None:
                    tts = nm.TTS(log)
                base_attempt = meta.get('attempt', -1) + 1 if force else 0; best = None
                for k in range(a.tries):
                    att = base_attempt + k; seed = a.seed + int(name[:6], 16) % 100000 + 1000 * att
                    t1 = time.time(); y, gsr = tts.gen(a.voice, l['text'], seed)
                    if gsr != nm.SR:
                        import librosa; y = librosa.resample(y, orig_sr=gsr, target_sr=nm.SR)
                    ty = nm.tighten(y, nm.SR); ratio = len(ty) / tn; p95 = f0_p95(ty, nm.SR); med = f0_p95(ty, nm.SR, 50) if a.min_f0 else 1e9
                    sim = speaker_sim(tts, a.voice, ty) if a.min_sim else 1.0
                    log(f'  ch{c}:{l["index"]} take seed {seed}: {len(ty)/sr:.2f}s for {tn/sr:.2f}s (ratio {ratio:.2f}, F0 p95 {p95:.0f} Hz, median {min(med, 9999):.0f}, sim {sim:.3f}) in {time.time()-t1:.0f}s')
                    score = max(ratio / HI, LO / ratio, p95 / a.max_f0, (a.min_f0 / med) if med else 9, 1 + (a.min_sim - sim) * 10)
                    if best is None or score < best[0]:
                        best = (score, y, ty, seed, att)
                    if LO <= ratio <= HI and p95 <= a.max_f0 and med >= a.min_f0 and sim >= a.min_sim:
                        break
                _, y, ty, seed, att = best
                sf.write(raw / f'{name}.wav', y, nm.SR, subtype='PCM_16'); sf.write(clips / f'{name}.wav', ty, nm.SR, subtype='PCM_16')
                meta = {'voice': a.voice, 'text': l['text'], 'seed': seed, 'attempt': att, 'model': 'Qwen3-TTS-12Hz-1.7B-Base'}
                side.write_text(json.dumps(meta, indent=1))
            ty, _ = sf.read(clips / f'{name}.wav', dtype='float32'); ratio = len(ty) / tn
            new = nm.effect(stretch(nm.level(ty), sr, tn, tmp), sr, l['note'] or '', tmp)[:tn]
            if len(new) < tn:
                new = np.concatenate([new, np.zeros(tn - len(new), np.float32)])
            f = int(0.01 * sr); g = np.linspace(0, 1, f, dtype=np.float32)
            new[:f] = nar[s:s + f] * (1 - g) + new[:f] * g; new[-f:] = new[-f:] * (1 - g) + nar[e - f:e] * g
            nar[s:e] = new
            if wh is None:
                log(f'loading faster-whisper {a.whisper}'); wh = nm.Whisper(a.whisper)
            _, bad = nm.align(l['text'], wh.words(nar[s:e].copy(), sr), 0, tn / sr)
            msg = f'  ch{c}:{l["index"]} {a.speaker}{" (" + l["note"] + ")" if l["note"] else ""}: ratio {ratio:.2f}, F0 p95 {f0_p95(ty, sr):.0f} Hz, old-clip match {corr if corr is None else round(corr, 2)}'
            msg += ', words OK' if not bad else ', ' + '; '.join(f'script "{x}" / heard "{y}"' for x, y in bad)
            if not LO <= ratio <= HI:
                msg += f'  (ratio outside {LO}-{HI}; listen, --redo {c}:{l["index"]})'
            report.append(msg); log(msg)
            l.update(voice=a.voice, clip=f'audio/qwen/{a.take}/clips/{name}.wav', seed=meta.get('seed'))
        sf.write(d / 'narration.wav', nar, sr, subtype='PCM_16')
        (d / 'lines.json').write_text(json.dumps(L, indent=1), encoding='utf-8')
        log(f'CH{c:02d}: replaced {len(todo)} {a.speaker} lines with {a.voice}; length unchanged {len(nar)/sr:.3f}s')
    import shutil; shutil.rmtree(tmp, ignore_errors=True)
    log('REPLACE_DONE\n' + '\n'.join(report))


if __name__ == '__main__':
    main()
