"""Multi-voice chapter narration (production/NARRATION_SPEC.md of the long-form): generate, tighten, effect, join, time, check.

    python3 scripts/narrate_multi.py projects/<slug> --chapters 1[,2,...|all] [--redo 1:5,3:9] [--take take-01]
        [--standin MAX=brittney,LILY=brittney] [--no-gen] [--gen-only] [--whisper small.en]

script.txt: `# CHnn | DAY | TIME | Title` headers, `SPEAKER: text` / `SPEAKER (note): text` spoken lines, `[ ... ]` action
lines (never spoken), `[+N ...]` actions that also add N s of silence before the next spoken line.
Voices: VO/SKYE = brittney clone, DAD = george_c (mean x-vector, as qwen_cloud_george_c.py), MAX = max_kid, LILY = lily_kid.
One process loads Qwen3-TTS 1.7B-Base once and generates only the clips missing from the shared cache
audio/qwen/<take>/clips/<sha1(voice|text)[:12]>.wav (raw takes in clips_raw/, a <name>.json sidecar with voice, text, seed
and the clip's word timings). Seeds are deterministic (from the clip name); `--redo ch:line` (line = spoken-line index in
the chapter, 1-based, as in lines.json) regenerates that line with the next seed. Clips are tightened like
tighten_clips.py, levelled, given their note effect with ffmpeg, and joined: 0.25 s between lines, 0.35 s across a change of
scene, plus every [+N] pause, 0.6 s of room tone at the end; the chapter's first line starts at 0.0 s. Every clip is
transcribed with faster-whisper and checked against the script. Writes audio/chapters/chNN/narration.wav, captions.json,
lines.json. With --standin, the stand-in voice's own clips are used and outputs go to audio/chapters-standin/ (never commit).
"""
import argparse, difflib, hashlib, json, re, shutil, subprocess, sys, time
from pathlib import Path
import numpy as np, soundfile as sf

ROOT = Path(__file__).resolve().parent.parent; V = ROOT / 'assets/audio/voices'
VOICES = {'VO': 'brittney', 'SKYE': 'brittney', 'DAD': 'george_c', 'MAX': 'max_kid', 'LILY': 'lily_kid'}
GAP, SCENE_GAP, TAIL, SR = 0.25, 0.35, 0.6, 24000
SCENE = re.compile(r'^(hard cut|cut to|back to|inside\b|dusk|dawn|later|meanwhile|the (kitchen|attic|classroom|upstairs hallway|hallway|bedroom|back of)\b)', re.I)
# note -> ffmpeg filter chain (applied after levelling; deterministic)
FX = {
    'whisper': 'highpass=f=160,lowpass=f=5500,volume=0.55',
    'ghost': 'apad=pad_dur=0.5,aecho=1.0:0.7:70|140|260:0.4|0.28|0.16,lowpass=f=7000,volume=1.3,alimiter=limit=0.95:level=false',
    'shriek': 'volume=1.35,alimiter=limit=0.95:level=false',
    'offscreen': 'lowpass=f=1100,volume=0.5',
    'offscreen, below': 'lowpass=f=750,volume=0.45',
    'behind door': 'lowpass=f=700,volume=0.5',
    'phone': 'highpass=f=300,lowpass=f=3400,highpass=f=300,lowpass=f=3400,volume=1.3,alimiter=limit=0.9:level=false',
}


def norm(t):
    return re.findall(r"[a-z0-9']+", t.lower().replace('...', ' ').replace('’', "'"))


def clip_name(voice, text):
    return hashlib.sha1(f'{voice}|{text}'.encode()).hexdigest()[:12]


def parse(path):
    """-> {chapter number: {'header': str, 'items': [dict]}}; items are spoken lines and actions in order."""
    chs, cur = {}, None
    for raw in path.read_text(encoding='utf-8-sig').splitlines():
        l = raw.strip()
        if not l:
            continue
        m = re.match(r'#\s*CH(\d+)\s*\|(.*)', l)
        if m:
            cur = chs.setdefault(int(m.group(1)), {'header': l.lstrip('# ').strip(), 'items': []}); continue
        if cur is None:
            continue
        if l.startswith('['):
            body = l.strip('[]').strip(); p = re.match(r'\+(\d+(?:\.\d+)?)\s*(.*)', body)
            cur['items'].append({'kind': 'action', 'text': p.group(2) if p else body, 'pause': float(p.group(1)) if p else 0.0,
                                 'scene_change': bool(not p and SCENE.match(body))}); continue
        m = re.match(r'([A-Z][A-Z ]*?)\s*(?:\(([^)]*)\))?\s*:\s*(.+)', l)
        if not m:
            raise SystemExit(f'script.txt: cannot parse line: {l}')
        sp, note, text = m.group(1).strip(), (m.group(2) or '').strip().lower(), m.group(3).strip()
        if sp not in VOICES:
            raise SystemExit(f'script.txt: unknown speaker {sp}: {l}')
        if note and note not in FX:
            raise SystemExit(f'script.txt: unknown note ({note}): {l}')
        cur['items'].append({'kind': 'line', 'speaker': sp, 'note': note, 'text': text})
    return chs


class TTS:
    def __init__(self, log):
        import torch, dataclasses
        from qwen_tts import Qwen3TTSModel
        self.torch, self.dc, self.log, self.prompts = torch, dataclasses, log, {}
        torch.set_num_threads(max(1, __import__('os').cpu_count() or 4))
        t = time.time()
        self.m = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cpu', dtype=torch.float32)
        log(f'model loaded in {time.time() - t:.0f}s')

    def prompt(self, voice):
        if voice not in self.prompts:
            torch = self.torch
            pr = self.m.create_voice_clone_prompt(ref_audio=str(V / f'{voice}.wav'), ref_text=(V / f'{voice}.txt').read_text().strip())[0]
            emb = V / f'{voice}_1.7B_xvector.npy'
            if voice == 'george_c' and not emb.is_file():
                raise SystemExit('george_c_1.7B_xvector.npy missing: run scripts/qwen_cloud_george_c.py once to build it')
            if emb.is_file():
                pr = self.dc.replace(pr, ref_spk_embedding=torch.from_numpy(np.load(emb)).to(pr.ref_spk_embedding.dtype))
            self.prompts[voice] = pr
        return self.prompts[voice]

    def gen(self, voice, text, seed):
        self.torch.manual_seed(seed)
        w, sr = self.m.generate_voice_clone(text=text, language='English', voice_clone_prompt=[self.prompt(voice)], max_new_tokens=300)
        return np.asarray(w[0], dtype=np.float32), sr


def tighten(y, sr, max_gap=0.35, head=0.06, tail=0.12):
    """Same algorithm as scripts/tighten_clips.py."""
    import librosa
    iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=128)
    if not len(iv):
        return y
    xf = int(0.01 * sr); half = int(max_gap / 2 * sr)
    out = y[max(0, iv[0][0] - int(head * sr)):iv[0][1]]
    for (s0, e0), (s1, e1) in zip(iv[:-1], iv[1:]):
        gap = y[e0:s1]
        if len(gap) > 2 * half + 2 * xf:
            l, r = gap[:half + xf].copy(), gap[-half - xf:].copy(); f = np.linspace(0, 1, xf)
            gap = np.concatenate([l[:-xf], l[-xf:] * (1 - f) + r[:xf] * f, r[xf:]])
        out = np.concatenate([out, gap, y[s1:e1]])
    return np.concatenate([out, y[iv[-1][1]:min(len(y), iv[-1][1] + int(tail * sr))]]).astype(np.float32)


def level(y, target_db=-20.0):
    """Speech RMS (loud frames only) to target, peak capped at 0.95, so all four voices sit at one level."""
    fr = 480; n = len(y) // fr
    if n == 0:
        return y
    rms = np.sqrt((y[:n * fr].reshape(n, fr) ** 2).mean(1) + 1e-12); loud = rms[rms > rms.max() * 0.1]
    g = 10 ** (target_db / 20) / max(np.sqrt((loud ** 2).mean()), 1e-6)
    g = min(g, 0.95 / max(np.abs(y).max() * 1.0, 1e-6))
    return (y * g).astype(np.float32)


def effect(y, sr, note, tmp):
    if not note:
        return y
    a, b = tmp / 'fx_in.wav', tmp / 'fx_out.wav'; sf.write(a, y, sr, subtype='FLOAT')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(a), '-af', FX[note], '-ar', str(sr), '-ac', '1', '-c:a', 'pcm_f32le', str(b)], check=True)
    out, _ = sf.read(b, dtype='float32')
    return np.clip(out, -0.99, 0.99)


class Whisper:
    def __init__(self, name):
        from faster_whisper import WhisperModel
        self.m = WhisperModel(name, device='cpu', compute_type='int8'); self.name = name

    def words(self, y, sr):
        import librosa  # an array, not a path: faster-whisper's own decoder breaks with some PyAV versions
        segs, _ = self.m.transcribe(librosa.resample(y, orig_sr=sr, target_sr=16000).astype(np.float32), language='en', word_timestamps=True, beam_size=5, vad_filter=False)
        return [{'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3)} for s in segs for w in (s.words or [])]


def align(text, heard, t0, t1):
    """Script tokens (original spelling) of one line timed from the heard words; returns (words, mismatches)."""
    toks = []
    for tk in text.split():
        if norm(tk) or not toks:
            toks.append(tk)
        else:
            toks[-1] += ' ' + tk  # punctuation-only token sticks to the previous word
    # compare sub-words ("scaredy-cat" = scaredy + cat on both sides), then time each token from its sub-words
    sk, so = [], []
    for i, t in enumerate(toks):
        for w in norm(t):
            sk.append(w); so.append(i)
    hk, ht = [], []
    for w in heard:
        ws = norm(w['word']); n = len(ws)
        for k, x in enumerate(ws):
            d = (w['end'] - w['start']) / max(n, 1); hk.append(x); ht.append((w['start'] + d * k, w['start'] + d * (k + 1)))
    st, en = [None] * len(toks), [None] * len(toks); bad = []
    def put(i, a, b):
        st[i] = a if st[i] is None else min(st[i], a); en[i] = b if en[i] is None else max(en[i], b)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, sk, hk, autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1):
                put(so[i1 + k], *ht[j1 + k])
        else:
            bad.append((' '.join(sk[i1:i2]), ' '.join(hk[j1:j2])))
            if tag == 'replace':
                a, b = ht[j1][0], ht[j2 - 1][1]; n = i2 - i1
                for k in range(n):
                    put(so[i1 + k], a + (b - a) * k / n, a + (b - a) * (k + 1) / n)
    # fill unheard tokens by interpolation, then force monotonic and inside [t0, t1]
    known = [i for i in range(len(toks)) if st[i] is not None]; miss = set(range(len(toks))) - set(known)
    for i in sorted(miss):
        if True:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            a = en[lo] if lo is not None else 0.0; b = st[hi] if hi is not None else (t1 - t0)
            run = [k for k in sorted(miss) if (lo is None or k > lo) and (hi is None or k < hi)]
            j = run.index(i); n = len(run); st[i], en[i] = a + (b - a) * j / n, a + (b - a) * (j + 1) / n
    out, prev = [], 0.0
    for i, tk in enumerate(toks):
        s = min(max(st[i] + t0, t0, prev), t1); e = min(max(en[i] + t0, s + 0.02), t1); prev = s
        out.append({'word': tk, 'start': round(s, 3), 'end': round(e, 3)})
    return out, bad


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('project', type=Path); ap.add_argument('--chapters', required=True, help='e.g. 1 or 3,4 or all')
    ap.add_argument('--redo', default='', help='ch:line list, e.g. 1:5,3:9 (spoken-line index in the chapter, 1-based)')
    ap.add_argument('--take', default='take-01'); ap.add_argument('--seed', type=int, default=77)
    ap.add_argument('--standin', default='', help='SPEAKER=voice list for testing before a voice exists (outputs go to audio/chapters-standin/)')
    ap.add_argument('--no-gen', action='store_true', help='never generate; fail if a clip is missing')
    ap.add_argument('--gen-only', action='store_true', help='generate missing clips (skipping voices with no sample yet), skip join/transcribe')
    ap.add_argument('--whisper', default='small.en'); ap.add_argument('--max-lines', type=int, default=0, help='testing: only the first N spoken lines')
    a = ap.parse_args()
    o = (a.project if a.project.is_absolute() or a.project.exists() else ROOT / a.project).resolve()
    chs = parse(o / 'script.txt')
    want = sorted(chs) if a.chapters == 'all' else [int(c) for c in a.chapters.split(',') if c.strip()]
    for c in want:
        if c not in chs:
            raise SystemExit(f'no chapter {c} in script.txt')
    voices = dict(VOICES); standin = dict(kv.split('=') for kv in a.standin.split(',') if kv.strip())
    voices.update(standin)
    redo = {}
    for r in a.redo.split(','):
        if r.strip():
            c, n = r.split(':'); redo.setdefault(int(c), set()).add(int(n))
    take = o / 'audio/qwen' / a.take; clips, raw = take / 'clips', take / 'clips_raw'
    clips.mkdir(parents=True, exist_ok=True); raw.mkdir(exist_ok=True)
    tmp = take / '.tmp'; tmp.mkdir(exist_ok=True)
    logf = open(take / 'gen.log', 'a', encoding='utf-8')
    def log(msg):
        logf.write(f'{time.strftime("%H:%M:%S")} {msg}\n'); logf.flush(); print(msg, flush=True)
    log(f'=== narrate_multi chapters {want} take {a.take} standin {standin or "-"}')

    # 1. which clips are missing / to redo
    jobs = []
    for c in want:
        lines = [it for it in chs[c]['items'] if it['kind'] == 'line']
        if a.max_lines:
            lines = lines[:a.max_lines]
        for idx, it in enumerate(lines, 1):
            v = voices[it['speaker']]
            if not (V / f'{v}.wav').is_file():
                if a.gen_only:
                    log(f'  skip ch{c}:{idx} {it["speaker"]}: no sample {v}.wav yet'); continue
                raise SystemExit(f'voice sample assets/audio/voices/{v}.wav missing (speaker {it["speaker"]}); wait for it or pass --standin {it["speaker"]}=brittney')
            it['voice'], it['name'] = v, clip_name(v, it['text'])
            if idx in redo.get(c, set()) or not (clips / f'{it["name"]}.wav').is_file():
                if not any(j['name'] == it['name'] for j in jobs):
                    jobs.append(dict(it, ch=c, idx=idx, redo=idx in redo.get(c, set())))
    if jobs and a.no_gen:
        raise SystemExit('missing clips: ' + ', '.join(f'ch{j["ch"]}:{j["idx"]}' for j in jobs))
    # 2. generate (one model load for every voice)
    t0 = time.time()
    if jobs:
        log(f'generating {len(jobs)} clips (~30 s each on 4 cores)')
        tts = TTS(log)
        for k, j in enumerate(jobs, 1):
            side = clips / f'{j["name"]}.json'; meta = json.loads(side.read_text()) if side.is_file() else {}
            attempt = meta.get('attempt', -1) + 1 if j['redo'] else 0
            seed = a.seed + int(j['name'][:6], 16) % 100000 + 1000 * attempt
            t1 = time.time(); y, sr = tts.gen(j['voice'], j['text'], seed)
            for _ in range(3):  # a runaway take (far longer than the words need) gets the next seed
                if len(y) / sr <= 2.5 + 0.75 * len(norm(j['text'])):
                    break
                log(f'  runaway take {len(y)/sr:.1f}s, new seed'); attempt += 1; seed += 1000; y, sr = tts.gen(j['voice'], j['text'], seed)
            if sr != SR:
                import librosa; y = librosa.resample(y, orig_sr=sr, target_sr=SR); sr = SR
            sf.write(raw / f'{j["name"]}.wav', y, sr, subtype='PCM_16')
            sf.write(clips / f'{j["name"]}.wav', tighten(sf.read(raw / f'{j["name"]}.wav', dtype='float32')[0], sr), sr, subtype='PCM_16')
            side.write_text(json.dumps({'voice': j['voice'], 'text': j['text'], 'seed': seed, 'attempt': attempt,
                                        'model': 'Qwen3-TTS-12Hz-1.7B-Base'}, indent=1))
            log(f'  [{k}/{len(jobs)}] ch{j["ch"]}:{j["idx"]} {j["speaker"]} {len(y)/sr:.1f}s in {time.time()-t1:.0f}s seed {seed}: {j["text"]}')
        del tts
    gen_min = (time.time() - t0) / 60
    if a.gen_only:
        log(f'generated {len(jobs)} clips in {gen_min:.1f} min'); return

    # 3. per chapter: transcribe clips (cached in the sidecar), effect, join, time, check
    wh = None; out_root = o / ('audio/chapters-standin' if standin else 'audio/chapters'); summary = []
    for c in want:
        items = chs[c]['items']; spoken = [it for it in items if it['kind'] == 'line']
        if a.max_lines:
            keep = spoken[a.max_lines - 1] if len(spoken) >= a.max_lines else spoken[-1]
            items = items[:items.index(keep) + 1]
        parts, pos, lines_out, actions, caps, report = [], 0.0, [], [], [], []
        pending, scene, idx, first = 0.0, False, 0, True
        rng = np.random.default_rng(c)
        tone = lambda sec: (rng.standard_normal(int(round(sec * SR))) * 10 ** (-72 / 20)).astype(np.float32)
        for it in items:
            if it['kind'] == 'action':
                actions.append({'after_line': idx, 'at': round(pos, 3), 'pause': it['pause'], 'scene_change': it['scene_change'], 'text': it['text']})
                pending += it['pause']; scene |= it['scene_change']; continue
            idx += 1; name = it['name']
            y, sr = sf.read(clips / f'{name}.wav', dtype='float32')
            side = clips / f'{name}.json'; meta = json.loads(side.read_text()) if side.is_file() else {}
            md5 = hashlib.md5(y.tobytes()).hexdigest()
            if meta.get('words_md5') != md5 or meta.get('whisper') != a.whisper:
                if wh is None:
                    log(f'loading faster-whisper {a.whisper}'); wh = Whisper(a.whisper)
                meta.update(words=wh.words(y, sr), words_md5=md5, whisper=a.whisper)
                meta.setdefault('voice', it['voice']); meta.setdefault('text', it['text']); side.write_text(json.dumps(meta, indent=1))
            words = meta['words']
            if first:  # the chapter's first word lands on 0.0 s
                import librosa
                iv = librosa.effects.split(y, top_db=35, frame_length=1024, hop_length=128); cut = int(iv[0][0]) if len(iv) else 0
                y = y[cut:]; sh = cut / sr
                words = [dict(w, start=max(0.0, w['start'] - sh), end=max(0.0, w['end'] - sh)) for w in words]
            gap = 0.0 if first else (SCENE_GAP if scene else GAP)
            gap += pending
            if gap:
                parts.append(tone(gap)); pos += len(parts[-1]) / SR
            for ac in actions:
                if ac['after_line'] == idx - 1 and 'until' not in ac:
                    ac['until'] = round(pos, 3)
            y = effect(level(y), sr, it['note'], tmp)
            speech_len = len(sf.read(clips / f'{name}.wav')[0]) / sr - (sh if first else 0)
            start, end = pos, pos + speech_len
            ws, bad = align(it['text'], words, start, end)
            for w in ws:
                caps.append(dict(w, speaker=it['speaker'], line=idx))
            for s_, h_ in bad:
                report.append(f'  ch{c}:{idx} {it["speaker"]}: script "{s_}" / heard "{h_}"')
            secs = speech_len; wps = len(norm(it['text'])) / max(secs, 0.1)
            if len(norm(it['text'])) >= 4 and (wps < 1.3 or wps > 4.8):
                report.append(f'  ch{c}:{idx} {it["speaker"]}: {secs:.1f}s for {len(norm(it["text"]))} words, odd pace (listen; --redo {c}:{idx})')
            lines_out.append({'index': idx, 'speaker': it['speaker'], 'voice': it['voice'], 'note': it['note'] or None, 'text': it['text'],
                              'start': round(start, 3), 'end': round(end, 3), 'clip': f'audio/qwen/{a.take}/clips/{name}.wav',
                              'seed': meta.get('seed')})
            parts.append(y); pos += len(y) / SR  # a ghost tail can run past `end`
            pending, scene, first = 0.0, False, False
        for ac in actions:
            ac.setdefault('until', round(pos, 3))
        parts.append(tone(TAIL)); full = np.concatenate(parts); dur = len(full) / SR
        od = out_root / f'ch{c:02d}'; od.mkdir(parents=True, exist_ok=True)
        sf.write(od / 'narration.wav', full, SR, subtype='PCM_16')
        (od / 'captions.json').write_text(json.dumps({'chapter': c, 'duration': round(dur, 3), 'words': caps}, indent=1), encoding='utf-8')
        (od / 'lines.json').write_text(json.dumps({'chapter': c, 'header': chs[c]['header'], 'duration': round(dur, 3), 'sample_rate': SR,
                                                   'take': a.take, 'standin': standin or None, 'lines': lines_out, 'actions': actions}, indent=1), encoding='utf-8')
        summary.append(f'CH{c:02d}: {len(lines_out)} lines, {dur:.1f}s -> {od.relative_to(o)}')
        summary.append('  CHECK clean: every script word heard' if not report else '  CHECK (whisper mishears names and shouts; redo only lines that sound wrong):')
        summary += report
    shutil.rmtree(tmp, ignore_errors=True)
    log(f'NARRATION_READY generated {len(jobs)} clips in {gen_min:.1f} min')
    for s in summary:
        log(s)


if __name__ == '__main__':
    main()
