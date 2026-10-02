"""Build the original After Hours kit: OBJ/MTL, Studio model, motions and audio.
No downloads, paid generation or Blender rendering. Reruns replace only this kit's IDs.
"""
import copy, json, math, wave, xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from make_poses import anim, cyc, rx, ry, rz

PACK = Path(__file__).resolve().parents[1]
ROOT = PACK.parents[1]
OUT = PACK / 'horror'
OUT.mkdir(exist_ok=True)
MODELS = []
PALETTE = {'wall':'#536373','dark':'#182631','trim':'#283946','floor':'#35434b', 'ivory':'#deded0',
           'cyan':'#69e4df','amber':'#ffc475','red':'#e76651','wood':'#77563c','bark':'#4c3e35',
           'leaf':'#354d45','moss':'#536f58','steel':'#91a3a6','black':'#0c161e','paper':'#e9d9ad'}

def box(m,n,size,pos,color='wall',rot=(0,0,0),shape='box',group=None,neon=False,label=None):
    p=dict(name=n,size=list(size),pos=list(pos),color=PALETTE.get(color,color),rot=list(rot),shape=shape,
           group=group or n,neon=neon)
    if label: p['label']=label
    m['parts'].append(p)
    return p

def model(name,kind='map',description='',**meta):
    m=dict(name=name,kind=kind,description=description,parts=[],**meta); MODELS.append(m); return m

def frame(m,x,y,z,w,h,face='black',prefix='Panel',label=None):
    box(m,prefix+'Frame',(w+.2,h+.2,.16),(x,y,z),'trim')
    box(m,prefix+'Face',(w,h,.04),(x,y,z-.1),face,label=label)

def bolts(m,x,y,z,w,h):
    for i,(a,b) in enumerate([(-1,-1),(-1,1),(1,-1),(1,1)]):
        box(m,f'Bolt{len(m["parts"])}',(.08,.08,.035),(x+a*w/2,y+b*h/2,z),'steel')

def shell(name,w=20,d=16):
    m=model(name,description='Modular open-front room, removable roof, clear actor staging.')
    box(m,'Floor',(w,.35,d),(0,-.175,0),'floor')
    for x in np.arange(-w/2+2,w/2,4): box(m,'FloorSeam'+str(x),(.025,.008,d),(float(x),.008,0),'trim')
    for z in np.arange(-d/2+2,d/2,4): box(m,'FloorCross'+str(z),(w,.008,.025),(0,.01,float(z)),'trim')
    box(m,'BackWall',(w,9,.4),(0,4.5,d/2),'wall')
    for s in [-1,1]:
        box(m,'SideWall'+str(s),(.4,9,d),(s*w/2,4.5,0),'wall')
        box(m,'SideRail'+str(s),(.45,.17,d),(s*w/2,2.7,0),'cyan')
        box(m,'SideSkirt'+str(s),(.5,.6,d),(s*w/2,.3,0),'trim')
    box(m,'BackSkirt',(w,.6,.5),(0,.3,d/2),'trim')
    box(m,'BackRail',(w,.17,.45),(0,2.7,d/2),'cyan')
    for x in [-w/2+3,w/2-3]:
        box(m,'LampCase'+str(x),(2.8,.32,.48),(x,7.8,d/2-.3),'trim')
        box(m,'LampGlow'+str(x),(2.4,.17,.06),(x,7.75,d/2-.57),'amber',neon=True)
    return m

def build_geometry():
    # Body object names match the existing web rig; details share their parent body object.
    for name,forest in [('Unlisted',False),('UnlistedForest',True)]:
        m=model(name,'characters','Original rigid R6 entity; blank face and cyan chest signal.',rig=True)
        skin='ivory' if not forest else '#b4bba7'; coat='dark' if not forest else '#35453e'
        for n,sz,p,c in [('Torso',(2,2,1),(0,3,0),coat),('Left Arm',(1,2,1),(-1.5,3,0),coat),('Right Arm',(1,2,1),(1.5,3,0),coat),('Left Leg',(1,2,1),(-.5,1,0),'black'),('Right Leg',(1,2,1),(.5,1,0),'black')]:
            box(m,n,sz,p,c)
        box(m,'Head',(1.32,1,1.32),(0,4.5,0),skin,shape='cylinder')
        box(m,'Face',(1.04,.68,.006),(0,4.5,-.662),skin)
        box(m,'ChestInset',(.62,.68,.04),(0,3.28,-.526),'black',group='Torso')
        box(m,'ChestSignal',(.24,.24,.025),(0,3.3,-.554),'cyan',group='Torso',neon=True)
        for x in [-.73,.73]: box(m,'CoatSeam'+str(x),(.035,1.8,.018),(x,3,-.518),'trim',group='Torso')
        for x,side in [(-1.5,'Left Arm'),(1.5,'Right Arm')]: box(m,'Cuff'+side,(1.025,.17,1.025),(x,2.17,0),'steel',group=side)
        if forest:
            for x,y in [(-.7,3.7),(.8,2.6)]: box(m,'Moss'+str(x),(.4,.35,.04),(x,y,-.55),'moss',group='Torso')
    m=shell('horror_lobby')
    frame(m,-5.5,5.2,7.71,4,2.2,'black','Notice','AFTER HOURS\nNO STAFF ONLINE')
    frame(m,5.4,4.9,7.71,3.5,1.6,'black','Exit','EXIT / 01')
    for x in [-5,5]:
        box(m,'BenchSeat'+str(x),(4,.3,1.5),(x,1.9,5.6),'wood')
        for dx in [-1.5,1.5]: box(m,'BenchLeg'+str(x+dx),(.2,1.8,.85),(x+dx,.9,5.6),'trim')
    m=model('horror_wall',description='8x9 wall panel with lower trim and cyan route stripe.')
    box(m,'Wall',(8,9,.4),(0,4.5,0),'wall'); box(m,'Skirt',(8,.6,.45),(0,.3,-.03),'trim'); box(m,'Stripe',(8,.14,.43),(0,2.7,-.02),'cyan')
    m=model('horror_corner',description='Two perpendicular modular walls, inside corner at origin.')
    box(m,'WallX',(8,9,.4),(4,4.5,0),'wall'); box(m,'WallZ',(.4,9,8),(0,4.5,4),'wall')
    m=model('horror_door',description='6-stud clear opening, 7-stud height. Hinge on left, opens away from approach.',
            controls={'door':{'pivot':[-3,0,0],'axis':'y','range':[0,-100],'groups':['Door','Handle','Latch']},'clearance':[6,7]})
    for x in [-3.25,3.25]: box(m,'Frame'+str(x),(.5,7.5,.65),(x,3.75,0),'trim')
    box(m,'Header',(7,.5,.65),(0,7.25,0),'trim')
    box(m,'Door',(5.94,6.94,.25),(0,3.5,0),'wall',group='Door')
    box(m,'DoorInset',(5.35,5.9,.05),(0,3.6,-.15),'dark',group='Door')
    for y in [1,6]: box(m,'Hinge'+str(y),(.15,.6,.32),(-2.96,y,0),'steel',group='Door')
    frame(m,0,5.45,-.21,2.1,.65,'black','Number','01')
    for p in m['parts'][-2:]: p['group']='Door'
    box(m,'Handle',(.85,.14,.18),(2.15,3.1,-.3),'steel',group='Handle')
    box(m,'Latch',(.25,.4,.08),(2.45,3.1,-.21),'amber',group='Latch')
    m=model('horror_window',description='Opaque framed window with separate glass for authored reflection inserts.')
    frame(m,0,3.7,0,6,4,'#23474b','Glass'); box(m,'Mullion',(.1,4,.2),(0,3.7,-.14),'steel'); box(m,'Sill',(6.5,.2,.6),(0,1.6,0),'trim')
    m=shell('horror_corridor',12,26)
    for z in [-8,0,8]:
        box(m,'CeilingBar'+str(z),(12,.2,.5),(0,8.7,z),'trim')
        box(m,'CeilingTube'+str(z),(4,.06,.25),(0,8.55,z),'ivory',neon=True)
    m=model('horror_locker',description='Hinged storage locker and vented door.',controls={'door':{'pivot':[-1.5,0,-1],'axis':'y','range':[0,-95],'groups':['LockerDoor']}})
    for x in [-1.5,1.5]: box(m,'Side'+str(x),(.15,6.5,2),(x,3.25,0),'wall')
    box(m,'Back',(3,6.5,.15),(0,3.25,1),'trim'); box(m,'Top',(3,.15,2),(0,6.5,0),'wall')
    box(m,'LockerDoor',(2.95,6.4,.12),(0,3.25,-1),'wall',group='LockerDoor')
    for y in [4.9,5.15,5.4]: box(m,'Vent'+str(y),(2,.05,.025),(0,y,-1.08),'black',group='LockerDoor')
    box(m,'Pull',(.12,.65,.16),(1,3.1,-1.17),'steel',group='LockerDoor')
    m=model('horror_fuse_box','props','Wall-mounted fuse panel with switch and warning stripe.')
    box(m,'Housing',(1.8,2.4,.5),(0,1.2,0),'trim'); frame(m,0,1.45,-.27,1.4,1.2,'black','Fuses')
    for x in [-.4,0,.4]: box(m,'Fuse'+str(x),(.17,.5,.1),(x,1.45,-.36),'ivory')
    box(m,'Lever',(.12,.4,.13),(.5,.4,-.38),'red'); frame(m,0,2.1,-.29,1.4,.22,'amber','Warning','POWER')
    m=model('horror_service_counter',description='Night-shift service window with vertical shutter.',controls={'shutter':{'axis':'y','range':[0,4.4],'groups':['Shutter']}})
    box(m,'Counter',(10,.4,3),(0,2.8,0),'wood'); box(m,'CounterFront',(10,2.5,.25),(0,1.25,-1.25),'dark')
    for x in [-5,5]: box(m,'Upright'+str(x),(.4,7.5,3),(x,3.75,0),'trim')
    box(m,'Top',(10,.5,3),(0,7.35,0),'trim')
    for i in range(13): box(m,'Slat'+str(i),(9.6,.32,.18),(0,3.18+i*.32,-1.25),'steel',group='Shutter')
    box(m,'ShutterHandle',(1,.15,.2),(0,3.13,-1.4),'black',group='Shutter')
    m=shell('horror_stockroom',14,12)
    for x in [-4.5,4.5]:
        for y in [1,3.4,5.8]: box(m,'Shelf'+str((x,y)),(3,.18,8),(x,y,1),'wood')
        for z in [-3,5]: box(m,'ShelfPost'+str((x,z)),(.15,6,.15),(x,3,z),'trim')
    m=model('horror_monitor','props','CRT-style security monitor with replaceable screen, signal light and dial.')
    box(m,'Housing',(3.3,2.6,1.7),(0,1.7,0),'trim'); frame(m,-.2,1.8,-.87,2.4,1.65,'#173b3e','Screen','CAM 01\nNO SIGNAL')
    box(m,'Stand',(1.5,.25,1.3),(0,.13,0),'black'); box(m,'Neck',(.4,.4,.5),(0,.43,0),'steel')
    box(m,'LED',(.11,.11,.03),(1.36,2.2,-.87),'cyan',neon=True)
    box(m,'Dial',(.24,.24,.12),(1.33,1.55,-.94),'steel',shape='cylinder',rot=(90,0,0))
    m=model('horror_rule_board','props','Three interchangeable original night-shift rule cards.')
    frame(m,0,2.1,0,3,3.8,'paper','Rules','NIGHT SHIFT\n1. CHECK THE CAMERA\n2. COUNT THE CUSTOMERS\n3. CLOSE THE SHUTTER')
    m=model('horror_takeaway_bag','props','Original folded kraft takeaway bag. Grip at origin.',pivot='grip')
    box(m,'Bag',(1.1,1.3,.7),(0,-.55,0),'paper'); box(m,'Fold',(1.15,.12,.72),(0,.12,0),'wood'); frame(m,0,-.55,-.37,.75,.45,'paper','Brand','AFTER\nHOURS')
    m=model('horror_cup','props','Takeaway drink with lid and straw. Grip at origin.',pivot='grip')
    box(m,'Cup',(.65,1,.65),(0,0,0),'ivory',shape='cylinder'); box(m,'Lid',(.73,.09,.73),(0,.55,0),'trim',shape='cylinder'); box(m,'Straw',(.065,.45,.065),(.14,.8,0),'red')
    m=model('horror_bell','props','Desk bell with separate press button.',controls={'press':{'axis':'y','range':[0,-.1],'groups':['Button']}})
    box(m,'Base',(.85,.12,.85),(0,.06,0),'black',shape='cylinder'); box(m,'Bell',(.73,.4,.73),(0,.2,0),'steel',shape='sphere'); box(m,'Button',(.2,.15,.2),(0,.46,0),'black',shape='cylinder')
    m=model('horror_flashlight','props','Grip at origin; beam points along native -Z; lens independent.',pivot='grip')
    box(m,'Grip',(.36,.85,.4),(0,0,0),'trim'); box(m,'Barrel',(.5,1,.5),(0,.45,-.3),'black',rot=(90,0,0),shape='cylinder')
    box(m,'Rim',(.7,.2,.7),(0,.45,-.86),'steel',rot=(90,0,0),shape='cylinder'); box(m,'Lens',(.58,.04,.58),(0,.45,-.98),'amber',rot=(90,0,0),shape='cylinder',neon=True)
    m=model('horror_radio','props','Handheld radio with antenna, speaker slots and signal display.',pivot='grip')
    box(m,'Body',(.7,1.25,.4),(0,.25,0),'trim'); box(m,'Antenna',(.09,.85,.09),(.23,1.27,0),'black'); frame(m,0,.57,-.22,.45,.28,'cyan','Display','CH 01')
    for y in [-.1,.03,.16]: box(m,'Speaker'+str(y),(.44,.045,.025),(0,y,-.215),'black')
    m=model('horror_pedestal',description='Statue plinth with original warning plate.')
    box(m,'Foot',(4,.3,4),(0,.15,0),'trim'); box(m,'Column',(3,1.2,3),(0,.9,0),'wall'); box(m,'Cap',(4,.3,4),(0,1.65,0),'steel'); frame(m,0,.92,-1.53,2.4,.58,'black','Warning','DO NOT LOOK AWAY')
    m=model('horror_log','props','Fuel log; bottom-centred with separate cut ends.')
    box(m,'Bark',(1,3,1),(0,.5,0),'bark',rot=(0,0,90),shape='cylinder');
    for x in [-1.51,1.51]: box(m,'End'+str(x),(.85,.02,.85),(x,.5,0),'wood',rot=(0,0,90),shape='cylinder')
    m=model('horror_campfire',description='Rock ring, crossed logs, emissive flame cluster; high/low/out groups.',controls={'fire':{'groups':['Flame'],'states':['high','low','out']}})
    for i in range(12):
        a=i*math.tau/12; box(m,'Stone'+str(i),(.55,.4,.45),(1.4*math.cos(a),.2,1.4*math.sin(a)),'wall',rot=(0,i*30,0),shape='sphere')
    for a in [-45,45]: box(m,'Log'+str(a),(.42,2.3,.42),(0,.3,0),'wood',rot=(90,0,a),shape='cylinder')
    for i,(sz,pos,c) in enumerate([((.75,1.7,.75),(0,1.1,0),'amber'),((.4,1.1,.4),(-.4,.8,.2),'red'),((.4,1.25,.4),(.4,.9,-.2),'amber')]): box(m,'Flame'+str(i),sz,pos,c,shape='sphere',group='Flame',neon=True)
    for name,h in [('horror_pine_tall',13),('horror_pine_small',8),('horror_dead_tree',11)]:
        m=model(name,description='Original block forest silhouette with trunk and low-poly crown.')
        box(m,'Trunk',(.9,h,.9),(0,h/2,0),'bark')
        if 'dead' in name:
            for i,(a,y) in enumerate([(-35,5),(40,7),(-25,9)]): box(m,'Branch'+str(i),(.4,4,.4),((-1 if a<0 else 1)*1.2,y,0),'bark',rot=(0,0,a))
        else:
            for i in range(4):
                w=(5-i)*h/13; box(m,'Crown'+str(i),(w,h/3,w),(0,h*.35+i*h*.16,0),'leaf' if i%2 else 'moss',shape='sphere')
    m=model('horror_rock','props','Original angular boulder cluster.')
    for i,(s,p) in enumerate([((2.7,1.5,2),(0,.65,0)),((1.2,1,1.5),(1.2,.4,.3)),((1.5,.7,1.3),(-1,.3,-.5))]): box(m,'Rock'+str(i),s,p,'wall',rot=(0,i*35,10*i),shape='sphere')
    m=model('horror_forest_ground',description='Open clearing floor and trail with low-profile ground dressing.')
    box(m,'Ground',(36,.4,32),(0,-.2,0),'#293e35'); box(m,'Path',(4,.025,32),(0,.013,0),'#66523e')
    for i in range(20):
        x=(-1 if i%2 else 1)*(4+(i*3)%12); z=-14+(i*7)%28
        box(m,'Grass'+str(i),(.13,.4,.1),(x,.2,z),'moss',rot=(0,0,i%3*15))
    m=model('horror_cabin',description='Open-front cabin with plank walls, window and removable sloped roof.')
    box(m,'Floor',(14,.4,12),(0,-.2,0),'wood')
    for y in np.arange(.5,8,1):
        box(m,'BackPlank'+str(y),(14,.94,.4),(0,float(y),6),'bark')
        for s in [-1,1]: box(m,'SidePlank'+str((s,float(y))),(.4,.94,12),(s*7,float(y),0),'wood')
    for x in [-3.7,3.7]: box(m,'Roof'+str(x),(8.2,.3,13),(x,9,0),'trim',rot=(0,0,23 if x<0 else -23),group='Roof')
    box(m,'Beam',(14,.3,.4),(0,7.8,-5.8),'wood'); frame(m,0,4.8,5.7,4,3,'black','Window','KEEP THE FIRE LIT')
    m=model('horror_safe_boundary',description='Eight separate warm safe-zone markers, 12-stud diameter.')
    for i in range(8):
        a=i*math.tau/8; box(m,'Marker'+str(i),(.65,.06,.65),(6*math.cos(a),.04,6*math.sin(a)),'amber',neon=True)
    m=model('horror_ceiling_light','props','Ceiling light bar with independent emissive tube.')
    box(m,'Case',(3.8,.35,.7),(0,.175,0),'trim'); box(m,'Tube',(3.3,.08,.5),(0,-.04,0),'ivory',neon=True)

def geometry(p):
    s=np.array(p['size']); v=[]; faces=[]
    if p['shape']=='box':
        v=np.array([[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]])*s/2
        faces=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]]
    else:
        n=16
        rings=[(-.5,.86),(-.43,1),(.43,1),(.5,.86)] if p['shape']=='cylinder' else [(-.5,.01),(-.35,.7),(0,1),(.35,.7),(.5,.01)]
        for y,r in rings:
            for i in range(n):
                a=i*math.tau/n; v.append([math.cos(a)*s[0]*.5*r,y*s[1],math.sin(a)*s[2]*.5*r])
        for j in range(len(rings)-1):
            for i in range(n): faces.append([j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n])
        faces.extend([list(range(n)),list(reversed(range((len(rings)-1)*n,len(rings)*n)))])
        v=np.array(v)
    a=np.radians(p['rot']); r=rz(a[2])@ry(a[1])@rx(a[0]); return v@r.T+np.array(p['pos']),faces

def rgb(c): return tuple(int(c[i:i+2],16) for i in (1,3,5))
def font(size):
    for f in ['C:/Windows/Fonts/consolab.ttf','C:/Windows/Fonts/arialbd.ttf']:
        if Path(f).exists(): return ImageFont.truetype(f,size)
    return ImageFont.load_default()

def export_obj(m):
    folder=PACK/m['kind']/m['name']; folder.mkdir(parents=True,exist_ok=True)
    obj=['# Original After Hours kit; Y up, native -Z forward',f'mtllib {m["name"]}.mtl']; mtl=[]; ix=1; ti=1; points=[]
    for group in dict.fromkeys(p['group'] for p in m['parts']):
        obj.append('o '+group)
        for j,p in enumerate(m['parts']):
            if p['group']!=group: continue
            mat=f'm{j}'; c=np.array(rgb(p['color']))/255; mtl += [f'newmtl {mat}','Kd '+' '.join(f'{v:.5f}' for v in c),'Ks 0.04 0.04 0.04','Ns 20']
            if p['neon']: mtl.append('Ke '+' '.join(f'{v:.5f}' for v in c))
            if p['name']=='Face': mtl.append('d 0.99')
            if p.get('label'):
                im=Image.new('RGB',(1024,512),p['color']); dr=ImageDraw.Draw(im); lines=p['label'].split('\n'); sz=min(100,int(900/max(map(len,lines))*1.6)); f=font(sz)
                for k,line in enumerate(lines): dr.text((512,256+(k-(len(lines)-1)/2)*(sz+20)),line,fill=PALETTE['ivory'] if p['color']!=PALETTE['paper'] else PALETTE['black'],font=f,anchor='mm')
                im.save(folder/f'{mat}.png'); mtl[-4:]=[x if not x.startswith('Kd ') else 'Kd 1 1 1' for x in mtl[-4:]]; mtl.append(f'map_Kd {mat}.png')
            v,faces=geometry(p); points.extend(v.tolist()); obj += ['usemtl '+mat]+['v '+' '.join(f'{x:.6f}' for x in a) for a in v]
            # Second UV set is mirrored for the box's -Z face (the native front), so labels and runtime
            # panel textures read left to right from the front instead of mirrored.
            obj += ['vt 0 0','vt 0 1','vt 1 1','vt 1 0','vt 1 0','vt 1 1','vt 0 1','vt 0 0']
            for fi,face in enumerate(faces):
                t0=ti+(4 if p['shape']=='box' and fi==0 else 0)
                for k in range(1,len(face)-1): obj.append('f '+' '.join(f'{ix+face[q]}/{t0+([0,k,k+1][i]%4)}' for i,q in enumerate([0,k,k+1])))
            ix+=len(v); ti+=8
    (folder/f'{m["name"]}.obj').write_text('\n'.join(obj)+'\n',encoding='utf-8'); (folder/f'{m["name"]}.mtl').write_text('\n'.join(mtl)+'\n',encoding='utf-8')
    lo=np.min(points,axis=0); hi=np.max(points,axis=0)
    m['path']=f'{m["kind"]}/{m["name"]}/{m["name"]}.obj'; m['dimensions']={'min':lo.tolist(),'max':hi.tolist(),'size':(hi-lo).tolist()}
    m['objects']=list(dict.fromkeys(p['group'] for p in m['parts']))

def build_motion():
    motions=[
      anim('horror_look_back','Look behind with planted feet.',[(0,{}),(.65,{'head':{'yaw':65},'torso':{'yaw':12}}),(1.2,{'head':{'yaw':65},'torso':{'yaw':12}}),(1.7,{})],False,'horror'),
      anim('horror_listen','Listen with a restrained head tilt.',[(0,{}),(.7,{'head':{'roll':16,'yaw':-18}}),(1.6,{'head':{'roll':16,'yaw':-18}}),(2,{})],False,'horror'),
      anim('horror_freeze','Small startle then held pose.',[(0,{}),(.16,{'arm_r':{'pitch':18,'roll':16},'arm_l':{'pitch':18,'roll':16},'head':{'pitch':-5}}),(1.5,{'arm_r':{'pitch':18,'roll':16},'arm_l':{'pitch':18,'roll':16},'head':{'pitch':-5}})],False,'horror'),
      anim('horror_reach','Reach to handle at shoulder height; align actor using grip marker.',[(0,{}),(.8,{'arm_r':{'pitch':78,'roll':4}}),(1.4,{'arm_r':{'pitch':78,'roll':4}}),(2,{})],False,'horror'),
      anim('horror_handoff','Hold out a bag at the counter.',[(0,{}),(.7,{'arm_r':{'pitch':65}}),(1.4,{'arm_r':{'pitch':65}}),(2,{})],False,'horror'),
      anim('horror_bell_press','Short downward hand movement; align bell to hand.',[(0,{'arm_r':{'pitch':70}}),(.3,{'arm_r':{'pitch':60}}),(.6,{'arm_r':{'pitch':70}})],False,'horror'),
      anim('horror_shutter_pull','Two hands reach forward then pull down.',[(0,{}),(.7,{'arm_r':{'pitch':90,'roll':8},'arm_l':{'pitch':90,'roll':8}}),(1.4,{'arm_r':{'pitch':38,'roll':8},'arm_l':{'pitch':38,'roll':8}}),(1.8,{})],False,'horror'),
      anim('horror_torch_hold','Forward torch hold and scanning head.',cyc(8,3,lambda u:{'arm_r':{'pitch':72},'head':{'yaw':20*math.sin(math.tau*u)}}),True,'horror'),
      anim('horror_radio_hold','Hold radio in front of chest with clear face.',[(0,{}),(.6,{'arm_r':{'pitch':72,'roll':12},'head':{'pitch':8}}),(2,{'arm_r':{'pitch':72,'roll':12},'head':{'pitch':8}})],False,'horror'),
      anim('horror_entity_turn','Entity watches, then slowly turns.',[(0,{}),(.6,{}),(1.15,{'head':{'yaw':70,'roll':12}}),(2,{'head':{'yaw':70,'roll':12}})],False,'horror'),
      anim('horror_backstep','Cautious backward gait. Root motion supplied in metadata and web helper.',cyc(8,1.6,lambda u:{'leg_r':{'pitch':-14*math.sin(math.tau*u)},'leg_l':{'pitch':14*math.sin(math.tau*u)},'arm_r':{'pitch':10,'roll':8},'arm_l':{'pitch':10,'roll':8}}),True,'horror'),
      anim('horror_statue_advance','Pose for discrete statue advance; move root only while unobserved.',[(0,{}),(.01,{'head':{'roll':9},'arm_r':{'pitch':12}}),(1,{'head':{'roll':9},'arm_r':{'pitch':12}})],False,'horror'),
    ]
    motions[-2]['rootMotion']={'velocity_native':[0,0,1.05],'grounding':'lowest sole; episode must check planted foot slip'}
    idx=json.loads((PACK/'animations/index.json').read_text(encoding='utf-8')); idx['animations']=[x for x in idx['animations'] if not x['name'].startswith('horror_')]
    for a in motions:
        a['source']['author']='Original After Hours kit (tools/build_horror.py)'; (PACK/'animations'/f'{a["name"]}.json').write_text(json.dumps(a,indent=2))
        idx['animations'].append({k:a[k] for k in ['name','type','category','loop','length','description']}|{'keyframes':len(a['keyframes']),'path':f'{a["name"]}.json'})
    idx['count']=len(idx['animations']); (PACK/'animations/index.json').write_text(json.dumps(idx,indent=2)+'\n'); return motions

def build_audio():
    audio=ROOT/'assets/audio/horror'; audio.mkdir(parents=True,exist_ok=True); sr=48000; rng=np.random.default_rng(1206); rows=[]
    spec={'room_hum':8,'entity_connect':1.1,'footstep':.38,'door_creak':1.5,'latch':.28,'tension_rise':3,'reveal_hit':1.2,'night_bed':12,'forest_wind':8,'leaves_step':.5,'radio_static':2,'shutter':1.5,'desk_bell':1.4,'fire_loop':8,'torch_click':.2,'disconnect':.7}
    for name,dur in spec.items():
        t=np.arange(int(sr*dur))/sr; noise=rng.standard_normal(len(t)); sm=np.convolve(noise,np.ones(61)/61,'same'); y=np.zeros_like(t)
        if name in ['room_hum','night_bed','forest_wind','fire_loop']:
            y=.12*np.sin(math.tau*60*t)+.045*np.sin(math.tau*120*t)+.1*sm
            if name=='night_bed': y=.07*np.sin(math.tau*55*t)+.035*np.sin(math.tau*82.5*t)+.025*np.sin(math.tau*116.54*t)
            if name=='forest_wind': y=.5*sm*(.6+.3*np.sin(math.tau*t/dur))
            if name=='fire_loop':
                y=.18*sm
                for at in rng.uniform(0,dur,45): y+=.07*noise*np.exp(-np.maximum(t-at,0)*140)*(t>=at)
            fade=np.minimum(np.minimum(t/.3,(dur-t)/.3),1); y*=fade
        elif name in ['entity_connect','disconnect']:
            for start,f in [(0,330),(.42,247 if name=='entity_connect' else 165)]:
                q=np.maximum(0,t-start); y+=.2*np.sin(math.tau*f*q)*np.exp(-q*7)*(t>=start)
        elif name in ['footstep','leaves_step','torch_click','latch']:
            y=(.23*noise+.3*np.sin(math.tau*95*t))*np.exp(-t*(30 if name in ['latch','torch_click'] else 15))
        elif name=='desk_bell': y=sum(.17/(i+1)*np.sin(math.tau*f*t)*np.exp(-t*(3+i)) for i,f in enumerate([980,1470,2470]))
        elif name=='door_creak': y=.15*np.sin(math.tau*(150*t+18*t*t)+2*np.sin(21*t))*np.sin(np.pi*t/dur)**2+.1*sm
        elif name=='shutter': y=(.13*noise+.18*np.sin(75*t))*(.5+.5*np.sin(80*t))*np.sin(np.pi*t/dur)
        elif name=='radio_static': y=.13*noise*(.6+.4*np.sin(9*t))
        elif name=='tension_rise': y=(.17*np.sin(math.tau*(90*t+35*t*t))+.1*sm)*(t/dur)**2
        else: y=(.35*np.sin(math.tau*(65*t-12*t*t))+.15*noise)*np.exp(-t*5)
        y*=np.minimum(t/.006,1)*np.minimum((dur-t)/.025,1); peak=np.max(np.abs(y)); y*=min(1,.7/max(peak,1e-8))
        with wave.open(str(audio/f'{name}.wav'),'wb') as w: w.setparams((1,2,sr,len(y),'NONE','not compressed')); w.writeframes((y*32767).astype('<i2').tobytes())
        rows.append({'name':name,'path':f'assets/audio/horror/{name}.wav','seconds':dur,'sample_rate':sr,'peak':round(float(np.max(abs(y))),4),'source':'original deterministic synthesis; seed 1206'})
    (audio/'catalog.json').write_text(json.dumps(rows,indent=2)+'\n')
    (audio/'PROVENANCE.md').write_text('# After Hours audio\n\nAll 16 cues were synthesised locally by `assets/roblox_pack/tools/build_horror.py`, seed 1206, on 2026-10-02. No third-party recordings, samples, voice models or paid services were used. WAV: mono, 48 kHz, PCM16. Ambience clips have faded ends; overlap/crossfade them when looping. Keep narration above the bed and set gain per scene. These are original production assets for this project.\n')
    return rows

def build_rig(m):
    d=json.loads((PACK/'characters/Noob/rig.json').read_text()); d['name']=m['name']; d['objFile']=m['name']+'.obj'; d['objObjects']=m['objects']; d['accessories']=[]; d['clothing']={}; d['textures']={}; d['defaultFace']='neutral'; d['build']='Original procedural After Hours geometry; standard existing R6 joint layout.'
    d['bodyColors']={p['group']:p['color'] for p in m['parts'] if p['name']==p['group']}; (PACK/m['kind']/m['name']/'rig.json').write_text(json.dumps(d,indent=2)+'\n')

def export_studio(motions):
    # File can be imported even if the active Studio session is not the asset workspace.
    tree=ET.Element('roblox',version='4'); ET.SubElement(tree,'External').text='null'; ET.SubElement(tree,'External').text='nil'
    serial=0
    def item(parent,cls,name):
        nonlocal serial; serial+=1; it=ET.SubElement(parent,'Item',{'class':cls,'referent':f'RBX{serial}'}); pr=ET.SubElement(it,'Properties'); ET.SubElement(pr,'string',name='Name').text=name; return it,pr
    def val(pr,typ,n,v): ET.SubElement(pr,typ,name=n).text=str(v)
    def vec(pr,n,v):
        e=ET.SubElement(pr,'Vector3',name=n)
        for k,a in zip('XYZ',v): ET.SubElement(e,k).text=str(a)
    def cf(pr,n,comps):
        e=ET.SubElement(pr,'CoordinateFrame',name=n)
        for k,a in zip(['X','Y','Z','R00','R01','R02','R10','R11','R12','R20','R21','R22'],comps): ET.SubElement(e,k).text=str(a)
    root,_=item(tree,'Model','AfterHours_HorrorPack'); cats={}
    for k in ['characters','map','props']: cats[k]=item(root,'Folder',k.title())[0]
    source_rig=json.loads((PACK/'characters/Noob/rig.json').read_text())
    for count,m in enumerate(MODELS):
        mo,mp=item(cats[m['kind']],'Model',m['name']); offset=np.array([(count%6)*28,0,(count//6)*36]); refs={}; allparts=[]
        for p in m['parts']:
            it,pr=item(mo,'Part',p['name']); refs[p['name']]=it.attrib['referent']; allparts.append((p,it))
            size=p['size'][:]; rot=np.radians(p['rot']); r=rz(rot[2])@ry(rot[1])@rx(rot[0]); shape=1
            if p['shape']=='cylinder': r=r@rz(math.pi/2); size=[size[1],size[0],size[2]]; shape=2
            if p['shape']=='sphere': shape=0
            vec(pr,'size',size); cf(pr,'CFrame',list(np.array(p['pos'])+offset)+r.flatten().tolist()); val(pr,'token','shape',shape); val(pr,'bool','Anchored',str(not m.get('rig',False)).lower()); val(pr,'bool','CanCollide','false')
            val(pr,'token','Material',288 if p['neon'] else 256)
            color=ET.SubElement(pr,'Color3',name='Color');
            for k,a in zip('RGB',np.array(rgb(p['color']))/255): ET.SubElement(color,k).text=str(a)
            for side in ['TopSurface','BottomSurface','FrontSurface','BackSurface','LeftSurface','RightSurface']: val(pr,'token',side,0)
            group,gp=item(it,'StringValue','HorrorGroup'); val(gp,'string','Value',p['group'])
            if p.get('label'):
                gui,gp=item(it,'SurfaceGui','Label'); val(gp,'token','Face',5); val(gp,'float','PixelsPerStud',70); val(gp,'token','SizingMode',1)
                text,tp=item(gui,'TextLabel','Text'); val(tp,'string','Text',p['label']); val(tp,'float','BackgroundTransparency',1); val(tp,'bool','TextScaled','true')
                sz=ET.SubElement(tp,'UDim2',name='Size');
                for k,a in [('XS',1),('XO',0),('YS',1),('YO',0)]: ET.SubElement(sz,k).text=str(a)
                col=ET.SubElement(tp,'Color3',name='TextColor3');
                for k in 'RGB': ET.SubElement(col,k).text='0.07' if p['color']==PALETTE['paper'] else '0.9'
        if m.get('rig'):
            hr,hp=item(mo,'Part','HumanoidRootPart'); refs['HumanoidRootPart']=hr.attrib['referent']; vec(hp,'size',[2,2,1]); cf(hp,'CFrame',list(offset+[0,3,0])+np.eye(3).flatten().tolist()); val(hp,'float','Transparency',1); val(hp,'bool','Anchored','true'); val(hp,'bool','CanCollide','false')
            val(mp,'Ref','PrimaryPart',hr.attrib['referent'])
            hu,_=item(mo,'Humanoid','Humanoid'); item(hu,'Animator','Animator')
            for j in source_rig['joints']:
                jo,jp=item(mo,'Motor6D',j['name']); val(jp,'Ref','Part0',refs[j['part0']]); val(jp,'Ref','Part1',refs[j['part1']]); cf(jp,'C0',j['c0']); cf(jp,'C1',j['c1'])
            for p,it in allparts:
                if p['name'] not in refs or p['name'] in [j['part1'] for j in source_rig['joints']]: continue
                target=p['group'] if p['group'] in refs and p['group']!=p['name'] else 'Head'
                wel,wp=item(mo,'WeldConstraint','DetailWeld'); val(wp,'Ref','Part0',refs[target]); val(wp,'Ref','Part1',it.attrib['referent'])
        conf,cp=item(mo,'StringValue','HorrorMetadata'); val(cp,'string','Value',json.dumps({k:m[k] for k in ['name','description','controls'] if k in m}))
    af,_=item(root,'Folder','Animations')
    for a in motions:
        ai,ap=item(af,'KeyframeSequence',a['name']); val(ap,'bool','Loop',str(a['loop']).lower()); val(ap,'token','Priority',2)
        for k in a['keyframes']:
            ki,kp=item(ai,'Keyframe','Keyframe'); val(kp,'float','Time',k['time']); base,bp=item(ki,'Pose','HumanoidRootPart'); val(bp,'float','Weight',0)
            torso=None
            for j in ['RootJoint','Neck','Right Shoulder','Left Shoulder','Right Hip','Left Hip']:
                p=k['poses'][j]; pi,pp=item(base if j=='RootJoint' else torso,'Pose',p['part']); cf(pp,'CFrame',p['cframe']); val(pp,'float','Weight',1)
                if j=='RootJoint': torso=pi
    ET.indent(tree); (PACK/'studio').mkdir(exist_ok=True); ET.ElementTree(tree).write(PACK/'studio/AfterHours_HorrorPack.rbxmx',encoding='utf-8',xml_declaration=True)

def main():
    build_geometry()
    for m in MODELS:
        export_obj(m)
        if m.get('rig'): build_rig(m)
    fd=PACK/'faces/unlisted'; fd.mkdir(exist_ok=True)
    for e in ['neutral','happy','scared','shocked','revealed']:
        im=Image.new('RGBA',(1024,1024),(0,0,0,0))
        if e=='revealed':
            dr=ImageDraw.Draw(im); dr.rectangle((320,390,365,610),fill='#69e4df'); dr.rectangle((660,390,705,610),fill='#69e4df')
        im.save(fd/f'{e}.png')
    motions=build_motion(); audio=build_audio(); export_studio(motions)
    data={'version':1,'generated':'2026-10-02','source':'tools/build_horror.py; original procedural geometry and synthesis','axes':'Y up, native -Z forward; web loader rotates to +Z','models':MODELS,'motions':[a['name'] for a in motions],'audio':audio}
    (OUT/'manifest.json').write_text(json.dumps(data,indent=2)+'\n')
    cat=json.loads((PACK/'catalog.json').read_text(encoding='utf-8'))
    for kind in ['characters','map','props']:
        names={m['name'] for m in MODELS if m['kind']==kind}; cat[kind]=[e for e in cat[kind] if e['name'] not in names]
        for m in MODELS:
            if m['kind']!=kind: continue
            e={k:m[k] for k in ['name','path','description','objects','dimensions']}; e['pivot']={'kind':m.get('pivot','bottom_centre')}; e['source']={'built':'Original After Hours kit, tools/build_horror.py','robloxMade':False,'free':True}; e['horror']=True
            if m.get('controls'): e['controls']=m['controls']
            if kind=='characters':
                e['rig']=f'characters/{m["name"]}/rig.json'; e['expressions']=['neutral','happy','scared','shocked','revealed']; e['faceStyle']='unlisted'
            cat[kind].append(e)
        cat['counts'][kind]=len(cat[kind])
    cat['counts']['animations']=json.loads((PACK/'animations/index.json').read_text())['count']; cat['horror']='horror/manifest.json'
    (PACK/'catalog.json').write_text(json.dumps(cat,indent=1)+'\n')
    print(json.dumps({'models':len(MODELS),'motions':len(motions),'sounds':len(audio),'parts':sum(len(m['parts']) for m in MODELS)}))

if __name__=='__main__': main()
