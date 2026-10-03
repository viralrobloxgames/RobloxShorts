# Which Max Is Real? (After Hours horror, Part 2 of 2: the finale)

Picks up exactly where Part 1 ("The Server Says One") ended: the corridor, lights back on, two identical Maxes side by
side, the question "Which Max is real? Left or right?". Canon carried over: the copy (the Unlisted) is its target's
**mirror image**; it only copies what it has seen; while it is learning someone it is half a second late; once it has
learned them it isn't late any more. The real Max is on the LEFT; the copy's hoodie star is on ## Beats
1. **Hook (frame 1):** the two Maxes side by side in the corridor, LEFT / RIGHT tags, player list "PLAYERS ONLINE: 2 —
   Max, Max", a small PART 2 tag. "Two Maxes. Same face. Same name."
2. **The rule stated:** "It wasn't late anymore": both blink and shift in perfect sync.
3. **Mia:** she was spectating (join message, list goes to 3). "It doesn't copy you. It mirrors you." Quick replay inset
   of Part 1's step-left reframed as a mirror.
4. **The test:** "Raise your right hand." Left Max raises his RIGHT arm (single raised arm, `waveArm`); right Max raises
   his LEFT. Freeze-frame, circle the hands, then the hoodie stars (Part 1's clue). "If you said left... you were right."
5. **It turns on Mia:** the copy stares (Max's face, `evil_grin`), then lunges for her. Max jumps between them.
6. **The plan (suspense):** "Walk backwards." A mirror moves the opposite way along the line between them, so every step
   Max takes back, it takes back too, toward the open EXIT door. Step... step... a heartbeat per step. One step from the
   door it stops: "It was fighting the mirror." Hold on its face; the delay tag flickers (+0.5s, +0.2s, 0.0s).
7. **The finish:** Max sprints backwards at full speed; the mirror has to follow and is flung backwards through the
   doorway. Mia slams the door (latch, impact).
8. **Resolution:** the list updates to "PLAYERS ONLINE: 2 — Max, Mia". Silence, lights steady.
9. **The chilling button:** Max waves goodbye at the closed door's window/frame. Nothing waves back. (Concluded: the copy is
   gone; this is an eerie last image, not a cliffhanger.)
10. **CTA:** "What should we make next? Comment below." + "FOLLOW @viralrobloxgames" end card (no part 3).

ames" end card.

## Notes for the build
- Reuse Part 1's scene (`../the-server-says-one/web/`): corridor, door, lobby, horror lighting, player list, mirror
  copy (`mirror: true`), sound kit. New: Mia (pack character), a hand-raise freeze-frame with circles, the
  copy's switch from Max to Leo (swap meshes during a flicker), chat bubble for "Close the door, Leo!".
- Mirror physics must match Part 1 exactly: sideways moves same direction, moves along the line between them opposite.
  The backwards-walk is real locomotion for both (distance-driven legs), no sliding.
- The comment prompt asks for the next story idea: the replies feed the next series.
- Series ends here (2 parts).
