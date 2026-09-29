"""Non-secret user settings and tool discovery. Credentials live in the OS keyring or environment."""
from pathlib import Path
import json, os, shutil, subprocess

ROOT = Path(__file__).resolve().parents[1]
KEYRING_SERVICES = ('roblox-shorts-studio', 'circletoons-shorts-studio')


def config_path():
    return Path(os.environ.get('ROBLOX_SHORTS_CONFIG', str(Path.home() / '.roblox-shorts-studio/settings.json'))).expanduser()


def _read(p):
    try:
        return json.loads(p.read_text(encoding='utf-8-sig')) if p.is_file() else {}
    except (OSError, ValueError):
        return {}


def load():
    """Merged settings: studio tools.local.json, then the user config, then older kit settings as fallback."""
    merged = {}
    for f in (Path.home() / '.circletoons-studio/settings.json', ROOT.parent / 'tools.local.json', config_path(), ROOT / 'tools.local.json'):
        merged.update({k: v for k, v in _read(f).items() if v not in (None, '')})
    return merged


def save(data):
    p = config_path(); p.parent.mkdir(parents=True, exist_ok=True)
    current = _read(p); current.update(data)
    p.write_text(json.dumps(current, indent=2), encoding='utf-8')
    try:
        p.chmod(0o600)
    except OSError:
        pass
    return p


def tools():
    cfg = load()
    for k in ('blender', 'ffmpeg', 'ffprobe', 'python'):
        if not cfg.get(k) or not Path(cfg[k]).is_file():
            cfg[k] = shutil.which(k)
    return cfg


def executable(cfg, name):
    p = cfg.get(name) or shutil.which(name)
    if not p or not Path(p).is_file():
        raise SystemExit(f'{name} was not found. Set "{name}" in {config_path()} or tools.local.json.')
    return str(p)


def run(args, **kw):
    return subprocess.run([str(x) for x in args], check=True, **kw)


def secret(name):
    value = os.environ.get(name)
    if value:
        return value
    try:
        import keyring
        for service in KEYRING_SERVICES:
            value = keyring.get_password(service, name)
            if value:
                return value
    except Exception:
        pass
    raise SystemExit(f'{name} is not configured. Store it with keyring or set the environment variable; never paste keys into chat or command arguments.')
