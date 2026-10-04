"""Cloud generator for any saved clone voice (see references/voice-and-audio.md): Qwen3-TTS 1.7B-Base, ICL sample =
assets/audio/voices/<voice>.wav with its transcript <voice>.txt; speaker embedding = <voice>_1.7B_xvector.npy if present,
else the sample's own. Writes clips into scripts/narrate.py's cache (audio/qwen/<take>/clips/<sha1('<voice>|'+text)[:12]>.wav),
so `python3 scripts/narrate.py <project> --voice <voice> --take <take>` then joins, times and checks them.
(George voice C keeps its own script, qwen_cloud_george_c.py, whose x-vector is a mean over many sentences.)"""
import time, hashlib, argparse, dataclasses, numpy as np, soundfile as sf, torch
from pathlib import Path
from qwen_tts import Qwen3TTSModel
ROOT = Path(__file__).resolve().parent.parent; V = ROOT / 'assets/audio/voices'
ap = argparse.ArgumentParser(); ap.add_argument('project'); ap.add_argument('--voice', required=True); ap.add_argument('--take', default='take-01')
ap.add_argument('--redo', default=''); ap.add_argument('--seed', type=int, default=77)
a = ap.parse_args(); o = ROOT / a.project
lines = [l.strip() for l in (o / 'script.txt').read_text(encoding='utf-8-sig').splitlines() if l.strip()]
clips = o / 'audio/qwen' / a.take / 'clips'; clips.mkdir(parents=True, exist_ok=True)
name = lambda t: hashlib.sha1(f'{a.voice}|{t}'.encode()).hexdigest()[:12] + '.wav'
redo = {int(n) for n in a.redo.split(',') if n.strip()}
todo = [i for i, t in enumerate(lines) if i + 1 in redo or not (clips / name(t)).is_file()]
torch.set_num_threads(4)
m = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cpu', dtype=torch.float32)
pr = m.create_voice_clone_prompt(ref_audio=str(V / f'{a.voice}.wav'), ref_text=(V / f'{a.voice}.txt').read_text().strip())[0]
emb = V / f'{a.voice}_1.7B_xvector.npy'
if emb.is_file(): pr = dataclasses.replace(pr, ref_spk_embedding=torch.from_numpy(np.load(emb)).to(pr.ref_spk_embedding.dtype))
for i in todo:
    torch.manual_seed(a.seed + i + (1000 if i + 1 in redo else 0)); t1 = time.time()
    w, sr = m.generate_voice_clone(text=lines[i], language='English', voice_clone_prompt=[pr])
    sf.write(clips / name(lines[i]), w[0], sr)
    print(f'line {i+1}/{len(lines)} {len(w[0])/sr:.1f}s in {time.time()-t1:.0f}s: {lines[i]}', flush=True)
