import bpy,sys,json
from pathlib import Path
S=Path(__file__).resolve().parents[2];sys.path.insert(0,str(S/'scripts'))
from characters import *
reset();actor=load_character(S/'assets'/'Block_Characters.blend','Max');actor['rig'].location=(0,0,0)
scene=setup_scene(420,560);scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH';scene.display.shading.show_specular_highlight=True
scene.display.shading.background_type='WORLD';scene.world.color=(.72,.77,.85)
scene.camera.data.ortho_scale=9.4;scene.camera.location=(5,-20,8);aim(scene.camera,(0,0,2.65))
OUT=S/'review'/'poses';OUT.mkdir(parents=True,exist_ok=True)
entries=[('Idle','neutral'),('Walk','happy'),('Run','surprised'),('Wave','happy'),('Talk','sad'),('Point','angry'),('Shock','surprised'),('Laugh','laugh')]
for i,(kind,face) in enumerate(entries):
    pose(actor,action_pose(kind,.25));set_expression(actor,face);ground_actor(actor)
    scene.render.filepath=str(OUT/f'{i+1:02d}_{kind}.png');bpy.ops.render.render(write_still=True)
(OUT/'index.json').write_text(json.dumps(entries))
