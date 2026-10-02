# Voice-clone comparison: models x reference setups, same lines; scored against held-out real George (Part 1).
import json, sys, time, numpy as np, librosa, soundfile as sf, torch
from pathlib import Path
from qwen_tts import Qwen3TTSModel
from resemblyzer import VoiceEncoder, preprocess_wav
G = Path('/tmp/claude-0/george'); OUT = Path('/tmp/claude-0/qwen/exp'); OUT.mkdir(exist_ok=True)
ROOT = Path('/home/user/RobloxShorts/roblox-shorts-studio')
S = json.load(open(G / 'sentences.json'))
held = [m for m in S if m['project'] == 'admin-for-one-round']                       # never used as a reference
pool = [m for m in S if m['project'] != 'admin-for-one-round' and m['end'] - m['start'] >= 1.4]
EVAL = [held[i] for i in (4, 9, 15)]                                                 # same text George really said
AUD = ['The noob got admin for one round. One minute.', "Mia hadn't moved. Not once. The whole round.", "The noob was Mia's alt account."]
enc = VoiceEncoder('cpu')
real = np.mean([enc.embed_utterance(preprocess_wav(m['file'])) for m in held], 0); real /= np.linalg.norm(real)
def sim(path): e = enc.embed_utterance(preprocess_wav(str(path))); return float(np.dot(e / np.linalg.norm(e), real))
def f0(path):
    y, sr = librosa.load(str(path), sr=16000); f, v, _ = librosa.pyin(y, fmin=60, fmax=300, sr=sr, frame_length=1024); return float(np.median(f[v]))
print('real George held-out clips: sim', round(np.mean([sim(m['file']) for m in EVAL]), 3), 'f0', round(np.mean([f0(m['file']) for m in EVAL]), 1), flush=True)
torch.set_num_threads(4)
res = {}
for size in sys.argv[1].split(','):
    m = Qwen3TTSModel.from_pretrained(f'Qwen/Qwen3-TTS-12Hz-{size}-Base', device_map='cpu', dtype=torch.float32)
    short = m.create_voice_clone_prompt(ref_audio=str(ROOT / 'assets/audio/voices/george.wav'), ref_text=(ROOT / 'assets/audio/voices/george.txt').read_text().strip())[0]
    long_ = m.create_voice_clone_prompt(ref_audio=str(G / 'ref_long.wav'), ref_text=(G / 'ref_long.txt').read_text().strip())[0]
    sr_enc = m.model.speaker_encoder_sample_rate
    embs = [m.model.extract_speaker_embedding(audio=librosa.load(p['file'], sr=sr_enc)[0], sr=sr_enc) for p in pool]
    avg = torch.stack(embs).mean(0); avg = avg * (torch.stack([e.norm() for e in embs]).mean() / avg.norm())
    import dataclasses
    setups = {'short': short, 'long': long_, 'long+avg': dataclasses.replace(long_, ref_spk_embedding=avg.to(long_.ref_spk_embedding.dtype)), 'short+avg': dataclasses.replace(short, ref_spk_embedding=avg.to(short.ref_spk_embedding.dtype))}
    for name, pr in setups.items():
        key = f'{size}_{name}'; sims, fs, rate = [], [], []; t0 = time.time()
        for j, txt in enumerate([e['text'] for e in EVAL] + AUD):
            torch.manual_seed(77 + j)
            w, sr = m.generate_voice_clone(text=txt, language='English', voice_clone_prompt=[pr])
            f = OUT / f'{key}_{j}.wav'; sf.write(f, w[0], sr)
            if j < len(EVAL): sims.append(sim(f)); fs.append(f0(f)); rate.append((len(w[0]) / sr) / (EVAL[j]['end'] - EVAL[j]['start']))
        res[key] = dict(sim=round(np.mean(sims), 3), f0=round(np.mean(fs), 1), length_vs_real=round(np.mean(rate), 2), secs=round(time.time() - t0))
        print(key, res[key], flush=True)
    del m
json.dump(res, open(OUT / f'scores_{sys.argv[1]}.json', 'w'), indent=1)
