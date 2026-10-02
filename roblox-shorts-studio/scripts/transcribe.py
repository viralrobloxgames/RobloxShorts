"""Measure real word timings from finished narration with local faster-whisper (CPU).

python transcribe.py <audio> --output <project>/audio/alignment [--model <name-or-folder>] [--force]

Run it with the Python that has faster-whisper installed (settings key "transcription_python").
If "ctranslate2_compat" is set, that folder is put first on sys.path. On the original laptop,
CTranslate2 4.8.2 crashes, so a 4.6.0 copy is used instead.
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from settings import load
from timings import write_alignment


def join_brand(words):
    """Whisper hears the channel name as two words: 'Viral Roblox' -> 'ViralRoblox', '... Games' -> 'ViralRobloxGames'."""
    out = []
    for w in words:
        prev = out[-1]['word'].strip() if out else ''
        cur = w['word'].strip()
        if (prev == 'Viral' and cur.startswith('Roblox')) or (prev == 'ViralRoblox' and cur.lower().startswith('games')):
            out[-1].update(word=out[-1]['word'] + (cur[:6].capitalize() + cur[6:] if prev == 'Viral' else 'G' + cur[1:]), end=w['end'])
        else:
            out.append(w)
    return out


def main():
    cfg = load()
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('audio', type=Path); p.add_argument('--output', type=Path, required=True)
    p.add_argument('--model', default=cfg.get('transcription_model') or 'small.en'); p.add_argument('--language', default='en')
    p.add_argument('--force', action='store_true'); a = p.parse_args()
    if (a.output / 'captions.json').exists() and not a.force:
        raise FileExistsError('Timings already exist; pass --force to replace them.')
    if not a.audio.is_file():
        raise FileNotFoundError(a.audio)
    compat = cfg.get('ctranslate2_compat')
    if compat and Path(compat).is_dir():
        sys.path.insert(0, compat)
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise RuntimeError('faster-whisper is missing. Run with settings "transcription_python", or: python -m pip install faster-whisper')
    model = WhisperModel(a.model, device='cpu', compute_type='int8')
    segments, info = model.transcribe(str(a.audio), language=a.language, word_timestamps=True, beam_size=5)
    result = {'source': a.audio.name, 'duration': info.duration, 'segments': []}; words = []
    for seg in segments:
        timed = join_brand([{'start': w.start, 'end': w.end, 'word': w.word} for w in seg.words or []])
        result['segments'].append({'start': seg.start, 'end': seg.end, 'text': seg.text, 'words': timed}); words.extend(timed)
    write_alignment(a.output, result, words, info.duration)
    print('Timings ready. Check the words against the recording and script: ' + str(a.output))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print('ERROR: ' + str(exc), file=sys.stderr); sys.exit(1)
