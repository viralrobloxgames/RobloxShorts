"""ElevenLabs API route: voice discovery and ONE billed narration request with word timings.

python voice.py voices [--search George]
python voice.py select <voice_id>
python voice.py generate <project> [--take take-01]

The default route is the connected ElevenLabs tools / signed-in website (see references/voice-and-audio.md).
This helper only generates when settings "elevenlabs_mode" is "api". It uses ELEVENLABS_API_KEY from the
environment or OS keyring, never a key in a file or chat.
"""
from pathlib import Path
import argparse, base64, json, hashlib, shutil, sys, time, urllib.request, urllib.parse, urllib.error
sys.path.insert(0, str(Path(__file__).resolve().parent))
from settings import load, save, secret
from timings import write_alignment

BASE = 'https://api.elevenlabs.io'
DEFAULT_SETTINGS = {'speed': 1.0, 'stability': 0.5, 'similarity_boost': 0.75, 'style': 0, 'use_speaker_boost': True}


def request(path, body=None):
    headers = {'xi-api-key': secret('ELEVENLABS_API_KEY')}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read()), r.headers.get('request-id')
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'ElevenLabs returned HTTP {e.code}. Check account permissions, credits and voice access. No retry was made.') from None


def alignment_words(data):
    a = data.get('alignment') or data.get('normalized_alignment')
    if not a:
        raise ValueError('ElevenLabs returned no alignment. Keep the audio and run transcribe.py instead of generating again.')
    chars, starts, ends = a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']
    words = []; text = ''; start = None; end = 0
    for c, ts, te in zip(chars, starts, ends):
        if c.isspace():
            if text:
                words.append({'word': text, 'start': start, 'end': end}); text = ''; start = None
        else:
            if start is None:
                start = ts
            text += c; end = te
    if text:
        words.append({'word': text, 'start': start, 'end': end})
    return words


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = p.add_subparsers(dest='cmd', required=True)
    q = sp.add_parser('voices'); q.add_argument('--search', default='George')
    q = sp.add_parser('select'); q.add_argument('voice_id')
    q = sp.add_parser('generate'); q.add_argument('project'); q.add_argument('--take', default='take-01'); q.add_argument('--max-characters', type=int, default=1600)
    a = p.parse_args(); cfg = load()
    if a.cmd == 'voices':
        d, _ = request('/v2/voices?' + urllib.parse.urlencode({'search': a.search, 'page_size': 100}))
        print(json.dumps([{'voice_id': v['voice_id'], 'name': v['name'], 'labels': v.get('labels', {})} for v in d['voices']], indent=2)); return
    if a.cmd == 'select':
        d, _ = request('/v1/voices/' + urllib.parse.quote(a.voice_id, safe=''))
        save({'voice_id': d['voice_id'], 'voice_name': d['name']}); print('VOICE_SELECTED', d['name']); return
    if cfg.get('elevenlabs_mode') != 'api':
        raise SystemExit('Settings use the ElevenLabs connector/website. Generate there, save the MP3 in audio/, then run transcribe.py. Set "elevenlabs_mode": "api" to use this helper.')
    if not cfg.get('voice_id'):
        raise SystemExit('Select a voice first; voice IDs are account-dependent.')
    o = Path(a.project).resolve(); script = (o / 'script.txt').read_text(encoding='utf-8').strip()
    if not 1 <= len(script) <= a.max_characters:
        raise SystemExit(f'Script has {len(script)} characters; limit is {a.max_characters}.')
    if Path(a.take).name != a.take or a.take in ('.', '..'):
        raise SystemExit('Take name must be a plain folder name.')
    model = cfg.get('voice_model', 'eleven_multilingual_v2'); vs = dict(DEFAULT_SETTINGS, **cfg.get('voice_settings', {}))
    take = o / 'audio/takes' / a.take; take.mkdir(parents=True, exist_ok=True); state = take / 'request.json'
    fingerprint = hashlib.sha256(json.dumps({'script': script, 'voice': cfg['voice_id'], 'model': model, 'settings': vs}, sort_keys=True).encode()).hexdigest()
    if state.exists():
        old = json.loads(state.read_text(encoding='utf-8'))
        if old.get('fingerprint') != fingerprint:
            raise SystemExit('This take belongs to a different request. Use a new take name for a revision.')
        if old.get('status') == 'completed':
            print('REUSING_COMPLETED_TAKE', take); return
        raise SystemExit('This take has an unresolved request. Check ElevenLabs History and recover it before generating again.')
    record = {'fingerprint': fingerprint, 'status': 'request_started', 'voice_id': cfg['voice_id'], 'voice_name': cfg.get('voice_name'), 'model': model,
              'settings': vs, 'characters': len(script), 'started_at': time.time()}
    state.write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(f'Generating {len(script)} characters in {cfg.get("voice_name", "the selected voice")}; one billed request.', flush=True)
    try:
        d, request_id = request('/v1/text-to-speech/' + urllib.parse.quote(cfg['voice_id'], safe='') + '/with-timestamps?output_format=mp3_44100_128',
                                {'text': script, 'model_id': model, 'voice_settings': vs})
        (take / 'narration.mp3').write_bytes(base64.b64decode(d['audio_base64']))
        (take / 'alignment.json').write_text(json.dumps({k: v for k, v in d.items() if k != 'audio_base64'}), encoding='utf-8')
        record.update(status='completed', request_id=request_id); state.write_text(json.dumps(record, indent=2), encoding='utf-8')
    except Exception:
        record['status'] = 'needs_recovery'; state.write_text(json.dumps(record, indent=2), encoding='utf-8'); raise
    words = alignment_words(d)
    duration = max(w['end'] for w in words)
    shutil.copy2(take / 'narration.mp3', o / 'audio/narration.mp3')
    write_alignment(o / 'audio/alignment', {'source': f'takes/{a.take}/narration.mp3', 'provider': 'elevenlabs-with-timestamps', 'words': words}, words, duration)
    (o / 'audio/narration-source.json').write_text(json.dumps({'voice': cfg.get('voice_name'), 'voice_id': cfg['voice_id'], 'model': model, 'settings': vs,
                                                              'take': a.take, 'request_id': request_id, 'speech_end_seconds': duration}, indent=2), encoding='utf-8')
    print('NARRATION_READY', o / 'audio/narration.mp3', f'speech ends {duration:.2f}s')


if __name__ == '__main__':
    main()
