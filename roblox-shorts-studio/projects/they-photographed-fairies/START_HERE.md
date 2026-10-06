# They Photographed Fairies: resume notes

Standalone true story (one part): the Cottingley Fairies. In 1917 Elsie Wright (16) and her cousin Frances Griffiths
(9) photographed "fairies" by the stream; a photo expert found no sign of faking, Sir Arthur Conan Doyle (creator of
Sherlock Holmes) published them in The Strand Magazine (Christmas 1920) and wrote a book about fairies; in 1983 the
cousins admitted the fairies were paper cutouts on hatpins, but Frances said until her death that the fifth photo was
real. Facts, beats and sources: `source/story.md`. Made overnight without script approval (user request 2026-10-05).

## State
- 2026-10-06 (overnight): script v1 (154 words with the CTA); facts checked (Wikipedia, Museum of Hoaxes).
- Narration (George voice C, take-01) joined with `--beat 1.1` (the default 0.9 gave a 60.6 s video): **59.4 s
  speech**, all words heard (Whisper writes the numbers as digits, "Francis", "hat pins", "admitted").
- Beats from the real narration (`source/beats.py` -> `web/beats.js`, aliases for those): 43 anchors, none
  interpolated. Speech ends 59.24 s, so a clip with meta.seconds = ceil((W.end + 2.0) * 30) / 30 is 61.27 s (1838
  frames) + 0.5 s cover = 61.8 s; `source/project.json` seconds = 61.27. Post copy: `delivery/post.json`.

## Next
1. Web clip `web/fairies_clip.js` (sets: a 1917 garden and stream, a cottage door,
   a photo darkroom/print, a magazine spread, a 1983 interview room), previews, hold/fit checks, sound cues, cover,
   then the full render (needs disk space: see the Banana and Penguin notes).
