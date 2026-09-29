import bpy, sys, math, json
from pathlib import Path
S=Path(__file__).resolve().parent
sys.path.insert(0,str(S))
from characters import *

ROOT=S.parent
OUT=ROOT/'demo'
OUT.mkdir(exist_ok=True)
reset()
actor=load_character(ROOT/'assets'/'Block_Characters.blend','Max')
rig=actor['rig'];rig.location=(0,0,0)
rig.animation_data_clear()
scene=setup_scene()
stage()
scene.frame_start=1;scene.frame_end=240
# A front three-quarter view preserves the face and the full block silhouette.
scene.camera.location=(7.0,-20,10.3)
scene.camera.data.ortho_scale=13.2
aim(scene.camera,(0,0,2.60))

def smooth(x):
    x=max(0,min(1,x));return x*x*(3-2*x)

for f in range(1,241):
    scene.frame_set(f)
    t=(f-1)/30
    loc=[0,0,0];angles={}
    if t<2:
        phase=t*1.7
        angles=action_pose('Walk',phase)
        loc[1]=1.8*(1-smooth(t/2))
        loc[2]=.045*abs(math.sin(phase*2*math.pi))
    elif t<4:
        strength=smooth((t-2)/.32)*(1-smooth((t-3.7)/.3))
        angles={k:tuple(a*strength for a in v) for k,v in action_pose('Wave',(t-2)*1.5).items()}
    elif t<5.25:
        strength=smooth((t-4)/.18)
        angles={k:tuple(a*strength for a in v) for k,v in action_pose('Shock',0).items()}
        loc[2]=.10*math.sin(math.pi*min(1,(t-4)/.4))
    elif t<6.7:
        # A readable comic wobble: lean around the planted feet, then recover.
        q=(t-5.25)/1.45
        wobble=math.sin(q*math.pi*4)*(1-q)*10
        angles={'Root':(0,0,wobble),'Arm.R':(-15,0,30+abs(wobble)*1.2),'Arm.L':(-15,0,-30-abs(wobble)*1.2),'Head':(0,0,-wobble*.6)}
    else:
        strength=1-smooth((t-6.7)/.35)
        angles={'Arm.R':(-15*strength,0,45*strength),'Arm.L':(-15*strength,0,-45*strength),'Head':(0,0,4*math.sin((t-6.7)*math.pi))}
    pose(actor,angles)
    rig.location=loc
    ground_actor(actor)
    rig.keyframe_insert(data_path='location',frame=f)
    key_pose(actor,f)
for frame,expr in [(1,'happy'),(120,'happy'),(121,'surprised'),(158,'surprised'),(159,'sad'),(201,'sad'),(202,'happy'),(240,'happy')]:
    set_expression(actor,expr,frame)
for frame,label in [(1,'01 Walk'),(61,'02 Wave'),(121,'03 Surprise'),(159,'04 Wobble'),(202,'05 Recover')]:
    scene.timeline_markers.new(label,frame=frame)
scene.frame_set(78)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Character_Motion_Test.blend'))
shots=[{'start':0,'end':2,'label':'WALK IN'},{'start':2,'end':4,'label':'SAY HELLO'},
       {'start':4,'end':5.25,'label':'BIG REACTIONS'},{'start':5.25,'end':6.7,'label':'A LITTLE DRAMA'},
       {'start':6.7,'end':8,'label':'READY FOR A STORY'}]
(OUT/'shots.json').write_text(json.dumps(shots,indent=2),encoding='utf-8')
(OUT/'project.json').write_text(json.dumps({'title':'Meet Max - block character motion test','seconds':8,'fps':30,'width':1080,'height':1920,'voice':None,'stage':'visual prototype'},indent=2),encoding='utf-8')
scene.render.filepath=str(OUT/'Hero.png')
if '--no-render' not in sys.argv: bpy.ops.render.render(write_still=True)
print('DEMO_READY',flush=True)




