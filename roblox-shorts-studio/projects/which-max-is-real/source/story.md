# Which Max Is Real? (After Hours horror, Part 2)

Picks up exactly where Part 1 ("The Server Says One") ended: the corridor, lights back on, two identical Maxes side by
side, the question "Which Max is real? Left or right?". Canon carried over: the copy (the Unlisted) is its target's
**mirror image**; it only copies what it has seen; while it is learning someone it is half a second late; once it has
learned them it isn't late any more. The real Max is on the LEFT; the copy's hoodie star is on the wrong side.

## Beats
1. **Hook (frame 1):** the two Maxes side by side in the corridor, LEFT / RIGHT tags, player list "PLAYERS ONLINE: 2 —
   Max, Max", a small PART 2 tag. "Two Maxes. Same face. Same name."
2. **The rule stated:** "It wasn't late anymore": both blink and shift in perfect sync.
3. **Mia joins:** join message in the list (3 players). She has been spectating; a quick replay inset of Part 1's step
   ("He stepped left. It stepped left.") reframed as a mirror: she worked it out. "It doesn't copy you. It mirrors you.
   Left becomes right."
4. **The test:** Mia (behind them, so she isn't seen doing it) orders "Raise your right hand." Left Max raises his RIGHT
   arm (single raised arm: `waveArm`, allowed); right Max raises his LEFT. Freeze-frame, circle the hands, then the
   hoodie stars (callback to Part 1's clue). "If you said left... you were right." (rewards the commenters)
5. **Exposed:** the copy looks at Mia and smiles (Max's face, `evil_grin`): the scariest it has looked.
6. **Chase (short, continuous, no slow-motion rewinds):** it sprints down the corridor for the EXIT door at Roblox run
   speed; Max chases, too slow. Leo is in the open doorway (lobby side) holding the door.
7. **The mistake:** "Close the door, Leo!" (on-screen chat bubble from Mia). Leo doesn't. He waves (one arm).
8. **It learns Leo:** the copy waves back, half a second late (+0.5s tag, same device as Part 1), and its body
   texture/hair flips to Leo's: it is now a mirror Leo.
9. **Cliffhanger:** list updates: "PLAYERS ONLINE: 4 — Max, Mia, Leo, Leo". Two Leos in the doorway.
10. **CTA:** "What test would YOU use to catch it? Comment below." + "FOLLOW FOR PART 3 / @viralrobloxgames" end card.

## Notes for the build
- Reuse Part 1's scene (`../the-server-says-one/web/`): corridor, door, lobby, horror lighting, player list, mirror
  copy (`mirror: true`), sound kit. New: Mia and Leo (pack characters), a hand-raise freeze-frame with circles, the
  copy's switch from Max to Leo (swap meshes during a flicker), chat bubble for "Close the door, Leo!".
- The comment prompt is open-ended on purpose: the best answers can seed Part 3 (credit the commenter on screen).
- Part 3 canon to decide later: which Leo is real (keep the mirror tell consistent: Leo's hoodie logo/hair parting).
