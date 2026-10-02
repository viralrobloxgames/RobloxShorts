"""Cloud generator for George voice C (see references/voice-and-audio.md). Voice C ('george_c'): Qwen3-TTS 1.7B-Base, ICL sample = first 20.8 s of Part 3's ElevenLabs George narration,
speaker embedding = mean x-vector over every clean George sentence (>= 1.4 s) from Parts 1-3 and The AFK Millionaire.
Writes clips into scripts/narrate.py's cache (audio/qwen/<take>/clips/<sha1('george_c|'+text)[:12]>.wav)."""
import sys, time, json, hashlib, argparse, dataclasses, numpy as np, librosa, soundfile as sf, torch
from pathlib import Path
from qwen_tts import Qwen3TTSModel
ROOT = Path(__file__).resolve().parent.parent; V = ROOT / 'assets/audio/voices'
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--take', default='take-02'); ap.add_argument('--redo', default=''); ap.add_argument('--seed', type=int, default=77)
a = ap.parse_args(); o = ROOT / a.project
lines = [l.strip() for l in (o / 'script.txt').read_text(encoding='utf-8-sig').splitlines() if l.strip()]
clips = o / 'audio/qwen' / a.take / 'clips'; clips.mkdir(parents=True, exist_ok=True)
name = lambda t: hashlib.sha1(f'george_c|{t}'.encode()).hexdigest()[:12] + '.wav'
redo = {int(n) for n in a.redo.split(',') if n.strip()}
todo = [i for i, t in enumerate(lines) if i + 1 in redo or not (clips / name(t)).is_file()]
torch.set_num_threads(4)
m = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cpu', dtype=torch.float32)
pr = m.create_voice_clone_prompt(ref_audio=str(V / 'george_c.wav'), ref_text=(V / 'george_c.txt').read_text().strip())[0]
emb = V / 'george_c_1.7B_xvector.npy'
if not emb.is_file():
    S = json.load(open(V / 'george_c_sentences.json')); sr_enc = m.model.speaker_encoder_sample_rate
    clip = lambda p: librosa.load(str(ROOT / p['source']), sr=sr_enc, offset=p['start'], duration=p['end'] - p['start'])[0]
    embs = [m.model.extract_speaker_embedding(audio=clip(p), sr=sr_enc) for p in S if p['end'] - p['start'] >= 1.4]
    avg = torch.stack(embs).mean(0); avg = avg * (torch.stack([e.norm() for e in embs]).mean() / avg.norm())
    np.save(emb, avg.float().numpy()); print('x-vector from', len(embs), 'sentences', flush=True)
pr = dataclasses.replace(pr, ref_spk_embedding=torch.from_numpy(np.load(emb)).to(pr.ref_spk_embedding.dtype))
for i in todo:
    torch.manual_seed(a.seed + i + (1000 if i + 1 in redo else 0)); t1 = time.time()
    w, sr = m.generate_voice_clone(text=lines[i], language='English', voice_clone_prompt=[pr])
    sf.write(clips / name(lines[i]), w[0], sr)
    print(f'line {i+1}/{len(lines)} {len(w[0])/sr:.1f}s in {time.time()-t1:.0f}s: {lines[i]}', flush=True)
