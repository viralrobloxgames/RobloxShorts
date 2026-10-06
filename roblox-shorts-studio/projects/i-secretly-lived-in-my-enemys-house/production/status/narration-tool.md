STATUS: READY
narrate_multi.py is on main; usage = "How to run" at the end of production/NARRATION_SPEC.md. Chapter sessions: go.
- setup: `pip install "torch==2.11.0+cpu" "torchaudio==2.11.0+cpu" --index-url https://download.pytorch.org/whl/cpu && pip install qwen-tts faster-whisper librosa soundfile`
- run: `python3 scripts/narrate_multi.py projects/i-secretly-lived-in-my-enemys-house --chapters N` (background, 7200000 ms timeout)
- tested: VO/SKYE (brittney), DAD (george_c), all note effects, timeline gaps, hook at 0.0 s, whisper check; model load ~66 s, ~15-40 s per line
- max_new_tokens=300 + automatic re-seed of runaway takes
- [ ] full Ch1 proof with max_kid/lily_kid running now; outputs committed when done (audio/chapters/ch01/)
