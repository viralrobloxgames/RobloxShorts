# He Declared Himself Emperor: resume notes

Standalone true story (one part): Joshua Norton, a San Francisco merchant ruined by a failed bid to corner the rice
market, proclaimed himself Emperor of these United States on 17 September 1859, and the city played along: a uniform
with gold epaulettes and a feathered hat, his own banknotes accepted in shops, a decree abolishing Congress (ignored),
an arrest in 1867 that ended with the police chief's apology and officers saluting him, a decree for a bridge across
the bay (the Bay Bridge opened in 1936), and thousands on the streets for his funeral in 1880. Facts, beats and
sources: `source/story.md`. Made overnight without script approval (user request 2026-10-05).

## State
- 2026-10-06 (overnight): script v1 (159 words with the CTA); facts checked (KQED, Wikipedia, Simanaitis Says).
- Narration (George voice C, take-01) joined with `--beat 1.1` (the default 0.9 gave 57.7 s, a 60.0 s video):
  **59.1 s speech**, all words heard (Whisper writes "1859" and "Norton I"). Line 2 ("And the city goes along with
  it.") reads fast at 1.4 s; a second seed gave the same pace, kept.
- Beats from the real narration (`source/beats.py` -> `web/beats.js`): 64 anchors, none interpolated. Speech ends
  58.92 s, so a clip with meta.seconds = ceil((W.end + 2.0) * 30) / 30 is 60.93 s (1828 frames) + 0.5 s cover = 61.4 s;
  `source/project.json` seconds = 60.93. Post copy: `delivery/post.json`.

- Kit started (`web/kit.js`, work in progress): the 1859 street (BANK, GENERAL STORE, DAILY EVENING BULLETIN, HOTEL
  shopfronts on a boardwalk), hills, the bay with a dock and four sailing ships, the Bay Bridge (hidden until its
  scene), Norton's uniform (navy coat, brass buttons, gold collar and epaulettes), a merchant's coat, and hats on
  bones.Head (top hat; the emperor's beaver hat with gold band, rosette and peacock feather; HAT_Y 1.55 sits on Leo's
  hair). `web/emperor_clip.js` (work in progress): all 17 shots staged as a first pass and spot-checked (hook: the Emperor walks down the
  street, townsfolk wave/cheer/clap, tag "SAN FRANCISCO, 1859", headline "EMPEROR OF THE / UNITED STATES"; a wide for
  "the city goes along with it"; the name close-up "JOSHUA NORTON"; the dock: Leo the merchant in a frock coat and top
  hat with his rice, "ALL THE RICE", then ship after ship sails in, the rice pile grows, "BROKE" at "lost
  everything"; the newspaper: at the BULLETIN's door a handwritten proclamation card, abridged from the real one, then
  the DAILY EVENING BULLETIN front page "NORTON I / EMPEROR OF THESE UNITED STATES", 17 September 1859; the reign: the
  uniform with callouts GOLD EPAULETTES / FEATHERED HAT, his fifty-cent Empire of North America note stamped ACCEPTED at
  the store, the decree CONGRESS IS ABOLISHED, then *crickets*; the arrest: an officer in police blue with a star badge
  points at the shocked Emperor, ARRESTED!; the townsfolk stomp, OUTRAGE!; the chief (Max) and two officers salute him
  while the townsfolk clap; the bridge: on the dock he points across the bay, decree BUILD A BRIDGE ACROSS THE BAY;
  the Bay Bridge rises, tag 1936; the farewell: his feathered hat on a red cushion in the street, townsfolk lining it,
  officers saluting, tag SAN FRANCISCO, 1880; the end card). Every shot is staged as a first pass.

## Next
1. Polish `web/emperor_clip.js` (first pass, spot-checked only): render a full preview sheet; the farewell needs a much
   bigger crowd ("thousands"); the bridge is plain (towers and a deck: add cables); Skye (the editor) and Mia (the
   shop) from story.md are not cast yet; the hook headline and the name sit close to the hat.
2. Hold check (props: none held yet), fit check, sound cues, cover (`web/cover_clip.js`), then the full render (needs
   disk space: see the Banana and Penguin notes), encode, blank-frame check. Post copy is done (`delivery/post.json`).
