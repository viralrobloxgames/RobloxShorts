# Character authoring

## Library

`assets/Block_Characters.blend` contains three collections, 24 motion actions and generated material colours. All meshes and faces were authored procedurally for this pack. `Max`, `Mia` and `Leo` use the same body and hair shape with different colours. The scene is 5.43 block units tall. There are no image textures or external mesh dependencies.

```python
from characters import load_character, pose, key_pose, set_expression, ground_actor
actor = load_character(project / 'assets/Block_Characters.blend', 'Max')
actor['rig'].location = (0, 0, 0)
```

The collection includes six face sets. Use `set_expression(actor, 'happy', 1)` to establish an initial key for all face visibility, then key subsequent expressions. Names are `happy`, `neutral`, `surprised`, `angry`, `sad`, `laugh`. A static expression can omit the frame. Do not key only the new face; the helper hides the old face as well.

## Animation

Rig bones: Root, Torso, Head, Arm.L, Arm.R, Leg.L, Leg.R. One rigid weight group per mesh keeps block shapes intact. The shoulders pivot at the inner sleeve edge, not its top centre. Meshes are not skinned for bending elbows or knees.

`pose(actor, angles)` clears the previous pose and applies local Euler angles in degrees. On Root, Torso and Head, local X is world X, local Y runs upward, and local Z points toward -Y in the rest pose. On the limbs, local Y runs downward. Use the reusable helpers or inspect the pose when inventing a new movement.

```python
scene.frame_set(frame)
pose(actor, action_pose('Walk', phase))
actor['rig'].location = (x, y, 0)
ground_actor(actor, floor=0)
actor['rig'].keyframe_insert(data_path='location', frame=frame)
key_pose(actor, frame)
```

`ground_actor` uses evaluated shoe sole geometry to place the lowest sole on the specified floor. Call after the pose and root placement, before keying. It maintains ground contact, but does not solve locomotion foot sliding or a jump arc. For jumps, author the root height intentionally instead. For stairs, use the relevant surface/contact foot rather than a single global floor.

`action_pose` provides Idle, Walk, Run, Wave, Talk, Point, Shock and Laugh. Walk/Run phase covers one loop; other clips provide a held gesture or rhythmic variation. Blend gestures in/out to avoid snapping. They do not perform hand-contact IK.

The library also stores Blender Actions named `<character>_<clip>`. Append desired Actions explicitly when using Blender's animation editors; appending only the character collection does not load unused action assets. In Blender 5.2 choose the matching Action slot for the rig. The procedural helpers avoid slot ambiguity when authoring from code.

Attach held props to the relevant hand/arm using a bone-relative transform, or animate a constraint handoff at the pickup frame. Check the contact before and after the handoff. These rigid arms cannot stretch to reach a distant target.

## Source and output

Keep each story's `source/characters.py`, `source/build_scene.py` and `assets/Block_Characters.blend` together. Relative paths resolve from each script, not from the current working directory. Render with script auto-execution disabled. Pack any newly added textures into the saved scene.

The motion-test `.blend` is 1080 x 1920 / 30 fps / 240 frames. Its delivered preview may be smaller; render width is recorded in the render manifest and MP4 validation report. `Character_Lineup.png` is a separate high-resolution look reference. A small preview is not a finished 1080p Short.

The first demo has five beats: walk in, wave, surprise, wobble, recover. It uses one continuous camera to expose the animation clearly. Story videos should have motivated shots and specific interactions.
