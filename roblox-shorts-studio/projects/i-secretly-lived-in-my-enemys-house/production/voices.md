# Voices (MAX, LILY designed; SKYE/VO, DAD existing): picks and tests, 2026-10-06

| Speaker | Voice id | Sample | Route |
|---|---|---|---|
| VO, SKYE | `brittney` | `assets/audio/voices/brittney.wav/.txt` | 1.7B-Base clone (`scripts/qwen_cloud_clone.py --voice brittney`) |
| DAD | `george_c` | `george_c.wav/.txt` + `george_c_1.7B_xvector.npy` | `scripts/qwen_cloud_george_c.py` |
| MAX | `max_kid` | `max_kid.wav/.txt/.json` (9.3 s) | 1.7B-Base clone, no x-vector file (sample's own) |
| LILY | `lily_kid` | `lily_kid.wav/.txt/.json` (6.9 s) | 1.7B-Base clone, no x-vector file (sample's own) |

Generation settings that matter: CPU float32, `torch.set_num_threads(4)`, and **always pass `max_new_tokens`** (300 = 25 s is
plenty for one line). Without it one VoiceDesign seed ran away (minutes of audio). Speed in the cloud: model load ~1 min, then
~8-9 s of compute per 1 s of speech (a 4 s line takes ~35 s). Install: `pip install torch --index-url https://download.pytorch.org/whl/cpu`,
`pip install qwen-tts faster-whisper librosa soundfile`; if torchaudio then fails on `libcudart`, run
`pip install --force-reinstall --no-deps torch torchaudio --index-url https://download.pytorch.org/whl/cpu`.

## Auditions (Qwen3-TTS-12Hz-1.7B-VoiceDesign), all in `production/auditions/`
Checks per take: faster-whisper small.en transcript, pyin median F0 (p10-p90), words/s over the spoken span, and the pause at each
sentence break (measured from word timestamps). Numbers in `auditions/checks.json` and `auditions/round2/checks.json`.
Each audition read the brief's line plus one more line from the script, so the clone sample is longer (more for the clone to copy).

**MAX** text: "Your hair is pink. It's sticking out of the sheet. Same as in my closet on Monday. Who did you think was making the sandwiches?"

| take | F0 med (p10-p90) | w/s | sentence pauses | verdict |
|---|---|---|---|---|
| A_s11 | 217 (141-305) | 3.20 | 0.48 0.62 0.72 | ok, a bit fast, wide swings |
| A_s22 | 185 (159-244) | 3.88 | 0.46 0.62 0.60 | too fast, low edge |
| B_s11 | 195 (155-259) | 2.99 | 0.66 0.54 1.16 | 1.2 s hole |
| **B_s22** | **242 (180-285)** | **2.89** | **0.88 0.80 0.76** | **PICK** |
| C_s11 | 278 (167-374) | 3.86 | 0.30 0.48 0.48 | too fast, high |
| C_s22 | 154 (103-210) | 3.32 | 0.78 0.72 0.66 | sounds older |

**LILY** text: "I won't tell. If you come to my tea party. Every day. And you have to be the horse."
Round 1 (styles A-C, seeds 11/22): the in-range takes A_s11 (321 Hz) and B_s11 (313 Hz) ran all sentences together (0.0 s
pauses); the others paused but were squeaky (378-440 Hz). Round 2 (`auditions/round2/`, seeds 33/44, new styles D and E asking for
a "slightly low, husky" / "low, flat, serious" voice with a pause after every sentence):

| take | F0 med (p10-p90) | w/s | sentence pauses | verdict |
|---|---|---|---|---|
| **D_s33** | **302 (202-372)** | **2.97** | **0.64 0.64 0.48** | **PICK** (lowest p90 of all 20 LILY takes) |
| D_s44 | 329 (248-436) | 2.72 | 0.58 0.80 0.64 | runner-up |
| E_s33 | 338 (227-504) | 3.32 | 0.48 0.42 0.30 | high peaks |
| E_s44 | 373 | 3.07 | ok | too high |
| A_s33 / A_s44 / B_s33 / B_s44 | 358-434 | | some run together | too high |

Instructs, seeds and reasons are in `assets/audio/voices/max_kid.json` and `lily_kid.json`.

## Clone test (Qwen3-TTS-12Hz-1.7B-Base, same as `qwen_cloud_clone.py`), `production/auditions/clone_test/`
14 lines: 6 MAX, 6 LILY, 1 SKYE (brittney), 1 DAD (george_c). Speaker similarity = cosine of the model's own speaker-encoder
x-vector against each reference sample (`speaker_similarity.json`).

| voice | lines | transcript | F0 per line (Hz) | mean F0 vs sample | similarity to own sample (next best) |
|---|---|---|---|---|---|
| max_kid | 6 | 6/6 exact | 243 287 298 225 234 212 | 250 (+3%) | 0.982-0.990 (lily 0.973-0.980) |
| lily_kid | 6 | 5/6 exact, 1 homophone ("You're Skye" -> "Your sky") | 243 325 325 321 264 259 | 290 (-4%) | 0.978-0.990 (max 0.966-0.979) |
| brittney (SKYE) | 1 | exact | 166 | sample 228 | 0.944 |
| george_c (DAD) | 1 | exact | 137 | sample 120 | 0.987 |

Reading: the clones keep the kids' voices. The average pitch is within 5% of the sample, every line stays in the child range
(boy 212-298 Hz, girl 243-325 Hz), and every kid clone is closest to its own sample. Single short lines swing up to ±20% in
pitch with the expression ("It was a very convincing fridge." comes out higher), so judge drift over several lines, not one.
narrate_multi's word check should treat "Skye"/"sky" as a match. All four voices generate fine on cloud CPU.
