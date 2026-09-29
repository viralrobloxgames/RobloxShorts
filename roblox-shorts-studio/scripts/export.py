from pathlib import Path
import argparse,json,subprocess,hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from settings import tools,executable
FONTS=Path(__file__).resolve().parents[1]/'assets'/'fonts'
p=argparse.ArgumentParser(description='Encode and verify a rendered PNG sequence.')
p.add_argument('--frames',required=True);p.add_argument('--out',required=True)
p.add_argument('--fps',type=int,default=30);p.add_argument('--audio');p.add_argument('--captions');p.add_argument('--fontsdir',default=str(FONTS))
a=p.parse_args();cfg=tools();ff=executable(cfg,'ffmpeg');fp=executable(cfg,'ffprobe');frames=Path(a.frames).resolve();out=Path(a.out).resolve();out.parent.mkdir(parents=True,exist_ok=True)
files=sorted(frames.glob('[0-9][0-9][0-9][0-9].png'))
if not files or [int(f.stem) for f in files]!=list(range(1,len(files)+1)):raise SystemExit('Frames must be contiguous from 0001.png.')
cmd=[ff,'-y','-framerate',str(a.fps),'-i',str(frames/'%04d.png')]
if a.audio:cmd+=['-i',str(Path(a.audio).resolve())]
if a.captions:
    esc=lambda x:Path(x).resolve().as_posix().replace(':',r'\:').replace("'",r"\'")
    cmd+=['-vf',"ass=filename='"+esc(a.captions)+"':fontsdir='"+esc(a.fontsdir)+"'"]
cmd+=['-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-r',str(a.fps),'-frames:v',str(len(files))]
if a.audio:cmd+=['-c:a','aac','-b:a','192k','-af','apad','-t',str(len(files)/a.fps)]
cmd+=['-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
subprocess.run([ff,'-v','error','-i',str(out),'-f','null','-'],check=True)
probe=json.loads(subprocess.check_output([fp,'-v','error','-show_streams','-show_format','-of','json',str(out)],text=True))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
if int(v.get('nb_frames',0))!=len(files):raise RuntimeError('Encoded frame count mismatch')
report={'file':out.name,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'fully_decoded':True,'frame_count':len(files),'fps':a.fps,'width':v['width'],'height':v['height'],'seconds':len(files)/a.fps,'audio':bool(a.audio),'captions':bool(a.captions)}
out.with_suffix('.validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
