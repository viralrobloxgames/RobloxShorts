"""Write roblox_pack/animations/: Roblox default R6 animations (read from Studio with KeyframeSequenceProvider,
pulled out of the Studio log by pull_studio_log.py) plus the authored poses from make_poses.py, and index.json.

    python build_animations.py <raw_roblox_anim_dir> <pack_dir>
"""
import json
import sys
from pathlib import Path

import make_poses

JOINT_OF_PART = {"Torso": "RootJoint", "Head": "Neck", "Left Arm": "Left Shoulder", "Right Arm": "Right Shoulder", "Left Leg": "Left Hip", "Right Leg": "Right Hip"}
CONVENTION = ("cframe = Motor6D.Transform as Roblox CFrame components [x,y,z,R00,R01,R02,R10,R11,R12,R20,R21,R22] "
              "(row-major rotation). Part1.CFrame = Part0.CFrame * C0 * Transform * C1:Inverse() (C0/C1 in characters/<Name>/rig.json). "
              "Easing on a pose applies from that keyframe to the next. A joint missing from a keyframe keeps interpolating between its "
              "neighbouring keyframes; weight 0 poses do not drive the joint.")
ROBLOX_NOTES = {
    "idle": "Played 9 times out of 10 by the R6 Animate script (weight 9); idle_lookaround is the other 1 in 10.",
    "run": "R6 has no separate run: the Animate script plays the walk animation (180426354) at speed WalkSpeed / 14.5. See 'sprint' for an exaggerated authored run.",
    "tool_hold": "Only drives the right arm; layer it over idle/walk while holding a tool.",
    "tool_slash": "Only drives the right arm; one-shot sword slash.",
    "tool_lunge": "One-shot lunge used by the classic sword.",
    "point": "Roblox's point emote points with the LEFT arm. See 'point_forward' for a right-arm version.",
}
LEGACY = {  # names used by the old procedural rig (web/lib/rig.js actionPose) and CircleToons pose modes
    "rig.js actionPose": {"Idle": "idle", "Walk": "walk", "Run": "run (or sprint)", "Wave": "wave", "Talk": "talk", "Point": "point_forward", "Shock": "shock", "Laugh": "laugh_big"},
    "admin_clip.js poses": {"HERO": "hero", "CHEER": "cheer / celebrate", "TYPE": "typing", "POINT": "point_forward", "POINT_UP": "point_up", "SCHEME": "scheming", "HOLD": "hold", "fly pose": "fly", "tiny stomp": "stomp"},
    "CircleToons pose modes": {"idle": "idle", "walk": "walk", "think": "think", "proud": "proud", "panic": "panic", "defeated": "defeated", "look_up": "look_up", "duck": "duck", "aim": "aim"},
}


def normalise_roblox(d):
    kfs = []
    for k in d["keyframes"]:
        poses = k["poses"] if isinstance(k["poses"], dict) else {}
        out = {}
        for part, p in poses.items():
            joint = JOINT_OF_PART.get(part, p.get("joint", part))
            out[joint] = {"part": part, "parentPart": p["parentPart"], "cframe": p["cframe"], "weight": p["weight"],
                          "easingStyle": p["easingStyle"], "easingDirection": p["easingDirection"]}
        kfs.append({"time": k["time"], "name": k.get("name", ""), "poses": out, "markers": k.get("markers") if isinstance(k.get("markers"), list) else []})
    return kfs


def main():
    raw, pack = Path(sys.argv[1]), Path(sys.argv[2])
    out = pack / "animations"
    out.mkdir(parents=True, exist_ok=True)
    index = []
    for f in sorted(raw.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        name = f.stem
        kfs = normalise_roblox(d)
        a = {"name": name, "type": "roblox_default", "category": "roblox_default",
             "source": {"assetId": d["assetId"], "assetName": d.get("assetName"), "creator": d.get("creator"), "robloxMade": d.get("creator") == "Roblox",
                        "free": True, "owned": "not required (Roblox default animation)", "from": d.get("source"), "loadedWith": "KeyframeSequenceProvider:GetKeyframeSequenceAsync"},
             "loop": d["loop"], "priority": d["priority"], "length": kfs[-1]["time"], "joints": sorted({j for k in kfs for j in k["poses"]}),
             "transformConvention": CONVENTION, "keyframes": kfs}
        if name in ROBLOX_NOTES:
            a["note"] = ROBLOX_NOTES[name]
        (out / f"{name}.json").write_text(json.dumps(a, indent=1), encoding="utf-8")
        index.append(a)
        if name == "walk":                                   # R6 run = walk played faster
            r = dict(a, name="run", note=ROBLOX_NOTES["run"], playbackSpeed={"formula": "WalkSpeed / 14.5", "at_16": round(16 / 14.5, 3), "at_24": round(24 / 14.5, 3)})
            r["source"] = dict(a["source"], **{"from": "R6 Animate script: Animate.run (RunAnim uses the walk asset 180426354)"})
            (out / "run.json").write_text(json.dumps(r, indent=1), encoding="utf-8")
            index.append(r)
    for a in make_poses.ANIMS:
        a = dict(a, joints=list(make_poses.JOINTS), transformConvention=CONVENTION)
        (out / f"{a['name']}.json").write_text(json.dumps(a, indent=1), encoding="utf-8")
        index.append(a)
    summary = {"count": len(index), "transformConvention": CONVENTION, "legacyNames": LEGACY,
               "animations": [{"name": a["name"], "type": a["type"], "category": a.get("category"), "loop": a["loop"], "length": a["length"],
                               "keyframes": len(a["keyframes"]), "assetId": a["source"].get("assetId"), "robloxMade": a["source"].get("robloxMade", False),
                               "description": a.get("description") or a["source"].get("assetName"), "note": a.get("note")} for a in index]}
    (out / "index.json").write_text(json.dumps(summary, indent=1), encoding="utf-8")
    print(len(index), "animations written to", out)


if __name__ == "__main__":
    main()
