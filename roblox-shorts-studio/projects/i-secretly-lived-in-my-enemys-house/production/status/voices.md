STATUS: READY
Role: voices (VoiceDesign auditions for MAX and LILY -> max_kid / lily_kid clone samples)
- [x] env: torch CPU + qwen-tts + faster-whisper; note: torchaudio must be the CPU wheel (pip install --force-reinstall --no-deps torch torchaudio --index-url https://download.pytorch.org/whl/cpu); pass max_new_tokens=300 (a seed ran away without it)
- [x] MAX: 3 styles x 2 seeds -> pick B_s22 (242 Hz, 2.89 w/s, gaps 0.76-0.88 s) -> assets/audio/voices/max_kid.*
- [x] LILY: round 1 (3x2) failed (in-range takes ran sentences together, paused ones 378-440 Hz); round 2 (4 styles x 2) -> pick D_s33 (302 Hz, 2.97 w/s, gaps 0.48-0.64 s) -> lily_kid.*
- [x] clone tests: 6 lines each kid voice + SKYE + DAD; all good (see production/voices.md)
- [x] production/voices.md
Next: free for a narration or render job from the orchestrator.
