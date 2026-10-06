"""Builds audio/sfx/ for He Sold The Eiffel Tower: copies sounds made for earlier projects (all original or synthesized
there) and synthesizes two new ones here: a steam-train whistle and a police whistle trill.

  python3 source/make_sfx.py      # from the project dir"""
import shutil, wave
from pathlib import Path
import numpy as np
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
for n in ('thud', 'pop', 'whoosh', 'chime', 'flutter', 'coins', 'typewriter', 'ring', 'horn', 'hiss', 'waves', 'crowd', 'footstep', 'crickets',
          'bonk', 'clang', 'desk_bell', 'boing', 'squeak', 'fanfare', 'shake', 'glass'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{n}.wav'))), None) or (ROOT / 'assets/audio/horror' / f'{n}.wav')
    if src and src.is_file(): shutil.copy2(src, OUT / f'{n}.wav')
SR = 44100
def save(name, x):
    x = np.clip(x / (np.abs(x).max() + 1e-9) * 0.8, -1, 1); y = (x * 32767).astype(np.int16)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
t = np.arange(int(SR * 1.6)) / SR
env = np.minimum(1, t / 0.08) * np.minimum(1, (1.6 - t) / 0.35)
ch = sum(np.sin(2 * np.pi * f * (1 + 0.004 * np.sin(2 * np.pi * 5 * t)) * t) / (i + 1) for i, f in enumerate((440, 554, 659)))   # A major chord whistle
noise = np.random.default_rng(3).normal(0, 0.15, t.size)
save('train_whistle', (ch + noise) * env)
t = np.arange(int(SR * 0.9)) / SR
trill = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 24 * t))
save('police_whistle', np.sin(2 * np.pi * (2900 + 120 * np.sin(2 * np.pi * 24 * t)) * t) * trill * np.minimum(1, t / 0.02) * np.minimum(1, (0.9 - t) / 0.1))
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
