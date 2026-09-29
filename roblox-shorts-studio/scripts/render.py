"""Render a Blender scene to a fresh, traceable PNG sequence."""
import bpy, argparse, sys, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--scene',required=True)
p.add_argument('--out',required=True)
p.add_argument('--width',type=int,default=720)
p.add_argument('--samples',type=int,default=16)
p.add_argument('--frames',default='all')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
source=Path(a.scene).resolve(); out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source))
s=bpy.context.scene
height=round(a.width*s.render.resolution_y/s.render.resolution_x)
height+=height%2
state={'scene_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'width':a.width,'height':height,'samples':a.samples,'fps':s.render.fps}
stamp=out/'render-state.json'
if stamp.exists():
    if json.loads(stamp.read_text())!=state:
        raise RuntimeError('Scene or settings changed. Use a fresh output folder.')
elif any(out.glob('*.png')):
    raise RuntimeError('Untracked frames exist. Use a fresh output folder.')
stamp.write_text(json.dumps(state,indent=2))
s.render.resolution_x=a.width;s.render.resolution_y=height;s.render.resolution_percentage=100
s.eevee.taa_render_samples=a.samples
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.compression=10
s.render.use_motion_blur=False
if a.frames=='all':
    frames=list(range(s.frame_start,s.frame_end+1))
else:
    frames=[]
    for piece in a.frames.split(','):
        if ':' in piece:
            start,end=map(int,piece.split(':'));frames.extend(range(start,end+1))
        else:frames.append(int(piece))
if any(f<s.frame_start or f>s.frame_end for f in frames):raise ValueError('Frame outside scene timeline')
for f in frames:
    dest=out/f'{f:04d}.png'
    if dest.exists():continue
    s.frame_set(f);s.render.filepath=str(dest)
    bpy.ops.render.render(write_still=True)
    print('FRAME',f,'OF',s.frame_end,flush=True)
print('RENDER_COMPLETE',len(frames),flush=True)
