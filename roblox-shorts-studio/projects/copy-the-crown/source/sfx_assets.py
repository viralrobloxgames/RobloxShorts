"""This short's effects in audio/sfx/: copied from Say Their Name (pop, whoosh, fwoomp, hiss, boing, chime, coins, fanfare;
see that project's source/sfx_assets.py for where each comes from).

  python3 source/sfx_assets.py
"""
import shutil
from pathlib import Path
P = Path(__file__).resolve().parent.parent
O = P / 'audio/sfx'; O.mkdir(parents=True, exist_ok=True)
for n in ('pop', 'whoosh', 'fwoomp', 'hiss', 'boing', 'chime', 'coins', 'fanfare'):
    shutil.copy(P.parent / 'say-their-name/audio/sfx' / f'{n}.wav', O)
print('sfx ->', O)
