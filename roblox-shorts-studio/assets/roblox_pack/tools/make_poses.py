"""Original R6 poses/animations for the pack, written in the same JSON format as the Roblox default animations.

Poses are authored as intuitive rotations of each body part about its joint, in the character frame
(+X = character's right, +Y = up, +Z = back; the character faces -Z):
    pitch  > 0 : arms/legs swing forward (hand/foot moves toward -Z); head/torso tilt forward (look down / lean in)
    roll   > 0 : arms/legs lift outward to the side (mirrored for the left side); head/torso tilt to the character's right
    yaw    > 0 : twist toward the character's left (for arms: turn the hand inward across the body when > 0 on either side)
and converted to Motor6D.Transform:  T = Rj^T * Q * Rj,  where Rj is the joint's C0 rotation (C0 and C1 share it in R6).
Root offsets move the whole body (RootJoint translation, in the character frame).

    python make_poses.py <animations_dir>
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

JOINTS = {  # joint: (part1, part0, C0 rotation rows)
    "RootJoint": ("Torso", "HumanoidRootPart", [[-1, 0, 0], [0, 0, 1], [0, 1, 0]]),
    "Neck": ("Head", "Torso", [[-1, 0, 0], [0, 0, 1], [0, 1, 0]]),
    "Right Shoulder": ("Right Arm", "Torso", [[0, 0, 1], [0, 1, 0], [-1, 0, 0]]),
    "Left Shoulder": ("Left Arm", "Torso", [[0, 0, -1], [0, 1, 0], [1, 0, 0]]),
    "Right Hip": ("Right Leg", "Torso", [[0, 0, 1], [0, 1, 0], [-1, 0, 0]]),
    "Left Hip": ("Left Leg", "Torso", [[0, 0, -1], [0, 1, 0], [1, 0, 0]]),
}
ALIAS = {"torso": "RootJoint", "head": "Neck", "arm_r": "Right Shoulder", "arm_l": "Left Shoulder", "leg_r": "Right Hip", "leg_l": "Left Hip"}


def rx(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def ry(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rz(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def q_for(joint, pitch=0.0, roll=0.0, yaw=0.0):
    """Intuitive angles (degrees) -> rotation of the part in the character frame."""
    p, r, y = (math.radians(v) for v in (pitch, roll, yaw))
    side = -1 if joint in ("Left Shoulder", "Left Hip") else 1
    if joint in ("Right Shoulder", "Left Shoulder", "Right Hip", "Left Hip"):
        # limb hangs along -Y: +pitch moves it toward -Z (rotation about +X), +roll lifts it outward, +yaw turns inward
        return ry(side * y) @ rx(p) @ rz(side * r)
    # head / torso: +pitch tilts forward (about -X), +roll tilts to the right (about -Z), +yaw turns left (about +Y)
    return ry(y) @ rx(-p) @ rz(-r)


def transform(joint, pitch=0.0, roll=0.0, yaw=0.0, offset=(0.0, 0.0, 0.0)):
    Rj = np.array(JOINTS[joint][2], dtype=float)
    Q = q_for(joint, pitch, roll, yaw)
    T = Rj.T @ Q @ Rj
    t = Rj.T @ np.array(offset, dtype=float)            # translation expressed in the joint frame
    comps = [t[0], t[1], t[2], T[0, 0], T[0, 1], T[0, 2], T[1, 0], T[1, 1], T[1, 2], T[2, 0], T[2, 1], T[2, 2]]
    return [round(float(v), 6) + 0.0 for v in comps]


def pose(spec, easing="Cubic", direction="InOut"):
    out = {}
    for key, v in spec.items():
        joint = ALIAS[key]
        v = dict(v)
        off = v.pop("offset", (0, 0, 0))
        out[joint] = {"part": JOINTS[joint][0], "parentPart": JOINTS[joint][1], "cframe": transform(joint, offset=off, **v),
                      "weight": 1, "easingStyle": easing, "easingDirection": direction, "intent": {**v, **({"offset": list(off)} if any(off) else {})}}
    for joint, (part1, part0, _) in JOINTS.items():      # every joint keyed on every frame (rest if unspecified)
        if joint not in out:
            out[joint] = {"part": part1, "parentPart": part0, "cframe": transform(joint), "weight": 1, "easingStyle": easing, "easingDirection": direction, "intent": {}}
    return out


def anim(name, desc, frames, loop, category, easing="Cubic"):
    kfs = [{"time": round(t, 4), "name": "", "poses": pose(spec, easing), "markers": []} for t, spec in frames]
    return {"name": name, "type": "authored", "category": category, "description": desc,
            "source": {"robloxMade": False, "free": True, "author": "Original pose authored for this pack (tools/make_poses.py)"},
            "loop": loop, "priority": "Action", "length": kfs[-1]["time"], "keyframes": kfs}


def cyc(n, length, fn):
    """n+1 evenly spaced keyframes over a loop; fn(phase 0..1) -> spec."""
    return [(length * i / n, fn(i / n)) for i in range(n + 1)]


S = math.sin
TAU = 2 * math.pi
REST = {}

ANIMS = [
    anim("talk", "Chatty gestures with a small head nod (loop).", cyc(4, 1.0, lambda u: {
        "arm_r": {"pitch": 22 + 12 * S(TAU * u), "roll": 10}, "arm_l": {"pitch": 12, "roll": 8 + 5 * S(TAU * u + 1.2)},
        "head": {"pitch": 4 * S(2 * TAU * u)}, "torso": {"yaw": 3 * S(TAU * u)}}), True, "gesture"),
    anim("shock", "Jolt of surprise: arms flung out, lean back (hold the last frame).", [
        (0.0, REST), (0.12, {"arm_r": {"pitch": 25, "roll": 48}, "arm_l": {"pitch": 25, "roll": 48}, "head": {"pitch": -10}, "torso": {"pitch": -6}}),
        (0.3, {"arm_r": {"pitch": 20, "roll": 42}, "arm_l": {"pitch": 20, "roll": 42}, "head": {"pitch": -8}, "torso": {"pitch": -5}})], False, "reaction", "Back"),
    anim("think", "Hand raised to the chin, head tilted.", [(0.0, REST), (0.4, {
        "arm_r": {"pitch": 128, "yaw": 38, "roll": 4}, "arm_l": {"pitch": 58, "yaw": 42}, "head": {"pitch": -6, "roll": 9, "yaw": 8}})], False, "pose"),
    anim("proud", "Chest out, chin up, hands on hips.", [(0.0, REST), (0.35, {
        "arm_r": {"pitch": -12, "roll": 28}, "arm_l": {"pitch": -12, "roll": 28}, "head": {"pitch": -12}, "torso": {"pitch": -6}})], False, "pose"),
    anim("panic", "Arms flailing overhead, head shaking (loop).", cyc(4, 0.4, lambda u: {
        "arm_r": {"roll": 158 + 16 * S(TAU * u), "pitch": 10}, "arm_l": {"roll": 158 - 16 * S(TAU * u), "pitch": 10},
        "head": {"yaw": 16 * S(TAU * u)}, "torso": {"yaw": -5 * S(TAU * u)}}), True, "reaction", "Linear"),
    anim("defeated", "Head hung, shoulders slumped.", [(0.0, REST), (0.6, {
        "head": {"pitch": 26}, "torso": {"pitch": 10}, "arm_r": {"pitch": 8, "roll": 2}, "arm_l": {"pitch": 8, "roll": 2}})], False, "pose"),
    anim("look_up", "Looking up at the sky.", [(0.0, REST), (0.4, {"head": {"pitch": -32}, "torso": {"pitch": -5}})], False, "pose"),
    anim("duck", "Duck and cover: lean in, arms over the head.", [(0.0, REST), (0.25, {
        "torso": {"pitch": 32, "offset": (0, -0.15, 0)}, "leg_r": {"pitch": -32}, "leg_l": {"pitch": -32},
        "arm_r": {"pitch": 150, "roll": 22, "yaw": 20}, "arm_l": {"pitch": 150, "roll": 22, "yaw": 20}, "head": {"pitch": 14}})], False, "reaction"),
    anim("aim", "Aim a held tool forward with both hands.", [(0.0, REST), (0.3, {
        "arm_r": {"pitch": 90, "yaw": 6}, "arm_l": {"pitch": 82, "yaw": 34}, "torso": {"yaw": -8}, "head": {"pitch": 2, "yaw": -6}})], False, "action"),
    anim("typing", "Typing on a keyboard / chat (loop).", cyc(4, 0.3, lambda u: {
        "arm_r": {"pitch": 60 + 7 * S(TAU * u), "yaw": 14}, "arm_l": {"pitch": 60 + 7 * S(TAU * u + math.pi), "yaw": 14},
        "head": {"pitch": 12}, "torso": {"pitch": 4}}), True, "action", "Linear"),
    anim("scheming", "Hands together, fingers tapping, leaning in (loop).", cyc(4, 0.7, lambda u: {
        "arm_r": {"pitch": 55, "yaw": 32, "roll": 4 * S(TAU * u)}, "arm_l": {"pitch": 55, "yaw": 32, "roll": -4 * S(TAU * u)},
        "head": {"pitch": 6}, "torso": {"pitch": 7}}), True, "gesture", "Linear"),
    anim("hold", "Hold an object forward in the right hand, looking at it.", [(0.0, REST), (0.3, {
        "arm_r": {"pitch": 80, "yaw": 18}, "arm_l": {"pitch": 6, "roll": 6}, "head": {"pitch": 14, "yaw": -6}, "torso": {"pitch": 3}})], False, "action"),
    anim("point_forward", "Point straight ahead (static).", [(0.0, REST), (0.2, {"arm_r": {"pitch": 90, "roll": 6}, "head": {"yaw": -4}})], False, "gesture"),
    anim("point_up", "Point at the sky.", [(0.0, REST), (0.25, {"arm_r": {"pitch": 168, "roll": 8}, "head": {"pitch": -22}, "torso": {"pitch": -4}})], False, "gesture"),
    anim("fly", "Superhero flight pose: one fist up, legs trailing (use while the root moves).", [(0.0, REST), (0.3, {
        "arm_r": {"pitch": 172}, "arm_l": {"pitch": -18, "roll": 20}, "leg_r": {"pitch": -24}, "leg_l": {"pitch": 10}, "head": {"pitch": -14}})], False, "action"),
    anim("stomp", "Tiny angry stomping, arms up (loop).", cyc(4, 0.26, lambda u: {
        "arm_r": {"roll": 150 - 25 * S(TAU * u)}, "arm_l": {"roll": 150 + 25 * S(TAU * u)},
        "leg_r": {"pitch": 22 * max(0.0, S(TAU * u))}, "leg_l": {"pitch": 22 * max(0.0, -S(TAU * u))}, "head": {"pitch": 12},
        "torso": {"offset": (0, 0.12 * abs(S(TAU * u)), 0)}}), True, "reaction", "Linear"),
    anim("hero", "Confident hero stance.", [(0.0, REST), (0.3, {"arm_r": {"roll": 14}, "arm_l": {"roll": 14}, "head": {"pitch": -6}, "torso": {"pitch": -3}})], False, "pose"),
    anim("shrug", "Who knows? Palms-up shrug.", [(0.0, REST), (0.25, {
        "arm_r": {"pitch": 22, "roll": 36}, "arm_l": {"pitch": 22, "roll": 36}, "head": {"roll": 10, "pitch": -4}}), (0.7, {
        "arm_r": {"pitch": 18, "roll": 32}, "arm_l": {"pitch": 18, "roll": 32}, "head": {"roll": 8}})], False, "gesture"),
    anim("facepalm", "Hand to the face.", [(0.0, REST), (0.3, {"arm_r": {"pitch": 142, "yaw": 48}, "head": {"pitch": 16}, "torso": {"pitch": 6}})], False, "reaction"),
    anim("celebrate", "Jumping celebration, arms up (loop).", cyc(4, 0.5, lambda u: {
        "arm_r": {"roll": 158 + 10 * S(TAU * u)}, "arm_l": {"roll": 158 + 10 * S(TAU * u)}, "head": {"pitch": -10},
        "torso": {"offset": (0, 0.5 * abs(S(math.pi * u)), 0)}}), True, "reaction", "Linear"),
    anim("clap", "Clapping (loop).", cyc(4, 0.32, lambda u: {
        "arm_r": {"pitch": 72, "yaw": 30 + 14 * S(TAU * u)}, "arm_l": {"pitch": 72, "yaw": 30 + 14 * S(TAU * u)}, "head": {"pitch": -4}}), True, "gesture", "Linear"),
    anim("push", "Pushing forward with both hands.", [(0.0, REST), (0.3, {
        "arm_r": {"pitch": 88, "roll": 4}, "arm_l": {"pitch": 88, "roll": 4}, "torso": {"pitch": 12}, "leg_r": {"pitch": -14}, "leg_l": {"pitch": 10}})], False, "action"),
    anim("carry_overhead", "Holding something above the head with both hands.", [(0.0, REST), (0.4, {
        "arm_r": {"pitch": 172, "roll": 12}, "arm_l": {"pitch": 172, "roll": 12}, "head": {"pitch": -10}})], False, "action"),
    anim("knocked_out", "Flat on the back, arms spread (root lowered so the back rests on y = 0).", [(0.0, REST), (0.35, {
        "torso": {"pitch": -90, "offset": (0, -2.5, 0)}, "arm_r": {"roll": 62}, "arm_l": {"roll": 62}, "leg_r": {"roll": 10}, "leg_l": {"roll": 10}, "head": {"roll": 12}})], False, "reaction"),
    anim("sprint", "Fast cartoon run with big swings (loop; move the root at ~25 studs/s).", cyc(8, 0.5, lambda u: {
        "arm_r": {"pitch": -55 * S(TAU * u)}, "arm_l": {"pitch": 55 * S(TAU * u)}, "leg_r": {"pitch": 50 * S(TAU * u)}, "leg_l": {"pitch": -50 * S(TAU * u)},
        "torso": {"pitch": 12, "offset": (0, 0.18 * abs(S(TAU * u)), 0)}, "head": {"pitch": -8}}), True, "locomotion", "Linear"),
    anim("dizzy", "Wobbly head circles after a spin (loop).", cyc(8, 1.2, lambda u: {
        "head": {"roll": 12 * S(TAU * u), "pitch": 8 * math.cos(TAU * u)}, "torso": {"roll": 5 * S(TAU * u + 0.8)},
        "arm_r": {"roll": 18 + 8 * S(TAU * u)}, "arm_l": {"roll": 18 - 8 * S(TAU * u)}}), True, "reaction", "Linear"),
    anim("laugh_big", "Belly laugh: leaning back and bouncing (loop).", cyc(4, 0.45, lambda u: {
        "torso": {"pitch": -8 - 3 * S(TAU * u)}, "head": {"pitch": -10 - 4 * S(TAU * u)}, "arm_r": {"pitch": 20, "roll": 10}, "arm_l": {"pitch": 20, "roll": 10}}), True, "reaction", "Linear"),
]


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for a in ANIMS:
        a["joints"] = list(JOINTS)
        a["transformConvention"] = "cframe = Motor6D.Transform as Roblox CFrame components [x,y,z,R00,R01,R02,R10,R11,R12,R20,R21,R22]; Part1.CFrame = Part0.CFrame * C0 * Transform * C1:Inverse()"
        (out / f"{a['name']}.json").write_text(json.dumps(a, indent=1), encoding="utf-8")
        print(a["name"], len(a["keyframes"]), "keyframes", a["length"], "s")


if __name__ == "__main__":
    main()
