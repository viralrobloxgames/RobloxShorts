"""Original block-character geometry and rigid animation rig. Blender 5.2.

All meshes are generated locally; no Roblox or third-party models are embedded.
Coordinates: Z up, character faces -Y, dimensions are in block units.
"""
import bpy
import math
from mathutils import Vector

EXPRESSIONS = ('happy', 'neutral', 'surprised', 'angry', 'sad', 'laugh')
PALETTES = {
    'Max': {'skin': 'F0B774', 'top': '15B7B1', 'dark': '123D54', 'hair': '342724', 'accent': 'F6B93B'},
    'Mia': {'skin': 'BA7B51', 'top': 'A56DFF', 'dark': '2D2452', 'hair': '241C25', 'accent': 'FFCA57'},
    'Leo': {'skin': 'F2C89A', 'top': 'FF7653', 'dark': '273A5D', 'hair': 'BD7032', 'accent': 'FFE05F'},
}

def material(name, color, roughness=.6, metallic=0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*tuple(int(color[i:i+2], 16)/255 for i in (0,2,4)), 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    # Hex colors are display sRGB; the shader expects linear values.
    rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in m.diffuse_color[:3]]
    bs.inputs['Base Color'].default_value = (*rgb,1)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return m

def finish(obj, name, mat, bevel=0):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft block edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    return obj

def cube(name, pos, size, mat, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    ob = bpy.context.object
    ob.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(ob, name, mat, bevel)

def cylinder(name, pos, radius, depth, mat, bevel=.04, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    ob = finish(bpy.context.object, name, mat, bevel)
    for p in ob.data.polygons:
        p.use_smooth = abs(p.normal.z) < .5
    return ob

def sphere(name, pos, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=pos)
    ob = bpy.context.object
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in ob.data.polygons:
        p.use_smooth = True
    return finish(ob, name, mat)

def stroke(name, points, mat, radius=.024):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    sp = curve.splines.new('POLY')
    sp.points.add(len(points)-1)
    for dst, p in zip(sp.points, points):
        dst.co = (*p, 1)
    ob = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target='MESH')
    ob.select_set(False)
    return ob

def to_collection(ob, collection):
    for old in list(ob.users_collection):
        old.objects.unlink(ob)
    collection.objects.link(ob)

def rigid_bind(ob, rig, bone, collection):
    # Mesh vertices retain their world rest locations; the armature is at origin.
    vg = ob.vertex_groups.new(name=bone)
    vg.add(list(range(len(ob.data.vertices))), 1.0, 'REPLACE')
    mod = ob.modifiers.new('Rigid block rig', 'ARMATURE')
    mod.object = rig
    ob.parent = rig
    to_collection(ob, collection)
    ob['part'] = bone
    return ob

def make_character(name='Max', palette=None):
    p = palette or PALETTES[name]
    collection = bpy.data.collections.new('Character_' + name)
    bpy.context.scene.collection.children.link(collection)
    skin = material(name+'_Skin', p['skin'], .7)
    top = material(name+'_Top', p['top'])
    dark = material(name+'_Trousers', p['dark'])
    hair = material(name+'_Hair', p['hair'])
    accent = material(name+'_Accent', p['accent'])
    ink = material('Face_ink', '172335', .8)
    white = material('Warm_white', 'FFF8E9', .6)
    pink = material('Mouth_inside', 'D35770', .7)

    data = bpy.data.armatures.new(name+'_Skeleton')
    rig = bpy.data.objects.new(name+'_Rig', data)
    collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bones = {
        'Root': ((0,0,0),(0,0,.5),None),
        'Torso': ((0,0,2.04),(0,0,4.04),'Root'),
        'Head': ((0,0,4.03),(0,0,5.32),'Torso'),
        'Arm.L': ((1.02,0,3.65),(1.02,0,1.73),'Torso'),
        'Arm.R': ((-1.02,0,3.65),(-1.02,0,1.73),'Torso'),
        'Leg.L': ((.51,0,2.04),(.51,0,.1),'Root'),
        'Leg.R': ((-.51,0,2.04),(-.51,0,.1),'Root'),
    }
    for key,(head,tail,parent) in bones.items():
        b = data.edit_bones.new(key)
        b.head, b.tail = head, tail
        if parent:
            b.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in rig.pose.bones:
        b.rotation_mode = 'XYZ'
    rig.show_in_front = True
    rig['asset_id'] = 'block_actor_'+name.lower()
    rig['facing'] = '-Y'
    rig['height'] = 5.43
    rig['expressions'] = ','.join(EXPRESSIONS)
    rig['provenance'] = 'Original local procedural meshes; Roblox-style proportions; not an exported Roblox avatar.'
    parts = []
    faces = {e: [] for e in EXPRESSIONS}
    def bind(ob,bone):
        parts.append(rigid_bind(ob,rig,bone,collection))
        return ob
    def box(label,pos,size,mat,bone,bevel=.035):
        return bind(cube(name+'_'+label,pos,size,mat,bevel),bone)

    box('Hoodie',(0,0,3.04),(2.02,1.06,1.98),top,'Torso',.055)
    box('Hem',(0,0,2.13),(2.04,1.075,.16),dark,'Torso',.025)
    box('Pocket',(0,-.551,2.65),(.86,.08,.38),top,'Torso',.06)
    box('Pocket_seam',(0,-.598,2.72),(.56,.012,.023),dark,'Torso',.005)
    for x in (-.23,.23):
        box('Hood_cord',(x,-.555,3.67),(.033,.035,.42),white,'Torso',.01)
        box('Cord_tip',(x,-.578,3.46),(.055,.045,.09),accent,'Torso',.01)
    badge = box('Chest_badge',(.65,-.559,3.48),(.26,.055,.24),accent,'Torso',.018)
    badge.rotation_euler.y = math.radians(8)
    bind(cylinder(name+'_Neck',(0,0,4.07),.32,.24,skin),'Head')
    bind(cylinder(name+'_Head',(0,0,4.73),.715,1.17,skin,.09,64),'Head')
    for sign,side in ((1,'L'),(-1,'R')):
        x=sign*1.53
        box('Sleeve.'+side,(x,0,3.26),(.94,1.02,1.45),top,'Arm.'+side,.045)
        box('Cuff.'+side,(x,0,2.57),(.965,1.04,.18),dark,'Arm.'+side,.025)
        box('Hand.'+side,(x,0,2.31),(.90,.96,.50),skin,'Arm.'+side,.055)
        x=sign*.51
        box('Leg.'+side,(x,0,1.20),(.96,1.04,1.64),dark,'Leg.'+side,.035)
        box('Shoe.'+side,(x,-.10,.30),(.98,1.27,.49),white,'Leg.'+side,.065)
        box('Sole.'+side,(x,-.10,.095),(1.00,1.29,.12),dark,'Leg.'+side,.028)
        box('Shoe_stripe.'+side,(x,-.744,.32),(.74,.028,.10),top,'Leg.'+side,.012)
        for yy in (-.45,-.26):
            box('Lace.'+side,(x,yy,.553),(.49,.043,.023),white,'Leg.'+side,.005)

    # Angular hair pieces keep a recognisable block-game silhouette.
    bind(cylinder(name+'_Hair_cap',(0,.02,5.29),.737,.24,hair,.045,16),'Head')
    for i,(x,z,tilt) in enumerate([(-.48,5.16,-12),(-.15,5.24,-18),(.20,5.30,-22),(.48,5.30,-15)]):
        ob=box('Hair_fringe_'+str(i),(x,-.43,z),(.40,.53,.36),hair,'Head',.035)
        ob.rotation_euler.y = math.radians(tilt)
    for sign in (-1,1):
        box('Side_hair',(sign*.635,.09,5.00),(.17,.60,.42),hair,'Head',.055)

    def face_y(x,offset=.02):
        return -math.sqrt(max(.01,.715**2-x*x))-offset
    def face_stroke(expr,label,xz,radius=.027,mat=None):
        ob=stroke(name+'_'+expr+'_'+label,[(x,face_y(x,.025),z) for x,z in xz],mat or ink,radius)
        bind(ob,'Head'); faces[expr].append(ob)
        return ob
    def oval(expr,label,x,z,w,h,mat=None):
        ob=sphere(name+'_'+expr+'_'+label,(x,face_y(x,.025),z),(w,.025,h),mat or ink)
        bind(ob,'Head'); faces[expr].append(ob)
        return ob
    for e in EXPRESSIONS:
        for x in (-.24,.24):
            if e == 'laugh':
                face_stroke(e,'eye',[(x-.085+i*.017,4.80+.06*math.sin(i*math.pi/10)) for i in range(11)])
            else:
                oval(e,'eye',x,4.81,.051,.092 if e != 'surprised' else .12)
        if e=='happy':
            face_stroke(e,'smile',[(-.23+i*.023,4.56-.13*math.sin(i*math.pi/20)) for i in range(21)],.026)
        elif e=='neutral':
            face_stroke(e,'mouth',[(-.13,4.48),(.13,4.48)],.024)
        elif e=='surprised':
            oval(e,'mouth',0,4.48,.085,.13)
            for x in (-.24,.24):
                face_stroke(e,'brow',[(x-.08,5.015),(x+.08,5.015)],.020)
        elif e=='angry':
            face_stroke(e,'mouth',[(-.17,4.46),(0,4.49),(.17,4.46)])
            face_stroke(e,'browL',[(-.35,5.025),(-.14,4.94)],.030)
            face_stroke(e,'browR',[(.14,4.94),(.35,5.025)],.030)
        elif e=='sad':
            face_stroke(e,'mouth',[(-.17+i*.017,4.40+.09*math.sin(i*math.pi/20)) for i in range(21)])
            face_stroke(e,'browL',[(-.35,4.96),(-.14,5.04)],.023)
            face_stroke(e,'browR',[(.14,5.04),(.35,4.96)],.023)
        else:
            oval(e,'mouth',0,4.47,.22,.17)
            ob=oval(e,'tongue',0,4.39,.13,.048,pink)
            ob.location.y-=.025
        for ob in faces[e]:
            ob['expression'] = e
            ob.hide_render = e != 'happy'
            ob.hide_viewport = e != 'happy'
    rig.select_set(False)
    return {'rig':rig,'collection':collection,'parts':parts,'faces':faces,'name':name}

def set_expression(actor,name,frame=None):
    if name not in EXPRESSIONS:
        raise ValueError(name)
    for e,objects in actor['faces'].items():
        for ob in objects:
            ob.hide_render = ob.hide_viewport = e != name
            if frame is not None:
                ob.keyframe_insert(data_path='hide_render',frame=frame)
                ob.keyframe_insert(data_path='hide_viewport',frame=frame)
    actor['rig']['expression'] = name

def pose(actor, angles=None, root=(0,0,0)):
    rig=actor['rig']
    for b in rig.pose.bones:
        b.rotation_euler=(0,0,0)
        b.location=(0,0,0)
    rig.pose.bones['Root'].location=root
    for name, xyz in (angles or {}).items():
        rig.pose.bones[name].rotation_euler=tuple(math.radians(a) for a in xyz)

def ground_actor(actor, floor=0.0):
    """Raise/lower the actor so the lowest shoe sole touches the floor."""
    bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get()
    feet=[o for o in actor['parts'] if '_Sole.' in o.name]
    points=[]
    for ob in feet:
        ev=ob.evaluated_get(deps)
        points.extend((ev.matrix_world @ Vector(c)).z for c in ev.bound_box)
    if points:
        actor['rig'].location.z += floor-min(points)
    bpy.context.view_layer.update()

def key_pose(actor,frame):
    for b in actor['rig'].pose.bones:
        b.keyframe_insert(data_path='rotation_euler',frame=frame)
        b.keyframe_insert(data_path='location',frame=frame)

def action_pose(kind,phase):
    """Reusable clips: phase is 0..1. Degrees; rigid limbs do not stretch."""
    cyc=math.sin(phase*2*math.pi)
    if kind in ('Walk','Run'):
        stride=25 if kind=='Walk' else 43
        return {'Leg.L':(stride*cyc,0,0),'Leg.R':(-stride*cyc,0,0),
                'Arm.L':(-stride*.7*cyc,0,-3),'Arm.R':(stride*.7*cyc,0,3),
                'Torso':(0,0,3*cyc),'Head':(0,0,-2*cyc)}
    if kind=='Wave':
        return {'Arm.R':(-8,0,125+10*cyc),'Arm.L':(0,0,-6),'Head':(0,-5,6)}
    if kind=='Talk':
        return {'Arm.L':(-20+10*cyc,0,-18),'Arm.R':(-12-8*cyc,0,12),'Head':(3*cyc,0,0)}
    if kind=='Point':
        return {'Arm.R':(-88,0,12),'Arm.L':(0,0,-5),'Head':(0,0,-8)}
    if kind=='Shock':
        return {'Arm.R':(-18,0,45),'Arm.L':(-18,0,-45),'Head':(-9,0,0),'Torso':(-5,0,0)}
    if kind=='Laugh':
        return {'Torso':(8+3*cyc,0,0),'Head':(-10+3*cyc,0,0),'Arm.L':(-18,0,-10),'Arm.R':(-18,0,10)}
    return {'Head':(0,0,1.5*cyc),'Arm.L':(0,0,-3),'Arm.R':(0,0,3)}

def make_actions(actor):
    for kind,length in [('Idle',60),('Walk',30),('Run',20),('Wave',60),('Talk',60),('Point',30),('Shock',30),('Laugh',45)]:
        rig=actor['rig']
        rig.animation_data_clear()
        for f in range(1,length+1):
            pose(actor,action_pose(kind,(f-1)/(length-1)))
            key_pose(actor,f)
        a=rig.animation_data.action
        a.name=actor['name']+'_'+kind
        a.use_fake_user=True
        a.asset_mark()
        a['clip_name']=kind
        a['fps']=30
    rig.animation_data_clear()
    pose(actor)

def load_character(library,name='Max'):
    cname='Character_'+name
    with bpy.data.libraries.load(str(library),link=False) as (src,dst):
        if cname not in src.collections:
            raise ValueError('Unknown character '+name)
        dst.collections=[cname]
    col=dst.collections[0]
    bpy.context.scene.collection.children.link(col)
    rig=next(o for o in col.all_objects if o.type=='ARMATURE')
    faces={e:[o for o in col.all_objects if o.get('expression')==e and o.type=='MESH'] for e in EXPRESSIONS}
    return {'rig':rig,'collection':col,'parts':[o for o in col.all_objects if o.type=='MESH'],'faces':faces,'name':name}

def aim(obj,point):
    obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()

def setup_scene(width=1080,height=1920):
    scene=bpy.context.scene
    # Eevee keeps these small, rigid-character stories economical to render.
    scene.render.engine='BLENDER_EEVEE'
    scene.eevee.taa_render_samples=24
    scene.render.resolution_x=width; scene.render.resolution_y=height
    scene.render.resolution_percentage=100
    scene.render.fps=30
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB'
    scene.render.image_settings.compression=15
    scene.render.film_transparent=False
    scene.view_settings.view_transform='AgX'
    scene.world.color=(.25,.25,.25)
    scene.world.use_nodes=True
    bg=scene.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value=(.35,.48,.68,1)
    bg.inputs['Strength'].default_value=.6
    for name,loc,energy,size,col in [('Key',(-5,-7,10),1600,7,(1,.87,.72)),('Fill',(6,-2,7),1200,6,(.65,.84,1)),('Rim',(2,5,9),1800,5,(.9,.72,1))]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size;data.color=col
        ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc;aim(ob,(0,0,2.5))
    data=bpy.data.cameras.new('Portrait_camera')
    cam=bpy.data.objects.new('Portrait_camera',data)
    scene.collection.objects.link(cam)
    cam.location=(8,-19,11);data.type='ORTHO';data.ortho_scale=10.4
    aim(cam,(0,0,2.65));scene.camera=cam
    return scene

def stage():
    ground=material('Backdrop','A0ACDF')
    platform=material('Platform','DFE7F6')
    trim=material('Platform_trim','7261BC')
    cube('Ground',(0,0,-.48),(200,200,.3),ground,0)
    cylinder('Stage_trim',(0,0,-.18),4.4,.32,trim,.10,96)
    cylinder('Stage_top',(0,0,-.08),4.35,.16,platform,.06,96)
    # Three restrained background blocks add depth without distracting from the actor.
    for i,(x,y,z,s,col) in enumerate([(-4,4,.65,1.3,'F8C564'),(4,5,1.05,2.1,'6BCFCC'),(0,7,.55,1.1,'F396AC')]):
        ob=cube('Backdrop_block_'+str(i),(x,y,z-.4),(s,s,s),material('Decor_'+col,col),.12)
        ob.rotation_euler.z=.20*(i-1)

def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for c in list(bpy.data.collections):
        if not c.objects and c.name!='Collection':
            bpy.data.collections.remove(c)


