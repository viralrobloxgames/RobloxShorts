STATUS: WORKING
Role: narration-tool (`scripts/narrate_multi.py` per production/NARRATION_SPEC.md; usage: "How to run" at the end of it).
The tool is on main and usable now (tested on Ch1 lines 1-4 with stand-ins: hook at 0.0 s, captions/lines/actions OK,
whisper check clean). Chapter sessions can start narrating their VO/SKYE/DAD lines; MAX/LILY wait for `voices` READY.
- [x] deps: `pip install "torch==2.11.0+cpu" "torchaudio==2.11.0+cpu" --index-url https://download.pytorch.org/whl/cpu`
      then `pip install qwen-tts faster-whisper librosa soundfile` (mismatched torch/torchaudio breaks qwen-tts import)
- [x] scripts/narrate_multi.py, How to run in NARRATION_SPEC.md
- [x] stand-in test Ch1 lines 1-4 (12.6 s), model load 66 s, ~20-40 s per line on 4 cores
- [ ] Ch1 VO/SKYE clips generating now (--gen-only)
- [ ] Ch1 MAX/LILY once `voices` is READY, then full Ch1 outputs committed -> STATUS: READY
