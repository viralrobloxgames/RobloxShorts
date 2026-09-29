"""Check asset completeness, framing and foot contact from evaluated Blender geometry."""
import argparse,bpy,sys,json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
p=argparse.ArgumentParser();p.add_argument('--scene',required=True);p.add_argument('--out',required=True);p.add_argument('--kind',choices=['library','demo'],required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);bpy.ops.wm.open_mainfile(filepath=str(Path(a.scene).resolve()))
s=bpy.context.scene;errors=[]
rigs=[o for o in s.objects if o.type=='ARMATURE']
for rig in rigs:
    if len(rig.data.bones)!=7:errors.append('Unexpected skeleton: '+rig.name)
    meshes=[o for o in s.objects if o.parent==rig and o.type=='MESH']
    for ob in meshes:
        if not any(m.type=='ARMATURE' and m.object==rig for m in ob.modifiers):errors.append('Unbound mesh: '+ob.name)
        for v in ob.data.vertices:
            if abs(sum(g.weight for g in v.groups)-1)>1e-5:errors.append('Unweighted vertex: '+ob.name);break
    expressions={o.get('expression') for o in meshes if o.get('expression')}
    if expressions!={'happy','neutral','surprised','angry','sad','laugh'}:errors.append('Missing expression: '+rig.name)
report={'scene':Path(a.scene).name,'rigs':[o.name for o in rigs],'mesh_count':len([o for o in s.objects if o.type=='MESH']),'actions':len(bpy.data.actions),'errors':errors}
if a.kind=='library':
    if len(rigs)!=3:errors.append('Expected three character variants')
    if len([a for a in bpy.data.actions if a.get('clip_name')])!=24:errors.append('Expected eight clips per character')
else:
    feet=[o for o in s.objects if '_Sole.' in o.name]
    parts=[o for o in s.objects if o.parent in rigs and o.type=='MESH']
    min_edge=1.;max_ground_error=0.;bad_frames=[]
    for f in range(s.frame_start,s.frame_end+1):
        s.frame_set(f);deps=bpy.context.evaluated_depsgraph_get()
        sole_z=[]
        for ob in feet:
            ev=ob.evaluated_get(deps);sole_z.extend((ev.matrix_world@Vector(c)).z for c in ev.bound_box)
        ground_error=abs(min(sole_z));max_ground_error=max(max_ground_error,ground_error)
        for ob in parts:
            if ob.hide_render:continue
            ev=ob.evaluated_get(deps)
            for c in ev.bound_box:
                pt=world_to_camera_view(s,s.camera,ev.matrix_world@Vector(c))
                edge=min(pt.x,pt.y,1-pt.x,1-pt.y);min_edge=min(min_edge,edge)
                if edge<.025 or pt.z<=0:bad_frames.append(f)
    report.update(frames_checked=s.frame_end-s.frame_start+1,minimum_frame_margin=round(min_edge,5),maximum_sole_ground_error=round(max_ground_error,5),clipped_frames=sorted(set(bad_frames)))
    if bad_frames:errors.append('Actor crosses 2.5% frame margin')
    if max_ground_error>.025:errors.append('Foot contact exceeds 0.025 block units')
report['passed']=not errors
Path(a.out).write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2),flush=True)
if errors:raise RuntimeError('Asset validation failed')
