"""Optional official YouTube uploader. Preview by default; execute only on request.
Requires requirements-youtube.txt and a finished MP4 with its export.py .validation.json."""
from pathlib import Path
import argparse,json,hashlib,time,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from settings import load,save
SCOPES=['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.readonly']
def client(cfg,client_file=None):
    try:
        import keyring
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:raise SystemExit('Install optional requirements-youtube.txt into the saved Python environment first.')
    token=keyring.get_password('roblox-shorts-studio','YOUTUBE_OAUTH_TOKEN');creds=Credentials.from_authorized_user_info(json.loads(token),SCOPES) if token else None
    if creds and creds.expired and creds.refresh_token:creds.refresh(Request())
    if not creds or not creds.valid:
        path=Path(client_file or cfg.get('youtube_client_file','')).expanduser()
        if not path.is_file():raise SystemExit('Connect once with --connect --client <desktop-OAuth-JSON>. Keep that file outside this repo.')
        creds=InstalledAppFlow.from_client_secrets_file(str(path),SCOPES).run_local_server(port=0)
        cfg['youtube_client_file']=str(path.resolve())
    keyring.set_password('roblox-shorts-studio','YOUTUBE_OAUTH_TOKEN',creds.to_json());save({'youtube_client_file':cfg.get('youtube_client_file')});return build('youtube','v3',credentials=creds,cache_discovery=False)
def validate_metadata(m):
    if not isinstance(m.get('title'),str) or not 1<=len(m['title'])<=100:raise ValueError('Title must contain 1–100 characters.')
    if not isinstance(m.get('description'),str) or len(m['description'].encode())>5000:raise ValueError('Description is missing or too long.')
    if m.get('privacy') not in ['private','unlisted','public']:raise ValueError('Choose private, unlisted or public explicitly.')
    if type(m.get('made_for_kids')) is not bool:raise ValueError('Set made_for_kids explicitly for the intended audience; cartoons do not determine that setting automatically.')
    if type(m.get('contains_synthetic_media')) is not bool:raise ValueError('Set contains_synthetic_media explicitly based on the actual content and YouTube guidance.')
    if not m.get('channel_id'):raise ValueError('The intended channel_id is required.')
    return {'snippet':{'title':m['title'],'description':m['description'],'tags':m.get('tags',[]),'categoryId':str(m.get('category_id','27'))},'status':{'privacyStatus':m['privacy'],'selfDeclaredMadeForKids':m['made_for_kids'],'containsSyntheticMedia':m['contains_synthetic_media']}}
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--connect',action='store_true');p.add_argument('--client');p.add_argument('--file');p.add_argument('--metadata');p.add_argument('--execute',action='store_true');p.add_argument('--validation');a=p.parse_args();cfg=load()
    if a.connect:
        yt=client(cfg,a.client);items=yt.channels().list(part='id,snippet',mine=True).execute().get('items',[])
        if len(items)!=1:raise SystemExit('Select the intended channel during Google authorization before upload. Connected account did not identify exactly one channel.')
        c=items[0];save({'youtube_channel_id':c['id'],'youtube_channel_name':c['snippet']['title'],'youtube_mode':'api-on-request'});print('CONNECTED_CHANNEL',c['id'],c['snippet']['title']);return
    if not a.file or not a.metadata:p.error('--file and --metadata are required for a preview or upload.')
    path=Path(a.file).resolve();m=json.loads(Path(a.metadata).read_text(encoding='utf-8'));body=validate_metadata(m)
    if not path.is_file():raise SystemExit('The finished video file does not exist.')
    digest=hashlib.sha256(path.read_bytes()).hexdigest();review={'file':str(path),'sha256':digest,'channel_id':m['channel_id'],'metadata':body}
    print(json.dumps(review,indent=2))
    if not a.execute:print('PREVIEW_ONLY: no connection or upload was attempted.');return
    if cfg.get('youtube_channel_id')!=m['channel_id']:raise SystemExit('Metadata does not match the channel selected during setup. Connect the intended channel first.')
    validation=Path(a.validation) if a.validation else path.with_suffix('.validation.json')
    if not validation.is_file():raise SystemExit('Validate and review this finished MP4 before uploading.')
    v=json.loads(validation.read_text(encoding='utf-8'))
    if not v.get('fully_decoded') or v.get('sha256')!=digest:raise SystemExit('The video differs from the validated delivery. Revalidate it before upload.')
    state=path.with_suffix('.upload.json')
    if state.exists():
        old=json.loads(state.read_text(encoding='utf-8'))
        if old.get('sha256')!=digest or old.get('channel_id')!=m['channel_id']:raise SystemExit('This filename has an upload record for a different file or channel. Keep the existing record and use a new delivery filename for the revised upload.')
        if old.get('status')=='completed':print('ALREADY_UPLOADED',old['url']);return
        raise SystemExit('A previous upload is unresolved. Check its record and YouTube Studio before starting another upload.')
    yt=client(cfg);channels=yt.channels().list(part='id,snippet',mine=True).execute().get('items',[])
    if not any(c['id']==m['channel_id'] for c in channels):raise SystemExit('The connected account no longer matches the intended channel.')
    record=dict(review,status='started',started_at=time.time());state.write_text(json.dumps(record,indent=2), encoding='utf-8')
    from googleapiclient.http import MediaFileUpload
    req=yt.videos().insert(part='snippet,status',body=body,media_body=MediaFileUpload(str(path),mimetype='video/mp4',chunksize=8*1024*1024,resumable=True));response=None
    try:
        while response is None:
            progress,response=req.next_chunk(num_retries=0)
            if progress:print('UPLOAD_PROGRESS',round(progress.progress()*100),flush=True)
        record.update(status='completed',video_id=response['id'],url='https://www.youtube.com/watch?v='+response['id'],returned_privacy=response.get('status',{}).get('privacyStatus'));state.write_text(json.dumps(record,indent=2), encoding='utf-8');print('UPLOADED',record['url'],'visibility:',record['returned_privacy'])
    except Exception:
        record['status']='needs_recovery';state.write_text(json.dumps(record,indent=2), encoding='utf-8');raise
if __name__=='__main__':main()
