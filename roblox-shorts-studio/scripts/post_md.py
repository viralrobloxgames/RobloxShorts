"""Write delivery/<Title>_post.md: the copy-ready TikTok and YouTube text for a video, next to the MP4.

python3 scripts/post_md.py projects/<slug> [projects/<slug> ...]

Reads delivery/post.json (the source of truth that publish.py posts) and renders it as a short Markdown sheet the
user can copy from by hand: caption, title, description, tags and the settings to tick on each platform. Run it
whenever post.json is written or changed; publish.py and finish.py --encode also run it.
"""
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(__file__).resolve().parent.parent


def seconds(mp4):
    v = mp4.with_name(mp4.stem + '.validation.json')
    if v.exists(): return json.loads(v.read_text())['seconds']
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(mp4)],
                             capture_output=True, text=True, check=True).stdout
        return float(out)
    except Exception:
        return None


def block(text):
    return '```\n' + text.strip() + '\n```'


def write(project):
    P = Path(project).resolve(); d = P / 'delivery'
    post_file = d / 'post.json'
    if not post_file.exists(): return None
    post = json.loads(post_file.read_text(encoding='utf-8'))
    meta = json.loads((P / 'source/project.json').read_text(encoding='utf-8')) if (P / 'source/project.json').exists() else {}
    stem = re.sub(r'[^A-Za-z0-9]+', '_', meta.get('title', '')).strip('_')     # same naming as finish.py / publish.py
    mp4 = d / f'{stem}.mp4'
    if not stem or not mp4.exists(): return None
    pub = json.loads((d / 'published.json').read_text()) if (d / 'published.json').exists() else {}
    status = lambda k: (pub.get(k) or {}).get('status', 'not posted')
    secs = seconds(mp4)
    t, y = post.get('tiktok', {}), post.get('youtube', {})
    L = [f"# {meta.get('title', stem.replace('_', ' '))}: post text", '',
         f"- Video: `{mp4.name}`" + (f" ({secs:.1f} s)" if secs else ''),
         f"- Cover: `{stem}_cover.jpg`",
         f"- TikTok: **{status('tiktok')}** · YouTube: **{status('youtube')}**",
         '- Post only after the video is approved: TikTok first, then YouTube Shorts.', '']
    if t:
        L += ['## TikTok', '', 'Caption:', '', block(t['caption']), '',
              f"Settings: who can watch **{'Everyone' if t.get('privacy') == 'PUBLIC_TO_EVERYONE' else t.get('privacy')}**; "
              f"AI-generated content label **{'on' if t.get('ai_generated') else 'off'}**; comments "
              f"{'on' if t.get('allow_comments', True) else 'off'}, duet {'on' if t.get('allow_duet', True) else 'off'}, "
              f"stitch {'on' if t.get('allow_stitch', True) else 'off'}. Cover: upload `{stem}_cover.jpg` (or pick the last frame of "
              f"`{stem}_upload.mp4`).", '']
    if y:
        L += ['## YouTube Shorts', '', 'Title:', '', block(y['title']), '', 'Description:', '', block(y['description']), '',
              'Tags:', '', block(', '.join(y.get('tags', []))), '',
              f"Settings: visibility **{y.get('privacy', 'public').capitalize()}**; made for kids **{'Yes' if y.get('made_for_kids') else 'No'}**; "
              f"altered or synthetic content **{'Yes' if y.get('contains_synthetic_media') else 'No'}**; category **"
              f"{'Gaming' if str(y.get('category_id')) == '20' else y.get('category_id')}**. Thumbnail: `{stem}_cover.jpg`; in Studio set "
              'the Shorts frame to the last frame (Thumbnail, Select from video).', '']
    out = d / f'{stem}_post.md'
    out.write_text('\n'.join(L), encoding='utf-8')
    return out


if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    for a in sys.argv[1:]:
        o = write(a)
        print(o.relative_to(ROOT) if o else f'{a}: no delivery/post.json or MP4, skipped')
