"""Put the cover inside the delivered video: delivery/<Title>.mp4 ends with <Title>_cover.png held for 0.5 s.

python3 scripts/add_cover_frame.py projects/<slug> [...]

TikTok and the YouTube Shorts shelf both show a frame of the video as its cover, so the cover lives in the video's
last 0.5 s (after the end card) and the user picks that frame on both apps: nothing to upload separately. New videos
get it from finish.py --encode (the cover frames are added before encoding); this script is for videos that were
already encoded. It re-encodes once (crf 16), rewrites <Title>.validation.json and records "cover_frames" there, so
running it twice does nothing. Don't run it on a video that is already posted.
"""
from pathlib import Path
import hashlib, json, re, subprocess, sys

FPS, HOLD = 30, 15          # 15 frames = 0.5 s


def stem_of(P):
    meta = json.loads((P / 'source/project.json').read_text(encoding='utf-8'))
    return re.sub(r'[^A-Za-z0-9]+', '_', meta['title']).strip('_')


def probe(f):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(f)], text=True)
    return json.loads(out)


def validate(mp4, cover_frames, captions=True):
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(mp4), '-f', 'null', '-'], check=True)
    pr = probe(mp4); v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
    n = int(v.get('nb_frames', 0))
    report = {'file': mp4.name, 'sha256': hashlib.sha256(mp4.read_bytes()).hexdigest(), 'fully_decoded': True, 'frame_count': n,
              'fps': FPS, 'width': v['width'], 'height': v['height'], 'seconds': n / FPS,
              'audio': any(s['codec_type'] == 'audio' for s in pr['streams']), 'captions': captions, 'cover_frames': cover_frames}
    mp4.with_suffix('.validation.json').write_text(json.dumps(report, indent=2))
    return report


def add(project):
    P = Path(project).resolve(); d = P / 'delivery'; stem = stem_of(P)
    mp4, cover = d / f'{stem}.mp4', d / f'{stem}_cover.png'
    if not cover.exists(): cover = d / f'{stem}_cover.jpg'
    val = mp4.with_suffix('.validation.json')
    if val.exists() and json.loads(val.read_text()).get('cover_frames'):
        return f'{mp4.name}: cover already in the video'
    if (d / 'published.json').exists():
        return f'{mp4.name}: already posted or scheduled, left alone'
    if not mp4.exists() or not cover.exists(): return f'{P.name}: no MP4 or cover, skipped'
    tmp = mp4.with_name(stem + '_withcover.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-loop', '1', '-framerate', str(FPS), '-t', str(HOLD / FPS), '-i', str(cover),
                    '-f', 'lavfi', '-t', str(HOLD / FPS), '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex',
                    f'[0:v]fps={FPS},format=yuv420p,setsar=1[v0];[1:v]scale=1080:1920,fps={FPS},format=yuv420p,setsar=1[v1];'
                    '[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[v0][a0][v1][2:a]concat=n=2:v=1:a=1[v][a]',
                    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(tmp)], check=True)
    tmp.replace(mp4)
    r = validate(mp4, HOLD)
    return f'{mp4.name}: cover added as the last {HOLD / FPS:.1f} s ({r["seconds"]:.2f} s, {r["frame_count"]} frames)'


if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    for a in sys.argv[1:]: print(add(a))
