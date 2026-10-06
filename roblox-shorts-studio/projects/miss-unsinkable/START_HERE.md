# Miss Unsinkable: resume notes

Standalone true story (one part), written in the overnight run (user, 2026-10-05 23:45 UK: keep making new story
videos until 06:00 UK; no script approval needed tonight; never post without approval). Violet Jessop survived the
Olympic's collision with HMS Hawke (1911), the Titanic (1912, lifeboat 16, holding a baby an officer handed her) and
the Britannic (1916, a mine; she jumped from a lifeboat being drawn into the propellers), then worked at sea for
another thirty years: "Miss Unsinkable". Facts, beat ideas and sources: `source/story.md`.

## State
- Script v1 (147 words) written (no approval needed for the overnight run). Ledger: script_approved.
- Nothing else yet: there wasn't time to narrate, build and render it before 06:00 alongside the other videos.

## Next
1. Narration: `python3 scripts/qwen_cloud_george_c.py projects/miss-unsinkable --take take-01`, then
   `scripts/tighten_clips.py` and `QWEN_TTS_DIR=/tmp python3 scripts/narrate.py projects/miss-unsinkable --voice george_c --take take-01`.
2. Build the web clip (copy the structure of projects/he-sold-the-eiffel-tower/web: kit.js, clip, beats.py anchors,
   hold check, cover, sound), previews, fit check, full render, finish, review. Post only after approval.
