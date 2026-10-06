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

## Sessions
(filled in as they are created)
