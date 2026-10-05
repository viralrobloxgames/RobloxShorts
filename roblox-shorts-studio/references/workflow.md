# Full workflow: idea to finished Short

Each project folder is self-contained and editable. Its layout, created by `studio.py new`:

```
projects/<slug>/
  START_HERE.md              resume notes: done / next / job + budget state
  script.txt                 approved narration text
  <Title>_GarageFarm.blend   packed, baked scene uploaded to the farm
  assets/Block_Characters.blend
  audio/narration.mp3|wav    final narration
  audio/narration-source.json  voice, model, settings, credits, takes
  audio/alignment/           transcript.json, captions.json, captions.srt (measured)
  source/project.json        title, seconds, fps, size, finish options
  source/story.md            beat list, hook first
  source/shots.json          [{start, end, title}] from measured timings
  source/build_scene.py      scene author (Blender, background, no render)
  source/characters.py       rig helpers (copy of scripts/characters.py)
  source/sound_cues.json     SFX placements for finish.py
  source/overlays.json       optional HUD / title pops for finish.py
  source/farm_manifest.json  scene fingerprint, test frames, framing checks
  source/garagefarm_job.json farm settings, jobs, costs, cap
  renders/farm/              downloaded farm PNGs (git-ignored)
  delivery/<Title>.mp4 .ass .srt .validation.json
```

## 1. Idea

Record it in `ideas/idea-ledger.json` with a title, logline, platform and status.

### Random engaging stories, not Roblox-game plots (user rule, 2026-10-04)

The channel's stories are random, engaging stories on any subject, told with the Roblox-style block characters as the
actors. Don't build the plot around Roblox games or game mechanics (tycoons, obbies, admin commands, egg stealing)
unless the user asks for it. Good shapes:

- an everyday mystery with a surprising explanation (who keeps leaving this?)
- a small lie or bet that spirals out of control
- a strange neighbour, job, pet or roommate
- a story told straight that flips in its last line

Every story needs a hook in the first line, a curiosity gap that keeps growing, a reveal and a payoff, plus a twist or
punchline after the reveal when possible. It must still read visually: a visible cause, a reaction and a physical
payoff. A loop ending is a bonus: the last frame cuts back to the hook.

### Standalone, not series (user rule, 2026-10-03)

Every video is a complete standalone story: no "PART N" tag, no part numbers in titles or covers, no "part two" call to
action, no cliffhanger that only pays off in another video. Only make a numbered series when the user explicitly asks for
one. (`ideas/series/` holds the earlier series for reference only.)

### What the analytics have taught us (keep adding)

- **The first 2 seconds need motion and impact, not a wide establishing shot** (user review of Part 5): open on a crash zoom /
  punch-in on the main character with something landing (a crown slam, a hit), then whip-pan to the second beat. Wide shots come
  after the hook.
- **Action scenes need real action:** characters with space between them, knockbacks (fly back, run back in), hit reactions,
  on-screen stakes (HP bars, damage numbers), camera whips and shakes on each hit. Bodies standing close together trading
  small arm moves reads as "nothing happens". `projects/mia-had-two-crowns/web/duel.js` is a reusable pattern: a small
  deterministic simulation that also feeds the SFX.
- **Every motion needs a reason on screen.** No walking on the spot or idle loops that look like glitches; if a character must
  be moving for a later freeze/joke, give the motion a purpose (celebrating, patrolling, typing).

- The first 3-6 s decide the video: state the premise in the first line with the main character already doing it, readable
  at a glance. No flash-forwards, rewinds or intro cards. (The AFK Millionaire's first post lost ~70% by 0:06.)
- An on-screen countdown or progress counter for the whole video, and a new visual payoff every 3-5 s.
- Give the main character agency; the twist can be on them.
- Review checklist before delivery (user feedback on The Vampire Case, 2026-10-05): run the hold check (web/lib/holdcheck.js)
  before the full render; after the encode run scripts/review/blank_frames.py; in the contact sheet check that characters in a
  conversation face each other and that the hook shows both faces.

## Running steps in parallel (standard since 2026-10-02)

Rough cost of one 65 s web-route Short: narration 10-20 min, scene + cover + post.json 30-60 min of authoring, **full render 75-90 min**
(the bottleneck), finish + checks 5-10 min. Only the render truly waits on the narration, because every frame is keyed to a spoken word.

1. **Narration and scene authoring together.** The moment the script is approved, start the narration in the background (Route L in
   voice-and-audio.md, George voice C). Meanwhile build the scene, cover and `delivery/post.json` against *estimated* timing: anchor every beat
   to a narration word through `source/beats.py` -> `web/beats.js` (see `projects/the-noob-has-admin` for the pattern; it estimates from
   `script.txt` until `audio/alignment/captions.json` exists), and generate `source/sound_cues.json` from the same beats with
   `source/sound_cues.py`. When the narration lands: `beats.py`, `sound_cues.py`, set `seconds`, `finish.py` (mix + captions), one preview
   frame per shot, fit check, render. Retiming takes minutes, not a rebuild.
2. **The next video while this one renders.** During the 75-90 min render, write and get approval for the next script, and generate its
   narration **on the laptop** (two machines, so nothing competes with the render; a narration in the same cloud session would slow the
   render on its 4 shared CPUs).
- **Disk:** a cloud session has a fixed disk allowance and a full 1080p render writes 1.4-5 GB of PNG frames. Once a video is delivered,
   delete its `renders/` folder (git-ignored, re-renderable) before starting the next render; otherwise a render dies with ENOSPC.
3. **Splitting a render across cloud sessions** (each takes a frame range) could cut the render to about a third. Not proven yet: the frame
   PNGs (gigabytes) have to come back to one place to be stitched. Test it before relying on it.

## 2. Story and script

Write `source/story.md` as numbered beats. **Beat 1 is the hook: the central action is already happening on frame 1.** Then write `script.txt`. Short, punchy lines work best. The last line is always the call to action (see SKILL.md hard rules), after the payoff. For about 20 s aim for 45–60 words; videos are **61–65 s** (user rule), so aim for 145–160 words including the CTA (George measures about 2.5 words/s). Adjust to the real voice. Get the script approved before spending credits. Status in the ledger: `script_draft_awaiting_approval` → `script_approved`.

## 3. Narration and timings

See [voice-and-audio.md](voice-and-audio.md). Timings come from the finished recording, never a guessed reading rate. After `studio.py transcribe`, read `audio/alignment/captions.json` against the script. Fix misheard words with `finish.word_fixes` in `project.json` (e.g. `{"BY": "BYE"}`). Don't edit timings by hand.

Set `seconds` = speech end + ~0.5 s tail (frames = `round(seconds * 30)`). **The video must be 61–65 s** (over 60 s for TikTok Creator Rewards; longer only for a good reason agreed with the user). If the take is short, generate only the extra lines and splice them in at measured silences, as `examples/the-afk-champion/source/assemble_narration.py` does. Don't regenerate the whole script.

## 4. Shots and scene

Build `source/shots.json` from caption times. Change shot every 2–3 s and align cuts to integer frames (`F(t) = round(t*30)+1`). Put the timing constants in one module, as `afk_timeline.py` does, so animation, audio and captions share them.

Author the scene in `source/build_scene.py`. The helpers in `characters.py` are:

- `reset`, `setup_scene`, `stage`, `load_character`
- `pose`, `action_pose`, `key_pose`, `ground_actor`, `set_expression`
- `material`, `cube`, `cylinder`, `sphere`, `aim`

See [authoring.md](authoring.md) for the rig. Rules that made the farm renders work:

- Bake everything to ordinary keyframes (CONSTANT interpolation is fine). No physics or simulations, no drivers that need auto-run scripts.
- Pack all data, use no linked libraries, and save the result as `<Title>_GarageFarm.blend`.
- Render settings: EEVEE, 1080 × 1920, 30 fps, PNG, frame_start 1.
- Build with `python scripts/studio.py build projects/<slug>` (background Blender, about 40 s, **no rendering**).
- For each test frame, record numeric checks in `farm_manifest.json`: `world_to_camera_view` of each featured head must be inside 0–1, with occlusion checks where it matters. This replaces local preview renders.
- Keep captions and HUD clear of the TikTok UI: bottom 20 % and right 15 % of the frame.

### Web route: accessory fit check (required)

On the web route (`web/`, no Blender) characters and accessories come from the Roblox pack. Accessories are placed only
with `wear()` / `fitAccessory()` in `web/lib/robloxPack.js`. Before every full render:

1. `node web/fit_check.mjs --clip projects/<slug>/web/<clip>.js`. Every pair must PASS.
2. Open `projects/<slug>/web/fit_check/fit_sheet.png` and check every view (front, three-quarter, side, back): no hair or
   head showing through, nothing floating, oversized or off-centre.
3. Fix anything wrong in the fitting rules (`ACCESSORY_FIT`), not with per-clip offsets, and rerun.
4. `node web/fit_check.mjs --clip ... --reviewed`, then render. `web/render.mjs` blocks full renders until this is done.

New accessories or characters in the pack: add a rule and run `node web/fit_check.mjs --all` before any clip uses them.

## 5. Render on GarageFarm

Follow [garagefarm.md](garagefarm.md): run a test job, review it, render the full range within the cap, then download the PNGs to `renders/farm/`.

## 6. Sound, captions, encode

- `source/sound_cues.json`: motivated SFX only, with restrained gains (0.15–0.6). Use library sounds (`impact_1-4`, `swish_1-4`, `click`, `drum_hit`) or synthesized tones (coin pings, beeps, stings). See the examples for timings.
- `source/overlays.json`: HUD lines (`HUD` style), eliminations (`Out`), round titles (`Title` with a pop tag).
- `python scripts/studio.py finish projects/<slug>` writes `audio/final_mix.wav` (loudness −16 LUFS, −1.5 dBTP) and `delivery/<Title>.ass/.srt`. Listen to the mix before encoding.
- `python scripts/studio.py finish projects/<slug> --encode` checks that frames 1..N have no gaps or duplicates, burns the captions with Luckiest Guy, encodes H.264/AAC with faststart, fully decodes it, and checks the frame count.

## 7. Review and hand-off

Watch the full MP4. Run `scripts/review/contact_sheet.py --frames renders/encode --out delivery/contact.jpg`. Check for clipping, floating feet, expression timing, prop contact, caption overlap with the HUD, and the loop cut. Update `START_HERE.md` and the ledger status (`delivered_local_review`). Write `delivery/post.json` (TikTok caption = one hook line of at most 45 characters, then a line of 4-5 hashtags; YouTube title at most 50 characters with no hashtags; see references/publishing.md) alongside the hand-off, then `python3 scripts/post_md.py projects/<slug>` for the user's copy-ready `delivery/<Title>_post.md`.

## 8. Post (after approval)

When the user approves the video, post it: TikTok first, YouTube Shorts straight after (for now from a Claude session on the user's computer through their signed-in browser; later `scripts/publish.py` from the cloud). Report both links. Set the ledger status to `posted`. Details and the one-time account setup: [publishing.md](publishing.md).
