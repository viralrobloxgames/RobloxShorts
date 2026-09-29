"""Build a packed, baked farm scene. This script NEVER renders locally."""
import bpy, sys, math, random, json, hashlib
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
S=Path(__file__).resolve().parent; OUT=S.parent
sys.path.insert(0,str(S))
from characters import *

FPS=30; SECONDS=21.7; END=651
def F(t): return max(1,round(t*FPS)+1)
def smooth(a,b,t):
    u=max(0,min(1,(t-a)/(b-a))); return u*u*(3-2*u)
def vis(ob,start,end):
    for f,h in [(1,True),(max(1,F(start)-1),True),(F(start),False),(F(end),True)]:
        ob.hide_render=ob.hide_viewport=h
        ob.keyframe_insert('hide_render',frame=f);ob.keyframe_insert('hide_viewport',frame=f)
def transform(ob,t,loc=None,rot=None,scale=None):
    if loc is not None:ob.location=loc;ob.keyframe_insert('location',frame=F(t))
    if rot is not None:ob.rotation_euler=rot;ob.keyframe_insert('rotation_euler',frame=F(t))
    if scale is not None:ob.scale=scale;ob.keyframe_insert('scale',frame=F(t))
def label(name,body,loc,size,mat):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.align_x='CENTER';d.align_y='CENTER';d.size=size;d.extrude=.008;d.bevel_depth=.003
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);d.materials.append(mat)
    # Convert text to geometry: font availability is irrelevant on the farm.
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
reset();scene=setup_scene(1080,1920);scene.frame_end=END
scene.render.use_sequencer=False;scene.render.use_file_extension=True
scene.render.use_motion_blur=False;scene.render.image_settings.color_depth='8'
scene.render.filepath='//renders/Free_Coin_Trap_'
navy=material('Machine deep navy','173044');mint=material('Machine mint','4DD5BB');cream=material('Cream','FFF7DF');gold=material('Coin gold','FFC13D',.28,.55);lightgold=material('Coin relief','FFE794',.35,.35)
red=material('STOP coral','FF5B67');green=material('Button lime','DFFF54');ink=material('Ink','14334C');floor=material('Floor sky','ADCBDC');back=material('Backdrop blue','789BAC')
cube('Studio floor',(0,0,-.25),(200,200,.5),floor,0)
cube('Backdrop wall',(0,7,8),(40,.5,20),back,.1)
for x in (-9,-6,7,10):
    cube('Background tile',(x,6.68,4),(2,.1,8),mint,.08)
cube('Dispenser base',(1.4,2.5,.36),(4.8,2.5,.72),navy,.2)
cube('Dispenser body',(1.4,2.5,3.7),(4.35,2.1,6.4),mint,.22)
cube('Front face',(1.4,1.4,4.0),(3.95,.2,5.5),navy,.1)
cube('Sign cream',(1.4,1.24,6.05),(3.65,.16,1.0),cream,.08)
label('FREE COINS','FREE COINS',(1.4,1.14,6.08),.51,ink)
label('Machine smallprint','HOLD FOR MORE',(1.4,1.16,5.36),.24,cream)
cube('Top feed tower',(-.85,2.4,7.0),(1.35,1.3,3.0),navy,.12)
cube('Overhead feed',(-.85,.8,8.28),(1.35,4.5,.65),mint,.12)
cube('Chute dark opening',(-.85,-1.45,8.04),(1.10,.9,.12),ink,.04)
cube('Chute front lip',(-.85,-1.91,8.25),(1.35,.15,.55),gold,.035)
cube('Express panel',(1.5,1.2,4.65),(3.45,.18,.72),red,.05)
express=label('EXPRESS DELIVERY','EXPRESS DELIVERY',(1.5,1.09,4.67),.28,cream)
vis(express,8.6,16.35)
regular=label('READY','READY',(1.5,1.09,4.67),.34,cream);vis(regular,0,8.6)
off=label('THANK YOU','THANK YOU',(1.5,1.09,4.67),.32,cream);vis(off,16.35,22)
# Paid stop control is offset from the growing coin pile.
cube('Stop control',(2.85,.92,3.03),(1.1,.5,1.65),red,.08)
label('STOP','STOP',(2.85,.63,3.55),.27,cream)
label('Stop price','1 COIN',(2.85,.63,2.55),.21,cream)
cube('Coin slot',(2.85,.63,3.04),(.55,.05,.10),ink,.025)

maxa=load_character(OUT/'assets/Block_Characters.blend','Max');mia=load_character(OUT/'assets/Block_Characters.blend','Mia')
maxa['rig'].location=(-.85,-.65,0);pose(maxa,{'Arm.R':(-45,0,0)});ground_actor(maxa)
rig=maxa['rig'];bpy.context.view_layer.update()
def hand_center(actor,side):
    r=actor['rig'];b=r.pose.bones['Arm.'+side]
    return r.matrix_world@b.matrix@b.bone.matrix_local.inverted()@Vector(((-1 if side=='R' else 1)*1.53,0,2.31))
hand=hand_center(maxa,'R');button_z=hand.z-.53
cube('Button stand',(hand.x,hand.y,(button_z-.28)/2),(.98,1.02,button_z-.28),navy,.09)
cube('Button rim',(hand.x,hand.y,button_z-.11),(1.32,1.2,.26),cream,.08)
button=cylinder('Free coin button',(hand.x,hand.y,button_z+.025),.45,.18,green,.045)
label('PUSH label','PUSH',(hand.x,hand.y-.62,button_z-.36),.24,ink)

# Two-part linked coin mesh with raised square relief.
coin=cylinder('Coin prototype',(0,0,0),.30,.105,gold,.018,24)
relief=cube('Coin raised stamp',(0,0,.066),(.22,.22,.05),lightgold,.025);relief.rotation_euler.z=math.pi/4
bpy.ops.object.select_all(action='DESELECT');coin.select_set(True);relief.select_set(True);bpy.context.view_layer.objects.active=coin;bpy.ops.object.convert(target='MESH');bpy.ops.object.join()
coinmesh=coin.data;bpy.data.objects.remove(coin,do_unlink=True)
def coin_ob(name,loc=(0,0,0),parent=None):
    ob=bpy.data.objects.new(name,coinmesh);scene.collection.objects.link(ob);ob.location=loc;ob.parent=parent;return ob

# Dense rigid pile with a hidden-under-coins core; no physics cache.
heap=bpy.data.objects.new('Growing coin pile',None);scene.collection.objects.link(heap);heap.location=(-.85,-.60,0)
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=2.52,radius2=1.22,depth=3.9,location=(0,0,1.95))
core=bpy.context.object;core.name='Solid coin pile core';core.data.materials.append(gold);core.parent=heap
rng=random.Random(174)
for i in range(310):
    if i<248:
        z=.14+(i//31)*.47;ang=(i%31)*math.tau/31+rng.uniform(-.07,.07);rad=2.54-1.30*z/3.9
        ob=coin_ob('Pile coin %03d'%i,(rad*math.cos(ang),rad*math.sin(ang),z),heap)
        ob.rotation_euler=(math.pi/2-.32,0,ang+math.pi/2)
    else:
        a=rng.uniform(0,math.tau);rad=1.17*math.sqrt(rng.random());ob=coin_ob('Top coin %03d'%i,(rad*math.cos(a),rad*math.sin(a),3.91+rng.uniform(0,.14)),heap);ob.rotation_euler=(rng.uniform(-.15,.15),rng.uniform(-.15,.15),a)
for t,sz in [(0,.001),(5.5,.001),(6.6,.15),(7.6,.32),(9.1,.58),(10.5,.84),(12.75,1),(21.7,1)]:transform(heap,t,scale=(sz,sz,sz))

first=coin_ob('First coin')
vis(first,3.38,5.6)
for t,p in [(3.38,(-.85,-1.48,8.0)),(3.86,(-.85,-1.48,1.0)),(4.08,(-.9,-1.65,1.65)),(4.48,(-1,-1.8,.12)),(5.59,(-1,-1.8,.12))]:transform(first,t,p,(math.pi/2,0,t*8))
for i in range(260):
    start=5.55+i*.041
    if start>16.2:break
    ob=coin_ob('Falling coin %03d'%i);vis(ob,start,start+.66)
    x=-.85+rng.uniform(-.65,.65);y=-1.35+rng.uniform(-.45,.45);ht=3.9*smooth(5.5,12.75,start)
    transform(ob,start,(x,y,8.0),(rng.random()*3,rng.random()*3,0))
    transform(ob,start+.64,(x+rng.uniform(-1.0,1.0),y+rng.uniform(-.6,.6),ht+.1),(rng.random()*8,rng.random()*8,6))

pay=coin_ob('Mia payment coin');vis(pay,14.4,16.36)
refund=coin_ob('Final refund coin');vis(refund,19.1,21.7)
for t,p,r in [(19.1,(-.85,-.7,8.0),(math.pi/2,0,0)),(19.96,(-.85,-.7,5.53),(math.pi/2,0,8)),(20.14,(-.43,-.9,6.04),(math.pi/2,0,10)),(20.6,(.72,-1.05,4.02),(0,0,13)),(21.7,(.72,-1.05,4.02),(0,0,13))]:transform(refund,t,p,r)

for f in range(1,END+1,2):
    t=(f-1)/FPS;scene.frame_set(f)
    press=smooth(2.5,2.86,t)*(1-smooth(3.14,3.5,t))
    hold=smooth(4.7,5.3,t)*(1-smooth(10.2,10.75,t))
    amt=max(press,hold)
    angles=action_pose('Idle',t*.6)
    angles['Arm.R']=(-45*amt,0,3*(1-amt));angles['Head']=(0,0,-4*amt)
    if 10.65<t<17.1:
        angles={'Arm.L':(-5,0,-3),'Arm.R':(-5,0,3),'Head':(-4+2*math.sin(t*8),9*math.sin(t*4),0)}
    if 17.1<=t<19.7:angles={'Head':(0,-8*math.sin(t*9),0),'Arm.L':(-10,0,-6),'Arm.R':(-10,0,6)}
    if t>=19.7:
        bonk=math.exp(-((t-20.05)/.10)**2);angles={'Head':(20*bonk,0,3*math.sin(t*8)*(1-smooth(20.2,21,t)))}
    pose(maxa,angles);rig.location=(-.85,-.65,-.035);key_pose(maxa,f);rig.keyframe_insert('location',frame=f)
    button.location.z=button_z+.075-.05*amt;button.keyframe_insert('location',frame=f)
    walk=smooth(13.4,14.95,t);mia['rig'].location=(7-4.20*walk,-1.15,0)
    mp=action_pose('Walk',t*1.8) if .01<walk<.999 else action_pose('Idle',t*.6)
    # Mia turns toward the slot behind her, showing her profile during payment.
    yaw=math.pi/2*smooth(14.55,15.15,t)*(1-smooth(16.35,16.85,t))
    mia['rig'].rotation_euler.z=yaw
    paying=smooth(14.8,15.45,t)*(1-smooth(16.3,16.7,t))
    mp['Arm.R']=(-62*paying,0,0)
    if t>20.05:mp=action_pose('Laugh',t*2)
    pose(mia,mp)
    if .01<walk<.999:ground_actor(mia)
    else:mia['rig'].location.z=-.035
    key_pose(mia,f)
    for prop in ('location','rotation_euler'):mia['rig'].keyframe_insert(prop,frame=f)
    if 14.4<=t<15.7:
        bpy.context.view_layer.update();pay.location=hand_center(mia,'R')+Vector((0,-.22,.10));pay.rotation_euler=(math.pi/2,0,t*2)
    elif t<16.36:
        # Brief readable insert moves the coin from her hand into the shutdown slot.
        u=smooth(15.7,16.3,t);pay.location=Vector((3.7,-.12,3.75)).lerp(Vector((2.85,.63,3.04)),u);pay.rotation_euler=(math.pi/2,0,0)
    pay.keyframe_insert('location',frame=f);pay.keyframe_insert('rotation_euler',frame=f)
for t,e in [(0,'happy'),(8.7,'surprised'),(11.1,'sad'),(16.4,'neutral'),(17.1,'angry'),(19.85,'surprised'),(20.4,'sad')]:set_expression(maxa,e,F(t))
for t,e in [(0,'neutral'),(16.4,'happy'),(20.15,'laugh')]:set_expression(mia,e,F(t))

# Portrait shots; camera switches are baked as constant keys to avoid cut smearing.
shots=[(0,'The tempting machine',(.0,-28,12),(.1,0,4.15),15.3),
       (2.50,'One press, one coin',(-4,-24,10),(-1.38,-.65,3.35),10.5),
       (4.55,'Hold for more',(-.5,-26,11),(-.15,-.2,3.8),13.6),
       (8.05,'Express delivery',(.8,-28,12),(.30,0,4.3),15.7),
       (11.10,'Buried',(-.85,-25,10),(-.4,-.2,4.42),10.8),
       (14.35,'Pay to stop',(.8,-28,12),(.60,0,4.0),16.4),
       (17.10,'Refund request',(-1.4,-24,9),(-.55,-.5,4.45),9.7),
       (18.55,'Exactly one refund',(.35,-26,10),(.3,-.1,4.48),13.2)]
cam=scene.camera;cam.data.type='ORTHO'
for t,title,loc,target,size in shots:
    cam.location=loc;aim(cam,target);cam.data.ortho_scale=size
    cam.keyframe_insert('location',frame=F(t));cam.keyframe_insert('rotation_euler',frame=F(t));cam.data.keyframe_insert('ortho_scale',frame=F(t))
    marker=scene.timeline_markers.new(title,frame=F(t));marker.camera=cam

def curves(block):
    ad=block.animation_data
    if not ad or not ad.action:return []
    action=ad.action
    if hasattr(action,'fcurves'):return action.fcurves
    result=[]
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:result.extend(bag.fcurves)
    return result
for ob in bpy.data.objects:
    for fc in curves(ob):
        for key in fc.keyframe_points:key.interpolation='CONSTANT' if ob==cam or 'hide_' in fc.data_path else 'LINEAR'
for fc in curves(cam.data):
    for key in fc.keyframe_points:key.interpolation='CONSTANT'
scene['title']='The Free Coin Trap';scene['render_destination']='GarageFarm via Brave';scene['no_local_render']=True
scene['narration_duration_seconds']=20.48
for textblock in bpy.data.texts:textblock.use_module=False
bpy.ops.file.pack_all()
assert not any(o.library for o in bpy.data.objects),'Unexpected linked objects'
assert not any(m.library for m in bpy.data.meshes),'Unexpected linked meshes'
scene.frame_set(1)
farmfile=OUT/'The_Free_Coin_Trap_GarageFarm.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(farmfile),compress=True)
testframes=[1,87,118,199,290,397,469,510,545,600,621]
checks=[]
for f in testframes:
    scene.frame_set(f)
    h=rig.matrix_world@rig.pose.bones['Head'].matrix@rig.pose.bones['Head'].bone.matrix_local.inverted()@Vector((0,0,4.73))
    ndc=world_to_camera_view(scene,cam,h)
    assert .04<ndc.x<.96 and .15<ndc.y<.90,(f,tuple(ndc))
    checks.append({'frame':f,'max_head_in_frame':[round(v,3) for v in ndc]})
manifest={'title':scene['title'],'file':farmfile.name,'sha256':hashlib.sha256(farmfile.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'engine':scene.render.engine,'width':1080,'height':1920,'fps':30,'frame_start':1,'frame_end':END,'seconds':SECONDS,'test_frames':testframes,'objects':len(bpy.data.objects),'linked_libraries':0,'autoexec_required':False,'local_render_performed':False,'checks':checks}
(S/'farm_manifest.json').write_text(json.dumps(manifest,indent=2))
(S/'shots.json').write_text(json.dumps([{'start':x[0],'end':shots[i+1][0] if i+1<len(shots) else SECONDS,'title':x[1]} for i,x in enumerate(shots)],indent=2))
(S/'project.json').write_text(json.dumps({'title':scene['title'],'characters':['Max','Mia'],'seconds':SECONDS,'fps':30,'width':1080,'height':1920,'status':'Packed native scene; awaiting GarageFarm test frames and final render'},indent=2))
print(json.dumps(manifest,indent=2))
