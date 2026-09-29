import bpy, sys, json
from pathlib import Path
S=Path(__file__).resolve().parent
sys.path.insert(0,str(S))
from characters import *

ROOT=S.parent
OUT=ROOT/'assets'
OUT.mkdir(exist_ok=True)
reset()
actors=[]
for i,name in enumerate(PALETTES):
    actor=make_character(name)
    make_actions(actor)
    actor['rig'].location.x=(i-1)*5.4
    actor['collection'].asset_mark()
    actor['collection'].asset_data.description='Original rigid block actor, six expressions, eight reusable motion clips. Append collection with rig and meshes.'
    actors.append(actor)
scene=setup_scene(1920,1080)
scene.camera.location=(10,-26,13)
scene.camera.data.ortho_scale=19
aim(scene.camera,(0,0,2.55))
cube('Library_ground',(0,0,-.11),(200,200,.20),material('Library_background','D7DFF3'),0)
scene.frame_start=1;scene.frame_end=60
bpy.context.view_layer.objects.active=actors[0]['rig']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Block_Characters.blend'))
manifest={
    'version':'0.1.0','kind':'Roblox-style original block character prototype',
    'provenance':'All geometry and face marks authored locally. No Roblox Studio, Sketchfab or CircleToons models copied.',
    'characters':list(PALETTES),'expressions':list(EXPRESSIONS),
    'actions':['Idle','Walk','Run','Wave','Talk','Point','Shock','Laugh'],
    'rig':{'bones':7,'body_style':'rigid six-part block body with cylindrical head','forward':'-Y','up':'Z','ground':'z=0','height':5.43},
    'library':'Block_Characters.blend','blender_version':bpy.app.version_string,
    'limitations':['Original Roblox-style designs, not official Roblox avatars.','Palette variants share one body and hair design.','No elbow, knee, finger or lip-sync articulation in this first block rig.','Eight actions are authored; the demo visually tests walk, wave, shock and recovery.'],
}
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
scene.render.filepath=str(OUT/'Character_Lineup.png')
if '--no-render' not in sys.argv: bpy.ops.render.render(write_still=True)
print('PACK_READY',flush=True)

