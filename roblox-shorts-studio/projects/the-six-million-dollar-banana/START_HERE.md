# The Six Million Dollar Banana: resume notes

Standalone true story (one part). Maurizio Cattelan's *Comedian*, a banana duct-taped to a wall: two editions sold for
$120,000 each at Art Basel Miami Beach in 2019; another artist ate it days later and the gallery taped up a new one,
because buyers get a certificate and instructions, not a banana; a student in Seoul ate one in 2023; Sotheby's sold one
for $6.2m in November 2024 and the buyer ate it on stage. The banana came from a New York fruit stand for 25 cents.
Facts, beats and sources: `source/story.md`. Made overnight without script approval (user request 2026-10-05).

## State
- 2026-10-05: script v1 (159 words with the CTA). Web clip (three.js), sets kit, hold check, sound cues, cover clip, post copy.
- 2026-10-06 (overnight): narration joined (George voice C, take-01; lines 2 and 8 flagged fast, regenerated with a new
  seed, same pace, kept): **59.4 s speech** with the default 0.9 s section pauses; all words heard (numerals only).
  The "25 cents" line checked against the NYT story (syndicated headline: "sold a $6.2 million banana for 25 cents").
- Beats from the real narration: 51 anchors, none interpolated (numeral aliases for "$6.2", "$120,000", "25").
  Clip 61.3 s + 0.5 s cover = 61.8 s (61-65 s rule); `source/project.json` seconds = 61.3.
- Preview sheet (28 frames) reviewed: auction bid boards land on "Three million / Five / Six point two"; end card fine.
  Hold check re-run: all props in hand where the check camera can see; the three wall-taping close-ups render grey
  (check camera behind the gallery wall), and those moments look right in the main-camera preview. Fit check: 0 pairs, reviewed.
- **Full render not started: the disk has 1.3 GB free; a full render needs ~2.6 GB, and finish.py copies the frames
  again for the encode.**

## Next
1. Free disk space (user decision), then full render:
   `node web/render.mjs --clip projects/the-six-million-dollar-banana/web/banana_clip.js --out projects/the-six-million-dollar-banana/renders/web --workers 4`
2. Cover full size -> `delivery/The_Six_Million_Dollar_Banana_cover.png`, encode
   (`python3 scripts/finish.py projects/the-six-million-dollar-banana --encode --frames projects/the-six-million-dollar-banana/renders/web`),
   blank-frame check, contact sheet, post copy, preview to the user.
