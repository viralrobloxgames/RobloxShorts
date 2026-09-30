"""Collect data printed by Studio Luau in chunks ("RBXPACK|<key>|<i>|<n>|<data>") from Studio's newest log file.

Luau in Studio cannot write files, but print() output is mirrored to %LOCALAPPDATA%/Roblox/logs/*_Studio_*.log.
The newest complete set of chunks for each key wins.

    python pull_studio_log.py <out_dir> [--prefix anim_] [--strip-prefix] [--log <file>]
"""
import argparse
import glob
import json
import os
import re
from pathlib import Path

LINE = re.compile(r"\[FLog::CreatorOutput\] RBXPACK\|([^|]+)\|(\d+)\|(\d+)\|(.*)$")


def newest_log():
    logs = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Roblox\logs\*_Studio_*.log"))
    if not logs:
        raise SystemExit("no Studio log found")
    return max(logs, key=os.path.getmtime)


def collect(log, prefix=""):
    runs = {}                     # key -> list of chunk dicts (one per emission)
    for raw in open(log, encoding="utf-8", errors="replace"):
        m = LINE.search(raw.rstrip("\r\n"))
        if not m or not m.group(1).startswith(prefix):
            continue
        key, i, n, data = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
        if i == 1 or key not in runs:
            runs.setdefault(key, []).append({})
        runs[key][-1][i] = data
        runs[key][-1]["_n"] = n
    out = {}
    for key, emissions in runs.items():
        for chunks in reversed(emissions):
            n = chunks.get("_n", 0)
            if all(i in chunks for i in range(1, n + 1)):
                out[key] = "".join(chunks[i] for i in range(1, n + 1))
                break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--prefix", default="")
    ap.add_argument("--strip-prefix", action="store_true")
    ap.add_argument("--log")
    a = ap.parse_args()
    log = a.log or newest_log()
    data = collect(log, a.prefix)
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for key, text in sorted(data.items()):
        obj = json.loads(text)
        name = key[len(a.prefix):] if a.strip_prefix else key
        (out / f"{name}.json").write_text(json.dumps(obj, indent=1), encoding="utf-8")
        print(f"{name}.json  {len(text)} chars")
    print(f"{len(data)} keys from {log}")


if __name__ == "__main__":
    main()
