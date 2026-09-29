"""Build the packed, baked GarageFarm scene for The AFK Champion. This script NEVER renders.
Run: blender --background --factory-startup --python source/afk_scene.py"""
import bpy, sys, math, json, hashlib, time
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
S = Path(__file__).resolve().parent; OUT = S.parent
sys.path.insert(0, str(S))
from characters import *
from afk_timeline import *
import afk_env, afk_actors, afk_props
from afk_actors import leo, maxx, mia, leo_press, EXPR, LEO_HOME

started = time.time()
QUICK = '--quick' in sys.argv  # sparse bake for a smoke test; never used for the farm
reset(); scene = setup_scene(1080, 1920)
scene.frame_start = 1; scene.frame_end = END
scene.render.use_motion_blur = False; scene.render.image_settings.color_depth = '8'
scene.render.filepath = '//renders/AFK_Champion_'
# Pale sky: the hook's dark wave must read against it instantly.
bg = scene.world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (.60, .80, 1.0, 1); bg.inputs['Strength'].default_value = .9
M, O = afk_env.build()

lib = OUT / 'assets/Block_Characters.blend'
ACT = {n: load_character(lib, n) for n in ('Leo', 'Max', 'Mia')}
STATE = {'Leo': None, 'Max': maxx, 'Mia': mia}

# Calibrate the analytic sole height against the kit's evaluated ground_actor once.
SIGN = 1.0
def low(angles):
    best = 9e9
    for leg in ('Leg.L', 'Leg.R'):
        a = math.radians(angles.get(leg, (0, 0, 0))[0])
        for yy in (-.745, .545):
            best = min(best, 2.04 + SIGN * yy * math.sin(a) - 2.005 * math.cos(a))
    return best
probe = ACT['Max']; ang = action_pose('Run', .25)
pose(probe, ang); probe['rig'].location = (0, 0, 0); ground_actor(probe, 0.0)
measured = probe['rig'].location.z
errs = {}
for s in (1.0, -1.0):
    SIGN = s; errs[s] = abs(measured + low(ang))
SIGN = min(errs, key=errs.get)
print('sole calibration', measured, errs, 'SIGN', SIGN)

def hand_center(actor, side='R'):
    bpy.context.view_layer.update()
    r = actor['rig']; b = r.pose.bones['Arm.' + side]
    return r.matrix_world @ b.matrix @ b.bone.matrix_local.inverted() @ Vector(((-1 if side == 'R' else 1) * 1.53, 0, 2.31))

# Ready button sits under Leo's pressing hand.
leoA = ACT['Leo']; pa = {'Arm.R': (-45, 0, 0)}
pose(leoA, pa); leoA['rig'].location = (LEO_HOME[0], LEO_HOME[1], -low(pa)); leoA['rig'].rotation_euler = (0, 0, 0)
h = hand_center(leoA); press_cap = (h.x, h.y, h.z - .40)
TRACKS = afk_props.tracks(O, press_cap)
ORIG = {ob.name: (tuple(ob.location), tuple(ob.rotation_euler), tuple(ob.scale)) for ob, _, _ in TRACKS}

def apply(actor, st, f):
    rig = actor['rig']; ang = st.get('angles', {})
    pose(actor, ang)
    s = st.get('scale', 1.0); x, y = st['pos']
    z = st['z'] if 'z' in st else st['floor'] - low(ang) * s
    tx, ty = st.get('tilt', (0, 0))
    rig.location = (x, y, z)
    rig.rotation_euler = (math.radians(tx), math.radians(ty), math.radians(st.get('yaw', 0.0)))
    rig.scale = (s, s, s)
    for prop in ('location', 'rotation_euler', 'scale'):
        rig.keyframe_insert(prop, frame=f)
    for b in rig.pose.bones:
        b.keyframe_insert('rotation_euler', frame=f)

for f in range(1, END + 1, 45 if QUICK else 1):
    t = T(f)
    for name, actor in ACT.items():
        st = leo(t, leo_press(t)) if name == 'Leo' else STATE[name](t)
        apply(actor, st, f)
    for ob, windows, fn in TRACKS:
        active = any(a <= t < b for a, b in windows)
        near = f == 1 or any(a - 2 / FPS <= t < b + 2 / FPS for a, b in windows)
        if not near:
            continue
        loc, rot, scl = ORIG[ob.name]
        if active:
            if fn is None:   # AFK tag follows Leo
                rl = ACT['Leo']['rig'].location
                loc, rot, scl = (rl.x, rl.y - .1, rl.z + 6.35), None, None
            else:
                loc, rot, scl = fn(t)
            ob.location = loc
            if rot is not None: ob.rotation_euler = rot
            if scl is not None: ob.scale = scl
            ob.keyframe_insert('location', frame=f)
            if rot is not None: ob.keyframe_insert('rotation_euler', frame=f)
            if scl is not None: ob.keyframe_insert('scale', frame=f)
        else:
            ob.location = (loc[0], loc[1], loc[2] - 200)
            ob.keyframe_insert('location', frame=f)
    if f % 150 == 0:
        print('baked frame', f, 'of', END, round(time.time() - started), 's', flush=True)

for name, keys in EXPR.items():
    for t, e in keys:
        set_expression(ACT[name], e, F(t))

cam = scene.camera; cam.data.type = 'ORTHO'; cam.data.clip_start = 1; cam.data.clip_end = 140
for t, title, target, size, az, el, _ in SHOTS:
    cam.location = cam_pose(target, az, el); aim(cam, target); cam.data.ortho_scale = size
    cam.keyframe_insert('location', frame=F(t)); cam.keyframe_insert('rotation_euler', frame=F(t))
    cam.data.keyframe_insert('ortho_scale', frame=F(t))
    scene.timeline_markers.new(title, frame=F(t))

def curves(block):
    ad = block.animation_data
    if not ad or not ad.action:
        return []
    action = ad.action
    if hasattr(action, 'fcurves'):
        return list(action.fcurves)
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out
# Every moving channel is keyed on each frame it changes, so CONSTANT is exact and cuts never smear.
for block in list(bpy.data.objects) + list(bpy.data.cameras):
    for fc in curves(block):
        for k in fc.keyframe_points:
            k.interpolation = 'CONSTANT'

scene['title'] = 'The AFK Champion'; scene['render_destination'] = 'GarageFarm via Brave'; scene['no_local_render'] = True
scene['narration_duration_seconds'] = 63.88
for tb in bpy.data.texts:
    tb.use_module = False
bpy.ops.file.pack_all()
assert not any(o.library for o in bpy.data.objects), 'Unexpected linked objects'
scene.frame_set(1)
farmfile = (Path(bpy.app.tempdir) / 'afk_quick.blend') if QUICK else OUT / 'The_AFK_Champion_GarageFarm.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(farmfile), compress=True)

# Composition checks. Cheap stand-in for watching a render: the featured actor must be whole
# and big enough in frame, the props the beat depends on must be fully visible, and nothing
# may cover the actor's face.
def head_ndc(actor):
    r = actor['rig']; hb = r.pose.bones['Head']
    p = r.matrix_world @ hb.matrix @ hb.bone.matrix_local.inverted() @ Vector((0, 0, 4.73))
    return world_to_camera_view(scene, cam, p), p

# Props each shot must show completely (keys into the env dictionary O).
SHOT_PROPS = {
    'Hook: wave and AFK Leo': ['afk'], 'Hook: wave looms': ['afk'],
    'A wall': ['rock'], 'Tornado takes the meteor': ['tornado'],
    'Lobby: last disaster': ['kick_panel'], 'Kick all AFK players': ['kick_panel'],
    'bye Leo': ['bubble'], 'Player active': ['active'],
    'Winner': ['winner'], 'Pressed ready': ['ready_cap'],
}
MIN_SUBJECT_HEIGHT = {'wide': .10, 'normal': .16}


def bbox_ndc(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    pts = [world_to_camera_view(scene, cam, ev.matrix_world @ Vector(c)) for c in ev.bound_box]
    return (min(p.x for p in pts), max(p.x for p in pts), min(p.y for p in pts), max(p.y for p in pts))


checks, problems = [], []
for i, (t0, title, target, size, az, el, who) in enumerate(SHOTS):
    t1 = SHOTS[i + 1][0] if i + 1 < len(SHOTS) else SECONDS
    for t in (t0 + .1, (t0 + t1) / 2, t1 - .1):
        f = F(t); scene.frame_set(f)
        note = {'shot': title, 'frame': f}
        if who:
            ndc, p = head_ndc(ACT[who])
            rig = ACT[who]['rig']
            feet = world_to_camera_view(scene, cam, rig.matrix_world.translation)
            height = abs(ndc.y - feet.y)
            ok = .05 < ndc.x < .95 and .10 < ndc.y < .94 and p.z > -50
            if size >= 8:   # close-ups (small ortho) intentionally crop below the waist
                ok = ok and .04 < feet.x < .96 and .03 < feet.y < .92
            ok = ok and height >= (MIN_SUBJECT_HEIGHT['wide'] if size >= 18 else MIN_SUBJECT_HEIGHT['normal'])
            # Occlusion: cast from just in front of the face back toward the orthographic camera.
            fwd = (cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))).normalized()
            dg = bpy.context.evaluated_depsgraph_get()
            hit, _, _, _, hob, _ = scene.ray_cast(dg, p - fwd * 1.0, -fwd)
            see_through = hit and hob.data and getattr(hob.data, 'materials', None) and any(
                m and m.blend_method == 'BLEND' for m in hob.data.materials)
            blocker = hob.name if hit and hob not in ACT[who]['parts'] and not see_through else None
            ok = ok and blocker is None
            note.update(actor=who, head_ndc=[round(v, 3) for v in ndc], subject_height=round(height, 3), blocked_by=blocker, ok=ok)
            if not ok:
                problems.append((title, f, who, [round(v, 2) for v in ndc], round(height, 2), blocker))
        for key in SHOT_PROPS.get(title, []):
            x0, x1, y0, y1 = bbox_ndc(O[key])
            pok = x0 > .02 and x1 < .98 and y0 > .04 and y1 < .96
            note[key] = [round(v, 2) for v in (x0, x1, y0, y1)]
            if not pok:
                problems.append((title, f, 'PROP ' + key, [round(v, 2) for v in (x0, x1, y0, y1)]))
        checks.append(note)
testframes = sorted({1, 16, 31, 61} | {F(x) for x in (9.0, 10.5, 12.5, 14.2, 16.4, 18.0, 21.0, 24.6, 28.5, 30.5, 31.6, 34.0,
                                                      36.8, 38.0, 39.0, 41.5, 45.0, 47.0, 49.5, 51.4, 52.4, 53.8, 54.6,
                                                      55.1, 57.0, 60.0, 61.9, 64.0)})
manifest = {'title': scene['title'], 'file': farmfile.name, 'sha256': hashlib.sha256(farmfile.read_bytes()).hexdigest(),
            'blender': bpy.app.version_string, 'engine': scene.render.engine, 'width': 1080, 'height': 1920, 'fps': FPS,
            'frame_start': 1, 'frame_end': END, 'seconds': SECONDS, 'test_frames': testframes,
            'objects': len(bpy.data.objects), 'linked_libraries': 0, 'autoexec_required': False,
            'local_render_performed': False, 'sole_sign': SIGN, 'framing_problems': problems, 'checks': checks,
            'build_seconds': round(time.time() - started)}
if QUICK:
    print('FRAMING PROBLEMS:', problems); sys.exit(0)
(S / 'farm_manifest.json').write_text(json.dumps(manifest, indent=2))
(S / 'shots.json').write_text(json.dumps([{'start': s[0], 'end': SHOTS[i + 1][0] if i + 1 < len(SHOTS) else SECONDS, 'title': s[1]}
                                          for i, s in enumerate(SHOTS)], indent=2))
(S / 'project.json').write_text(json.dumps({'title': 'The AFK Champion', 'characters': ['Leo', 'Max', 'Mia'], 'seconds': SECONDS,
                                            'fps': FPS, 'width': 1080, 'height': 1920,
                                            'status': 'Packed baked scene; awaiting GarageFarm test frames'}, indent=2))
print('FRAMING PROBLEMS:', problems)
print('saved', farmfile, 'objects', len(bpy.data.objects), 'seconds', round(time.time() - started))
