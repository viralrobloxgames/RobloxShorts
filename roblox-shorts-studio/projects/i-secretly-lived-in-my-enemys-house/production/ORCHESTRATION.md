# Orchestration (resume notes for the orchestrator, session_01VoEKPTD5XbzGG7bGwCXC91)

User, 2026-10-06 ~12:50 UK: do the whole video with parallel cloud sessions, full approval, a cloud session reviews the
stitched work and challenges sections, don't stop until complete; if the 5-hour limit hits, every session continues
after the reset; 10-11 h was too long, so maximum parallelism (target ~5 h, ~18:00 UK).

## Phases
1. Setup (~1 h): kit-pipeline, kit-cast, kit-props, kit-sets-a/b/c, voices, narration-tool; in parallel ch01-ch11 start
   with a shot plan (`production/shots/chNN.md`, needs into `production/requests.md`), then draft against the contract.
2. Chapters (~1.25 h after the kit): each narrates its chapter, builds, previews, hold/fit checks → `READY_FOR_GATE`
   with preview sheets in `production/previews/chNN/`.
3. Gate (~30 min): 3 fresh reviewers (gate-a: ch01-04 + seams 1|2..4|5; gate-b: ch05-08 + seams; gate-c: ch09-11 +
   seams) write `production/gate/chNN.md`; chapters fix → `READY_TO_RENDER`. A chapter renders as soon as it passes.
4. Render (~45 min): each chapter split at a frame near the middle: the chapter session renders segment A, a render
   helper (reused setup session) renders segment B; each encodes its segment with `finish_longform.py` (video only,
   captions burned) → `delivery/chapters/chNN_a.mp4` / `_b.mp4`.
5. Stitch (~15 min): `stitch_longform.py` → final MP4 + chapter list.
6. Final review (~30 min): 3-4 fresh `review-*` sessions, each a part of the video + one global (audio, seams,
   captions, continuity); challenges with timestamps in `production/review/*.md`.
7. Fixes (~45 min): chapter sessions fix, re-render changed frames/segments, re-stitch, re-check the changed parts.
8. Deliver: final MP4 (in parts if >100 MB, with the join command), YouTube chapters, 1280x720 thumbnail, title,
   description; START_HERE + ledger updated; user report. Never post.

## Usage-limit resume
The user asked (23:20Z): do not stop until the full video is improved and done, and keep every session going through
5-hour limits. Routine `trig_01HDGnJJhFJCFHgLovLmazw1` ("Long-form video: hourly orchestrator check-in", :23 every hour)
and a one-shot at 04:14Z (`trig_014E7ZtrvpHp8yHH8yse2tVH`) wake this session; on each wake: list_sessions, resume every
FAILED worker that still has work with send_message priority "next" ("Resume from production/status/<role>.md").
Background watcher: scratchpad/watch_p4.sh (exits on an actionable change; restart it after each wake).
**Delete the hourly routine once the improved video is delivered.**

## Sessions (created 2026-10-06 ~11:54-11:57 UTC)
| Role | Session |
|---|---|
| kit-pipeline | session_01UGSLAfBHvYKijFfutFvm7t |
| kit-cast | session_01YDjFeYPSidcDaN1LLk2gpT |
| kit-props | session_01DwipK2nr3EEpZZAzGsTWqc |
| kit-sets-a | session_01PQQ1JioYHegRLRpkgSp8EH |
| kit-sets-b | session_01AVE4GdYUmCbNXxt3UFSxrV |
| kit-sets-c | session_01SThrwqNGmaog6Ec3d9dfuQ |
| voices | session_01MBoRAo7uj2oPLFEpTTaYT8 |
| narration-tool | session_01RGsEviSVchgJRhV8pxiJVR |
| ch01 | session_01Lk9d91qbSG9PTQRmfRY4Vu |
| ch02 | session_01GY8zW4QnczRdHFHEiMNHXu |
| ch03 | session_017LkQiQMZNFpHC55fsdtvFo |
| ch04 | session_01UdeZWmHNWTB5NVHjW2rEue |
| ch05 | session_01QibSvnJQuxuA4Duv6xBoEh |
| ch06 | session_016LiAKsiod7rLMgMG9BpZ6y |
| ch07 | session_01R1X6TeYD2F7juNSRT2LrZt |
| ch08 | session_01VKPfsgRop6xipAswEAWYrn |
| ch09 | session_01XYtiYgxepqhMUNHisk1Df2 |
| ch10 | session_01GpbJMMGFqdZsfFWsWu5Lk4 |
| ch11 | session_01BfKdng2SSK8yGriwr5FWoJ |

Later: gate-a/b/c/d (fresh, `briefs/gate.md`), render helpers for segment B (the 8 setup sessions, then gate reviewers / spares;
`briefs/render_plan.md`: full renders start at READY_FOR_GATE, fixes re-render only changed frames), review-1..4 (fresh).
Orchestrator routines: trig_01SHFzCL5TM3VVuWqEnfUCrE (:47) and a second one at :17.

## Phase 2 sessions (13:27Z)
| Role | Session |
|---|---|
| gate-a (ch01-03) | session_0113HDTXbFK6qyDkbMuq2LFQ |
| gate-b (ch04-06) | session_01SrFdNTG52rfwv28WoiWdEW |
| gate-c (ch07-09) | session_01LgnSKU2rJGmWXA6JpGy4HP |
| gate-d (ch10-11 + end screen) | session_01Junr2nzH4Do71363wUXn9y |
| render-ch09-b | session_01RmDSQSmZxiSnYwsnaz53yT |
| render-ch10-b | session_012KdE2mYxkFxh8Hc5YFHzYW |
| render-ch11-b | session_019itEkDEcdnMftz8PwrhKbc |
| package (thumbnail, YouTube copy) | session_019cE5sZwNxrmfZaUNbxuCAr |
| review-1 (final review ch01-06) | session_01X2goqpd5nPz8uYK1JitJaQ |
| review-2 (final review ch07-11 + whole film) | session_01P89AesJF24x7Kgo7BUpVm9 |

Segment B helpers (static, they watch their chapter's status file and start at READY_FOR_GATE): ch01 kit-pipeline,
ch02 kit-cast, ch03 kit-props, ch04 kit-sets-a, ch05 kit-sets-b -> reassigned to gate-a at 14:26Z (kit-sets-b stalled), ch06 kit-sets-c, ch07 voices, ch08 narration-tool,
ch09-ch11 the three render sessions above. Kit files are additive-only from ~13:50Z (look changes re-render frames).

Orchestrator note: send_message with priority "now" interrupts the worker's running tool call, and the worker reads the
cancel as "the user doesn't want this; wait" (kit-sets-b stalled at 13:43). Always use priority "next".

## Phase 3: physical-plausibility pass (user feedback 21:00Z: clipping, sitting, staging, poses)
| Role | Session |
|---|---|
| critic-1 (ch01-02) | session_01MBPEtt2p6fabrhjtXdpGWx |
| critic-2 (ch03-04) | session_01MrBwaynP2e4RQAqfEX843r |
| critic-3 (ch05-06) | session_01ChpHL1sVh8DL4LyFpAQK25 |
| critic-4 (ch07-08) | session_01CvVu818G9LnEb292kRTgkK |
| critic-5 (ch09-10) | session_01TxdQ9Pe586Uffauv215j6Y |
| critic-6 (ch11 + character identity) | session_01DNVA77c1V6odpP5EydznQH |
Brief: `briefs/frame_critic.md`. kit-pipeline builds `web/clip_check.mjs` (automated interpenetration report per chapter,
`production/review/clip_check/`). Then chapter sessions fix (kit fixes go to the kit owners), re-render, re-stitch.

## Phase 4: plausibility rework (23:25Z, after the 21:20-23:10Z usage-limit stop)
All workers stopped at 21:20Z (five_hour limit; reset 23:10Z, next ~04:10Z). Assignments: requests.md 23:25Z entry.
Kit root causes: kit-cast K1-K5 (poses, faces), kit-pipeline P1-P4 (identity light, hard cuts, A/B seams, sight check),
kit-props PR1 (grips), kit-sets-a SA1-2, kit-sets-b SB1-2, kit-sets-c SC1-2. Chapters fix staging now; orchestrator posts
KIT FREEZE when all kit fixes landed; then chapters pull, preview, clip_check, READY_FOR_RECHECK -> critic OK -> full
re-render A (chapter) + B (same helpers as phase 2) -> re-stitch (same command) -> final critic pass -> deliver.
| Role | Session |
|---|---|
| critic-1 (now ch01 only) | session_01MBPEtt2p6fabrhjtXdpGWx |
| critic-7 (ch02) | session_01Se3gj5odNjgiyMc6oaWrF1 |
