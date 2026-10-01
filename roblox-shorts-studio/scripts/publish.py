"""Post an approved, finished Short: TikTok first, then YouTube Shorts straight after.

  python3 scripts/publish.py <project>                  preview: checks everything, shows what would be posted, no network
  python3 scripts/publish.py <project> --approve        record that the user approved THIS exact MP4 (by sha256)
  python3 scripts/publish.py <project> --post           post it: TikTok, then YouTube   [--only tiktok|youtube]
                                                        [--tiktok-mode direct|draft]   draft = lands in the TikTok app's inbox

Only run --approve when the user has watched the video and said, in so many words, that it can go out.
Credentials come from environment variables only (the cloud environment's settings), never from files or chat:
  TIKTOK_CLIENT_KEY  TIKTOK_CLIENT_SECRET  TIKTOK_REFRESH_TOKEN
  YOUTUBE_CLIENT_ID  YOUTUBE_CLIENT_SECRET  YOUTUBE_REFRESH_TOKEN
Metadata: delivery/post.json (see references/publishing.md). Record: delivery/published.json; a platform that is
already marked posted for this MP4 is skipped, so re-running after a failure only does what is left.

TikTok's API can't take a cover image, only a cover frame, so the TikTok copy (delivery/<Title>_tiktok.mp4) has the
cover appended as its last 0.1 s and that frame is picked as the cover. YouTube gets the cover via thumbnails.set.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, subprocess, time
import requests

ROOT = Path(__file__).resolve().parent.parent
TT = 'https://open.tiktokapis.com/v2'
MB = 1024 * 1024


def die(msg): raise SystemExit(msg)
def sha256(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def env(*names):
    missing = [n for n in names if not os.environ.get(n)]
    if missing: die('Missing environment variable(s): ' + ', '.join(missing) + '. Add them in the cloud environment settings (never in a file).')
    return [os.environ[n] for n in names]
def probe_seconds(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def load(project):
    proj = (ROOT / project) if not Path(project).is_absolute() else Path(project)
    if not proj.is_dir(): proj = ROOT / 'projects' / project
    meta = json.loads((proj / 'source/project.json').read_text())
    stem = re.sub(r'[^A-Za-z0-9]+', '_', meta['title']).strip('_')     # same naming as finish.py
    d = proj / 'delivery'
    video, cover, post = d / f'{stem}.mp4', d / f'{stem}_cover.jpg', d / 'post.json'
    for f in (video, post):
        if not f.is_file(): die(f'Missing {f.relative_to(ROOT)}')
    val = json.loads((d / f'{stem}.validation.json').read_text()) if (d / f'{stem}.validation.json').is_file() else {}
    digest = sha256(video)
    if not val.get('fully_decoded') or val.get('sha256') != digest: die('The MP4 does not match its export.py validation; re-run the encode before posting.')
    m = json.loads(post.read_text())
    check_meta(m)
    rec_path = d / 'published.json'
    rec = json.loads(rec_path.read_text()) if rec_path.is_file() else {}
    if rec.get('sha256') and rec['sha256'] != digest: die('published.json belongs to a different version of this MP4. Keep it, and deliver the new cut under a new filename.')
    return dict(proj=proj, stem=stem, video=video, cover=cover if cover.is_file() else None, meta=m, digest=digest, rec=rec, rec_path=rec_path)


def check_meta(m):
    t, y = m.get('tiktok', {}), m.get('youtube', {})
    cap = t.get('caption', '')
    if not cap or len(cap) > 2200: die('tiktok.caption is missing or longer than 2200 characters.')
    if cap.count('#') > 5: die('tiktok.caption has more than 5 hashtags (house rule).')
    if not 1 <= len(y.get('title', '')) <= 100: die('youtube.title must be 1-100 characters.')
    if len(y.get('description', '').encode()) > 5000: die('youtube.description is too long.')
    if y.get('privacy') not in ('public', 'unlisted', 'private'): die('youtube.privacy must be public, unlisted or private.')
    for k in ('made_for_kids', 'contains_synthetic_media'):
        if type(y.get(k)) is not bool: die(f'youtube.{k} must be set to true or false deliberately.')
    if type(t.get('ai_generated')) is not bool: die('tiktok.ai_generated must be set to true or false deliberately.')


def save(c):
    c['rec_path'].write_text(json.dumps(c['rec'], indent=2) + '\n')


# ---------------- TikTok (Content Posting API) ----------------
def tiktok_copy(c):
    """The delivered MP4 plus the cover as a 0.1 s last frame (TikTok can only pick a cover frame from the video)."""
    out = c['video'].with_name(c['stem'] + '_tiktok.mp4')
    if not c['cover']: return c['video'], None
    if not out.is_file() or out.stat().st_mtime < max(c['video'].stat().st_mtime, c['cover'].stat().st_mtime):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(c['video']), '-loop', '1', '-framerate', '30', '-t', '0.1', '-i', str(c['cover']),
                        '-f', 'lavfi', '-t', '0.1', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex',
                        '[0:v]fps=30,format=yuv420p,setsar=1[v0];[1:v]scale=1080:1920,fps=30,format=yuv420p,setsar=1[v1];'
                        '[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[v0][a0][v1][2:a]concat=n=2:v=1:a=1[v][a]',
                        '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out)], check=True)
    return out, int(probe_seconds(out) * 1000) - 50


def tiktok_token():
    key, secret, refresh = env('TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REFRESH_TOKEN')
    r = requests.post(f'{TT}/oauth/token/', data={'client_key': key, 'client_secret': secret, 'grant_type': 'refresh_token', 'refresh_token': refresh}, timeout=30)
    j = r.json()
    if 'access_token' not in j: die(f'TikTok login failed ({j.get("error")}: {j.get("error_description")}). The refresh token may have expired; redo the one-time login.')
    if j.get('refresh_token') and j['refresh_token'] != refresh:
        print('NOTE: TikTok issued a new refresh token; the old one keeps working until it expires (365 days). Redo the login before then.')
    return j['access_token']


def tt(token, path, body):
    r = requests.post(f'{TT}{path}', json=body, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json; charset=UTF-8'}, timeout=60)
    j = r.json(); err = j.get('error', {})
    if err.get('code') not in (None, 'ok'): die(f'TikTok {path} failed: {err.get("code")} - {err.get("message")}')
    return j.get('data', {})


def post_tiktok(c, mode, dry):
    t = c['meta']['tiktok']
    if dry:
        print(f'TikTok ({mode}): caption {t["caption"]!r}, AI label {t["ai_generated"]}, cover frame from {c["cover"].name if c["cover"] else "none"}'); return
    token = tiktok_token()
    video, cover_ms = tiktok_copy(c)
    size = video.stat().st_size
    chunk = size if size <= 64 * MB else 10 * MB                      # whole file if it fits, else 10 MB chunks
    count = max(1, size // chunk)                                     # the last chunk carries the remainder
    source = {'source': 'FILE_UPLOAD', 'video_size': size, 'chunk_size': chunk, 'total_chunk_count': count}
    if mode == 'direct':
        info = tt(token, '/post/publish/creator_info/query/', {})
        privacy = t.get('privacy', 'PUBLIC_TO_EVERYONE')
        if privacy not in info.get('privacy_level_options', []):
            die(f'TikTok won\'t allow {privacy} for this app yet (allowed: {info.get("privacy_level_options")}). Until the app passes TikTok\'s review, use --tiktok-mode draft.')
        if probe_seconds(video) > info.get('max_video_post_duration_sec', 600): die('Video is longer than this TikTok account allows.')
        post_info = {'title': t['caption'], 'privacy_level': privacy, 'disable_comment': not t.get('allow_comments', True),
                     'disable_duet': not t.get('allow_duet', True), 'disable_stitch': not t.get('allow_stitch', True),
                     'is_aigc': t['ai_generated'], 'brand_content_toggle': False, 'brand_organic_toggle': False}
        if cover_ms is not None: post_info['video_cover_timestamp_ms'] = cover_ms
        print(f'TikTok: posting as @{info.get("creator_username")} ({privacy})')
        data = tt(token, '/post/publish/video/init/', {'post_info': post_info, 'source_info': source})
    else:
        data = tt(token, '/post/publish/inbox/video/init/', {'source_info': source})
    c['rec'].update(sha256=c['digest']); c['rec']['tiktok'] = {'status': 'started', 'mode': mode, 'publish_id': data['publish_id'], 'started_at': time.time()}; save(c)
    with video.open('rb') as f:
        for i in range(count):
            start = i * chunk; end = size if i == count - 1 else start + chunk
            f.seek(start); part = f.read(end - start)
            r = requests.put(data['upload_url'], data=part, timeout=600, headers={'Content-Type': 'video/mp4', 'Content-Length': str(len(part)), 'Content-Range': f'bytes {start}-{end - 1}/{size}'})
            if r.status_code not in (200, 201, 206): die(f'TikTok upload chunk {i + 1}/{count} failed: HTTP {r.status_code} {r.text[:300]}')
            print(f'TikTok upload {round(100 * end / size)}%', flush=True)
    for _ in range(120):                                              # up to ~10 minutes of processing
        st = tt(token, '/post/publish/status/fetch/', {'publish_id': data['publish_id']})
        s = st.get('status')
        if s in ('PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX'):
            ids = st.get('publicaly_available_post_id') or []
            c['rec']['tiktok'].update(status='posted', result=s, post_ids=ids, finished_at=time.time()); save(c)
            print('TikTok:', 'posted' if s == 'PUBLISH_COMPLETE' else 'sent to your TikTok inbox - open the TikTok app to finish posting', ids or ''); return
        if s == 'FAILED':
            c['rec']['tiktok'].update(status='failed', reason=st.get('fail_reason')); save(c); die(f'TikTok rejected the post: {st.get("fail_reason")}')
        time.sleep(5)
    die('TikTok is still processing after 10 minutes; check the app before trying again (published.json says "started").')


# ---------------- YouTube (Data API v3) ----------------
def youtube_token():
    cid, secret, refresh = env('YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN')
    j = requests.post('https://oauth2.googleapis.com/token', data={'client_id': cid, 'client_secret': secret, 'refresh_token': refresh, 'grant_type': 'refresh_token'}, timeout=30).json()
    if 'access_token' not in j: die(f'YouTube login failed ({j.get("error")}: {j.get("error_description")}). Redo the one-time login.')
    return j['access_token']


def post_youtube(c, dry):
    y = c['meta']['youtube']
    body = {'snippet': {'title': y['title'], 'description': y['description'], 'tags': y.get('tags', []), 'categoryId': str(y.get('category_id', '20'))},
            'status': {'privacyStatus': y['privacy'], 'selfDeclaredMadeForKids': y['made_for_kids'], 'containsSyntheticMedia': y['contains_synthetic_media']}}
    if dry: print('YouTube:', json.dumps(body)); return
    token = youtube_token(); H = {'Authorization': f'Bearer {token}'}
    ch = requests.get('https://www.googleapis.com/youtube/v3/channels', params={'part': 'id,snippet', 'mine': 'true'}, headers=H, timeout=30).json().get('items', [])
    if len(ch) != 1: die('The YouTube login does not point at exactly one channel.')
    if y.get('channel_id') and ch[0]['id'] != y['channel_id']: die(f'Logged in to channel {ch[0]["snippet"]["title"]}, not the one in post.json.')
    print(f'YouTube: uploading to {ch[0]["snippet"]["title"]}')
    size = c['video'].stat().st_size
    r = requests.post('https://www.googleapis.com/upload/youtube/v3/videos', params={'uploadType': 'resumable', 'part': 'snippet,status'}, json=body, timeout=60,
                      headers={**H, 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(size)})
    if r.status_code != 200: die(f'YouTube refused the upload: HTTP {r.status_code} {r.text[:400]}')
    c['rec'].update(sha256=c['digest']); c['rec']['youtube'] = {'status': 'started', 'channel': ch[0]['id'], 'started_at': time.time()}; save(c)
    with c['video'].open('rb') as f:
        u = requests.put(r.headers['Location'], data=f, timeout=1800, headers={**H, 'Content-Type': 'video/mp4', 'Content-Length': str(size)})
    if u.status_code not in (200, 201): die(f'YouTube upload failed: HTTP {u.status_code} {u.text[:400]} (published.json says "started"; check YouTube Studio before retrying)')
    v = u.json(); url = f'https://youtube.com/shorts/{v["id"]}'
    c['rec']['youtube'].update(status='posted', video_id=v['id'], url=url, privacy=v.get('status', {}).get('privacyStatus'), finished_at=time.time()); save(c)
    print('YouTube: posted', url, '- visibility', c['rec']['youtube']['privacy'])
    if c['cover']:
        t = requests.post('https://www.googleapis.com/upload/youtube/v3/thumbnails/set', params={'videoId': v['id']}, data=c['cover'].read_bytes(), timeout=120, headers={**H, 'Content-Type': 'image/jpeg'})
        print('YouTube: cover set' if t.status_code == 200 else f'YouTube: cover not set (HTTP {t.status_code}); Shorts may use a frame instead')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('project'); p.add_argument('--approve', action='store_true'); p.add_argument('--post', action='store_true')
    p.add_argument('--only', choices=['tiktok', 'youtube']); p.add_argument('--tiktok-mode', choices=['direct', 'draft'], default='direct')
    a = p.parse_args(); c = load(a.project)
    if a.approve:
        c['rec'].update(sha256=c['digest'], approved_at=time.strftime('%Y-%m-%d %H:%M:%S')); save(c); print('Approved for posting:', c['video'].name); return
    dry = not a.post
    if not dry and not c['rec'].get('approved_at'): die('Not approved. The user must approve this exact video first (then: --approve).')
    for platform in ('tiktok', 'youtube'):
        if a.only and a.only != platform: continue
        state = c['rec'].get(platform, {}).get('status')
        if state == 'posted': print(f'{platform}: already posted, skipping'); continue
        if state == 'started' and not dry: die(f'{platform}: an earlier post did not finish. Check the account by hand, then clear "{platform}" in published.json.')
        post_tiktok(c, a.tiktok_mode, dry) if platform == 'tiktok' else post_youtube(c, dry)
    if dry: print('PREVIEW ONLY - nothing was posted.' + ('' if c['rec'].get('approved_at') else ' (Not approved yet.)'))


if __name__ == '__main__':
    main()
