"""Roblox Shorts Studio entry point.

new        scaffold a project folder (library, helpers, story/shot/cue templates)
build      run the project's source/build_scene.py in background Blender (scene only, no render)
transcribe measure word timings from audio/narration.* into audio/alignment/
finish     mix audio and write captions; --encode also assembles renders/farm PNGs into the MP4
render     small local motion preview (only on a machine that can render; the laptop uses GarageFarm)
build-pack / demo   rebuild the character library / the motion-test demo
"""
from pathlib import Path
import argparse, json, shutil, subprocess, sys
S = Path(__file__).resolve().parent; ROOT = S.parent
sys.path.insert(0, str(S))
from settings import tools, executable


def run_blender(cfg, script, *args):
    cmd = [executable(cfg, 'blender'), '-b', '--factory-startup', '--disable-autoexec', '--python-exit-code', '1', '--python', str(script)]
    if args:
        cmd += ['--', *map(str, args)]
    subprocess.run(cmd, check=True)


def python(cfg):
    return cfg.get('python') if cfg.get('python') and Path(cfg['python']).is_file() else sys.executable


def new_project(out, title, character, seconds):
    out = Path(out).resolve()
    if out.exists() and any(out.iterdir()):
        raise SystemExit('Use a new project folder.')
    for f in ('source', 'assets', 'audio/alignment', 'renders/farm', 'delivery'):
        (out / f).mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / 'assets/Block_Characters.blend', out / 'assets/Block_Characters.blend')
    shutil.copy2(S / 'characters.py', out / 'source/characters.py')
    (out / 'source/build_scene.py').write_text((S / 'story_template.py').read_text(encoding='utf-8-sig'), encoding='utf-8')
    brief = {'title': title, 'character': character, 'characters': [character], 'seconds': seconds, 'fps': 30, 'width': 1080, 'height': 1920,
             'platform': 'TikTok + YouTube Shorts', 'status': 'idea; write story.md and script.txt, then narration, then author build_scene.py',
             'finish': {'music': 'playful_history_music', 'word_fixes': {}}}
    (out / 'source/project.json').write_text(json.dumps(brief, indent=2), encoding='utf-8')
    (out / 'source/story.md').write_text(f'# {title}\n\nOriginal vertical comedy with {character}.\n1080 x 1920, 30 fps. Final timing follows the measured narration.\n\n'
                                         '1. HOOK (frame 1): the central action is already happening.\n2. \n3. \n4. PAYOFF:\n', encoding='utf-8')
    (out / 'source/shots.json').write_text(json.dumps([{'start': 0.0, 'end': 2.5, 'title': 'Hook: action visible on frame 1'}], indent=2), encoding='utf-8')
    (out / 'source/sound_cues.json').write_text(json.dumps([{'asset': 'swish_1', 'start': 0.0, 'gain': 0.3}], indent=2), encoding='utf-8')
    (out / 'script.txt').write_text('Write the original narration here before voice generation.\n', encoding='utf-8')
    print(out)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='command', required=True)
    sub.add_parser('build-pack'); sub.add_parser('demo')
    n = sub.add_parser('new'); n.add_argument('--out', required=True); n.add_argument('--title', required=True)
    n.add_argument('--character', choices=['Max', 'Mia', 'Leo'], default='Max'); n.add_argument('--seconds', type=float, default=30)
    b = sub.add_parser('build'); b.add_argument('project'); b.add_argument('--script', default='source/build_scene.py')
    t = sub.add_parser('transcribe'); t.add_argument('project'); t.add_argument('--force', action='store_true')
    f = sub.add_parser('finish'); f.add_argument('project'); f.add_argument('--encode', action='store_true'); f.add_argument('--frames')
    r = sub.add_parser('render'); r.add_argument('scene'); r.add_argument('--out', required=True); r.add_argument('--width', type=int, default=720); r.add_argument('--frames', default='all')
    a = p.parse_args(); cfg = tools()
    if a.command == 'build-pack':
        run_blender(cfg, S / 'build_pack.py')
    elif a.command == 'demo':
        run_blender(cfg, S / 'build_demo.py')
    elif a.command == 'new':
        new_project(a.out, a.title, a.character, a.seconds)
    elif a.command == 'build':
        run_blender(cfg, Path(a.project).resolve() / a.script)
    elif a.command == 'transcribe':
        o = Path(a.project).resolve(); audio = next((o / 'audio' / x for x in ('narration.wav', 'narration.mp3') if (o / 'audio' / x).is_file()), None)
        if not audio:
            raise SystemExit('Save the narration as audio/narration.mp3 (or .wav) first.')
        py = cfg.get('transcription_python') if cfg.get('transcription_python') and Path(cfg['transcription_python']).is_file() else sys.executable
        subprocess.run([py, str(S / 'transcribe.py'), str(audio), '--output', str(o / 'audio/alignment')] + (['--force'] if a.force else []), check=True)
    elif a.command == 'finish':
        subprocess.run([python(cfg), str(S / 'finish.py'), a.project] + (['--encode'] if a.encode else []) + (['--frames', a.frames] if a.frames else []), check=True)
    elif a.command == 'render':
        run_blender(cfg, S / 'render.py', '--scene', a.scene, '--out', a.out, '--width', a.width, '--frames', a.frames)


if __name__ == '__main__':
    main()
