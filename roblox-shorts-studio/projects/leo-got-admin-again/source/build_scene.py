"""Editable story stage. Run with Blender, then replace the idle with story beats."""
import bpy,sys,json
from pathlib import Path
S=Path(__file__).resolve().parent;OUT=S.parent
sys.path.insert(0,str(S))
from characters import *
cfg=json.loads((S/'project.json').read_text())
reset();scene=setup_scene(cfg['width'],cfg['height']);stage()
actor=load_character(OUT/'assets'/'Block_Characters.blend',cfg['character'])
actor['rig'].location=(0,0,0)
scene.render.fps=cfg['fps'];scene.frame_start=1;scene.frame_end=round(cfg['seconds']*cfg['fps'])
for f in range(1,scene.frame_end+1):
    pose(actor,action_pose('Idle',(f-1)/60));key_pose(actor,f)
set_expression(actor,'happy')
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Story.blend'))
