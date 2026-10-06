# I Secretly Lived In My Enemy's House For A Week: resume notes

The channel's first long-form YouTube video: 16:9, about 12 minutes, a multi-voice Roblox-style story told by Skye,
built as eleven chapters of about 65 s that are authored and rendered in parallel (one cloud machine per chapter) and
stitched into one video. It is also the reusable kit for a second story.

- Outline, cast, voices, clue map, chapter table: `source/story.md`
- Full script (speaker-tagged, with action lines): `script.txt`
- Continuity contract for every chapter break: `source/boundary_sheet.md`

## Status (2026-10-06 ~20:45 UTC): DELIVERED FOR REVIEW, NOT POSTED

- Final video: `delivery/I_Secretly_Lived_In_My_Enemys_House.mp4` (11:50, 1920x1080, 21,304 frames, -14.1 LUFS / -1.2 dBTP),
  committed as `.part_aa/ab/ac` (join: see `delivery/README.md`); `delivery/stitch_report.json` has the checks.
- Built by parallel cloud sessions (roster and phases: `production/ORCHESTRATION.md`): shared kit (`web/kit/`), one session
  per chapter (`web/chNN.js`), four gate reviewers (`production/gate/`), two fresh final reviewers (`production/review/`),
  segment-B render helpers. Every gate and final-review must is fixed.
- Max is voiced by `max_boy2` (C_s5 audition; the user picked it after hearing three boy voices); all 57 lines replaced
  audio-only with timings unchanged (`scripts/replace_speaker.py`).
- Re-stitch: `python3 scripts/stitch_longform.py projects/i-secretly-lived-in-my-enemys-house --music-gain 0.09 --music-duck "8@49-58,10@56-60"`.
- Upload hand-off (only after the user approves this video): `delivery/I_Secretly_Lived_In_My_Enemys_House_post.md`,
  `post.json`, thumbnail `delivery/I_Secretly_Lived_In_My_Enemys_House_thumbnail.jpg`, chapters `delivery/youtube_chapters.txt`.
- Fixing a shot later: edit `web/chNN.js` (keep timing), re-render that frame range (`render.mjs --frames a-b`), re-encode
  the touched segment with `scripts/finish_longform.py --range`, re-stitch (protocol in `production/requests.md`, 18:55Z).

## The brief (user, 2026-10-06)

Setup, done once, with two approval stops:
1. Outline, full script (eleven chapters of 150-180 words, ~1,800 total), boundary sheet. **Stop for approval.**
2. Voice auditions, one sample line per character. **Stop for approval.** Then narrate all eleven chapters on the laptop
   in one background run (~4 h). narrate.py must read a speaker tag per line and keep one measured timeline with the
   speaker on every caption. Skye = `brittney` clone; one male role = `george`; the others designed with Qwen3-TTS.
   Four voices at most.
3. Shared kit before any chapter is authored: one module for cast, outfits, sets, lighting, caption style (colour per
   speaker) and camera rules (camera on whoever speaks) that every chapter imports and none overrides. Prove 16:9 first
   with a 3 s clip through render, finish and encode (captions.md and finish.py assume 1080x1920).
4. Two speed-ups measured on that clip: (a) hold poses between lines, and render.mjs copies the previous PNG when a
   frame's fingerprint is unchanged; (b) two cloud machines each render and encode part of a clip and the MP4s
   concatenate cleanly. If (b) fails: render chapters one after another in one cloud session, encoding and deleting
   frames after each.

Production in two passes, chapters 1-5 then 6-11:
5. Author the pass's chapters in parallel (one sub-agent each) against estimated timings; retime when narration lands.
6. Review gate before any full render: a fresh sub-agent that wrote none of the chapters checks one preview frame per
   shot and every seam (last frame beside the next chapter's first) against the kit and the boundary sheet. Fix first.
7. Render each chapter on its own cloud machine (cloud agents if they can be started; otherwise one paste-ready prompt
   per chapter). Each machine: fit check, hold check, render, encode with **no music** at identical settings, push only
   the MP4 to main, delete its frames.
8. Stitch the pass: concatenate, one music bed, one loudness pass.
9. Review by another fresh sub-agent: every seam (picture, audio level, music), caption style, blank frames
   (`scripts/review/blank_frames.py`), a contact sheet of the whole block. Fix by re-rendering only changed frames.
After pass one: **stop and show the stitched 5-6 minute block** with measurements; pass two only after approval, with any
kit changes applied first. Finish: stitch all eleven, one music bed, one loudness pass, stage-9 review of the whole
thing including the join between passes, YouTube chapter timestamps, a 1280x720 thumbnail, title and description.

Shorts rules that don't apply here: 61-65 s, the 1080x1920 canvas and cover, TikTok safe margins, TikTok posting,
standalone-only. Everything else in SKILL.md applies: push to main as you go, never post until the user approves the
finished video. Web route (no farm credit); GarageFarm only with a cap the user sets first.

At every stop report: what's done, what was measured (render s/frame, share of frames skipped, whether the two-machine
test passed) and what's needed from the user.

## State

- 2026-10-06: **Step 1 done, awaiting approval.** Script v1: 1,741 words, chapters 153-168 words; estimated
  12.1-13.5 min before measurement. Concept kept as given, with a haunting motive, school by day / house by night, a
  "he knew all along" twist planted from frame 0, and Halloween timing (see story.md).
- Nothing narrated, built or rendered yet. Cost so far: $0.

## Next

1. On approval of the script (apply any line changes in `script.txt`, keep the format):
   auditions in the cloud, one line each:
   - Skye (`brittney` clone): "Tomorrow night, I'm doing the biggest haunting this house has ever seen. And I'm filming the whole thing."
   - Max (VoiceDesign, 2-3 described styles x 2 seeds, a 12-13-year-old boy): "Your hair is pink. It's sticking out of the sheet. Same as in my closet on Monday."
   - Dad (`george_c`, the George voice C setup): "Hello? Mister Ghost? This is a friendly house. But you have eaten nine of my pancakes, and that is where I draw the line."
   - Lily (VoiceDesign, a 7-year-old girl): "I won't tell. If you come to my tea party. Every day."
   Check each take by transcript and pitch, save the picked designed takes as `assets/audio/voices/<name>.wav|.txt|.json`,
   and extend `scripts/narrate.py` for speaker tags (`SPEAKER (note): text`, `# CH..` headers, `[+N ...]` pauses,
   per-chapter outputs, the speaker on every caption word).
2. Then the shared kit and the 16:9 proof (steps 3-4) while the laptop narrates.
