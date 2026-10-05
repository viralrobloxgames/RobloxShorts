"""Builds audio/sfx/ for The Postman's Palace by copying sounds made for earlier projects (all original or synthesized
there): thud, pop, whoosh, chime, fanfare, applause, flutter, clang and hangar_roll (The Tornado Came Back), crickets,
boing, coins, bonk and shake (other projects), and footstep, night_bed and desk_bell (the horror library).

  python3 source/make_sfx.py      # from the project dir"""
import shutil
from pathlib import Path
P = Path(__file__).resolve().parent.parent; ROOT = P.parent.parent; OUT = P / 'audio/sfx'; OUT.mkdir(parents=True, exist_ok=True)
for n in ('thud', 'pop', 'whoosh', 'chime', 'fanfare', 'applause', 'flutter', 'clang', 'hangar_roll'):
    src = ROOT / 'projects/the-tornado-came-back/audio/sfx' / f'{n}.wav'
    if src.is_file(): shutil.copy2(src, OUT / f'{n}.wav')
for n in ('crickets', 'boing', 'coins', 'bonk', 'shake'):
    src = next(iter(sorted((ROOT / 'projects').glob(f'*/audio/sfx/{n}.wav'))), None)
    if src: shutil.copy2(src, OUT / f'{n}.wav')
for n in ('footstep', 'night_bed', 'desk_bell'): shutil.copy2(ROOT / 'assets/audio/horror' / f'{n}.wav', OUT / f'{n}.wav')
print('sfx:', ', '.join(sorted(p.stem for p in OUT.glob('*.wav'))))
