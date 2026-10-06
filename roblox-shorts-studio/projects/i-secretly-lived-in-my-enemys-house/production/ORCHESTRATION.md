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
Routines "Long-form video: orchestrator check-in" (hourly) wake this session; on each wake: get_session for every
worker below; send_message any idle/failed worker whose status isn't DONE: "Resume from production/status/<role>.md".

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
