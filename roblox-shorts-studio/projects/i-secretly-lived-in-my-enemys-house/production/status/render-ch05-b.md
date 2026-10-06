STATUS: RENDERING
render-ch05-b (taken over by the gate-a session, 2026-10-06): segment B = frames 910-2019 of ch05 (FRAMES 2019, SPLIT 910).
First render of 910-2019 finished (1110 frames, 75% copied by frame skip, 1.15 s/frame overall). Waiting for ch05 READY_TO_RENDER to sync (changed_frames --delete, --resume), then encode ch05_b.mp4.
Rendered from tree 72fe829 (ch05.js at ba2fd86). Per the orchestrator (15:00): no changed_frames --delete (fingerprint bug on kit chapters); on READY_TO_RENDER I diff ch05.js + kit vs 72fe829 and re-render only the changed ranges with --frames.
18:16Z: still waiting. ch05 is at READY_FOR_GATE on ba2fd86, and gate-b has one must open (Lily's pouring arm over her mouth
in the last shot, f~1975-2019, pose only). Segment B frames 910-2019 are on disk from ba2fd86; after READY_TO_RENDER I
expect only the last shot to need re-rendering. My background watcher hit its time limit on a worker restart and has
been restarted.
18:20Z: segment B 910-2019 is complete on disk; ch05.js, kit, lib and narration are unchanged since the render. Fingerprints are saved with the fixed changed_frames (15:10Z protocol, step 1). Waiting for ch05 READY_TO_RENDER, then --delete + --resume + encode.
