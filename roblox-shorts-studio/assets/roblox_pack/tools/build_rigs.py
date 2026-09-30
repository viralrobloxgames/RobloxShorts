"""Write characters/<Name>/rig.json from the rig data read out of Studio (raw_rigs/<Name>.json).

    python build_rigs.py <raw_rigs_dir> <pack_dir>
"""
import json
import sys
from pathlib import Path

import numpy as np

UPLOADS = json.loads((Path(__file__).parent / "uploads.json").read_text(encoding="utf-8"))
HAIR_ITEM = {"LeoHair": "hair_leo", "MaxHair": "hair_max", "MiaHair": "hair_mia"}


def M(c):
    x, y, z, *r = c
    m = np.eye(4)
    m[:3, :3] = np.array(r).reshape(3, 3)
    m[:3, 3] = [x, y, z]
    return m


def main():
    raw, pack = Path(sys.argv[1]), Path(sys.argv[2])
    for f in sorted(raw.glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        name = d["name"]
        parts = {p["name"]: p for p in d["parts"]}
        joints = []
        for m in d["motor6ds"]:
            p0 = parts[m["part0"]]
            pivot = M(p0["cframe"]) @ M(m["c0"])
            joints.append({"name": m["name"], "part0": m["part0"], "part1": m["part1"], "c0": m["c0"], "c1": m["c1"],
                           "pivotInCharacterSpace": [round(float(v), 4) for v in pivot[:3, 3]], "parentInstance": m["parent"]})
        clothing = {}
        low = name.lower()
        src = d["clothing"] if isinstance(d["clothing"], dict) else {}      # Luau encodes an empty table as []
        if src.get("shirt"):
            clothing = {"shirt": {"template": f"../../clothing/shirt_{low}.png", "robloxAsset": src["shirt"], "size": [585, 559]},
                        "pants": {"template": f"../../clothing/pants_{low}.png", "robloxAsset": src["pants"], "size": [585, 559]}}
        accessories = []
        for a in d["accessories"]:
            accessories.append(dict(a, packItem=f"accessories/{HAIR_ITEM.get(a['name'], a['name'])}", objectNameInCharacterObj="Hair"))
        rig = {
            "name": name, "rigType": "R6", "units": "studs (1 stud = 1 unit)", "axes": "+Y up, character faces -Z, +X is the character's right",
            "origin": "feet centre on the ground (HumanoidRootPart position with Y = 0)",
            "formula": "Part1.CFrame = Part0.CFrame * C0 * Transform * C1:Inverse(); animations supply Transform per joint (see animations/*.json)",
            "cframeFormat": "[x, y, z, R00, R01, R02, R10, R11, R12, R20, R21, R22] (Roblox CFrame:GetComponents, row-major rotation)",
            "objFile": f"{name}.obj",
            "objObjects": ["Head", "Face", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg"] + (["Hair"] if accessories else []),
            "restPartCFrames": {p["name"]: p["cframe"] for p in d["parts"]},
            "parts": d["parts"], "joints": joints, "attachments": d["attachments"], "accessories": accessories,
            "bodyColors": d["bodyColors"], "clothing": clothing,
            "defaultFace": {"studio": "rbxasset://textures/face.png (Roblox 'Smile', asset 144075659)", "pack": "faces/happy.png (vector redraw of Smile)"},
            "humanoid": d["humanoid"], "studioOriginOfThisModel": d["worldOriginInStudio"],
        }
        out = pack / "characters" / name
        out.mkdir(parents=True, exist_ok=True)
        (out / "rig.json").write_text(json.dumps(rig, indent=1), encoding="utf-8")
        print(name, [(j["name"], j["pivotInCharacterSpace"]) for j in joints])


if __name__ == "__main__":
    main()
