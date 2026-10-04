# Every Jump Makes You Bigger (Part 1)

New format, not the admin series: **"Every ___ Makes You ___"** (`ideas/series/every-x-makes-you-y.md`). Each part is one
Roblox game with one silly rule ("+1 size every jump", "+1 speed every step"), the kind of "+1 every ___" game that is
trending on Roblox. Leo and Max race to win under that rule; whoever uses the rule hardest gets undone by it.

Main character: **Leo** (agency: finds the exploit and pushes it). Rival: **Max** (out-thinks Leo, and the plan backfires).
Mia and the noob are not in this part, so the story stays a clear two-player race.

Why it should work:
- **Readable on mute in one second:** frame 1 is Leo mid-jump going POP to double size under a giant
  "EVERY JUMP = BIGGER" sign. Everyone knows what a jump is.
- **A visible payoff every 3-5 s:** each jump is a size pop, and the stakes are physical (a tiny block, a tiny door,
  a cracking floor). An on-screen JUMPS / SIZE counter and the round timer run the whole video.
- **Planted rule, paid off:** "back to his last checkpoint" is planted in Max's fail (beat 4) and is the twist in beat 9.
  It's a real obby rule viewers already know, so the twist feels fair.
- **Twist on both main characters:** Max's plan to get rid of Leo shrinks Leo for free; Leo wins and is undone by one
  victory jump.
- **Series hook:** "Next game: every step makes you faster" makes Part 2 a new game with the same cast.
- 174 words, about 70 s in George voice C (Part 5 was 169 words for 68 s), so over 65 s for Creator Rewards. US spelling.

Scale note: the leaderstats show Stage and Size (= jumps + 1). On screen the first jump doubles you, then growth slows
(`SIZE(j) = 2 j^0.42`: about 10x at 50 jumps, about 14x at 100) so the giant still fits the shots. Every walk and stomp uses `web/lib/locomotion.js` with stride scaled by size (no
walking on the spot). No two-arms-up poses: hops use a mid-stride leg pose with arms low, pops use `shock` (arms at shoulder height), the
fast-forward uses `proud`; the victory hop holds the trophy (`tool_hold`).

## Beats (hook first)

1. **HOOK (0-3 s).** Start pad, close crash-zoom on Leo mid-jump: POP, he doubles in size. Giant sign behind:
   "EVERY JUMP = BIGGER". HUD: JUMPS 1 · SIZE x2, round timer 1:00, "FIRST TO THE TROPHY WINS".
   *"In this obby, every jump makes you bigger."*
2. **The exploit (3-9 s).** Leo plants his feet on the start pad and spams jump. Counter rolls 2→50, each pop a bit
   bigger, each landing shakes the camera. Max (normal size) stares up. Whip-pan up to Leo's grinning face in the sky.
   *"Leo's plan: skip the obby. He just jumped. Fifty times."*
3. **One step (9-12 s).** Giant Leo steps over the whole lava level (lava strip, kill bricks, obby blocks) in one
   stride. STAGE 1 → STAGE 12 flies up on the HUD. Each foot lands on a checkpoint pad, which flashes green.
   *"Then he stepped over the whole lava level."*
4. **Max copies, and fails (12-20 s).** Max jumps on a small 2x2 obby block over lava. Pop, pop, pop: his feet grow
   wider than the block, he wobbles and slides off into the lava. Poof, he respawns at the start pad, normal size.
   HUD: "CHECKPOINT: START".
   *"Max tried it too. On a tiny block. He grew. The block didn't. Back to his last checkpoint. The start."*
5. **The tiny door (19-25 s).** Leo's four giant strides to the end of the lane. The finish is a tiny room with a
   normal-size door, a glass front and a glass roof, the trophy on a pedestal inside. Leo leans right over it (low shot
   from the porch: the tiny door, his huge face above it), then the inside view up through the glass roof: the trophy,
   and a giant face looking down. "CAN'T FIT".
   *"Leo reached the finish in four steps. But the finish was a tiny door. He could see the trophy. He couldn't fit."*
6. **The block (26-32 s).** A pop-up card: "SHRINK = RESET". Leo shakes his head, walks to the door, and sits down with
   his back against it, right on the last checkpoint pad, which lights up: "CHECKPOINT 20" (this plants the twist). He
   completely covers the door. "BLOCKED".
   *"The only way to shrink? Reset. So Leo sat in front of the door. If he couldn't win, nobody could."*
7. **The bait (33-40 s).** Back at the start, tiny Max types in chat: "bet u cant hit 100 jumps". Giant Leo reads it,
   narrows his eyes, stands up. Chat: "watch me".
   *"Max typed: bet you can't hit a hundred jumps. Leo couldn't say no."*
8. **The fall (40-48 s).** Leo jumps in front of the door: 60, 70, 80, 90... each landing shakes harder, cracks spread
   across the finish platform. At 99 the floor cracks open. At 100 he lands, the slab under him breaks away, and he drops
   into the void. "Leo fell out of the map" banner. The door, its ledge and the checkpoint pad stay.
   *"Ninety-nine. The floor cracked. One hundred. Leo fell out of the map."*
9. **The twist (48-58 s).** Max spams 50 jumps at the start, goes giant and stomps over the course, grinning... Cut: a
   poof at the checkpoint pad right next to the door, and tiny normal-size Leo respawns there. HUD: "LEO: CHECKPOINT 20".
   Max's grin drops, mid-stride.
   *"Door clear. Max went giant and stomped over. But Leo respawned at his last checkpoint. Right next to the door.
   Tiny again. Max had just shrunk him for free."*
10. **The win, and the undo (58-66 s).** Leo strolls through the tiny door just as Max's giant hand slaps down outside.
    He grabs the trophy: "LEO WINS". Then he does one victory jump. POP. The tiny room fills with Leo, his squashed face
    pressed against the window, trophy squeezed in one hand. Outside, giant Max peers in through the doorway.
    *"Leo walked in and grabbed the trophy. Then he did a victory jump. In a very small room."*
11. **Series hook + CTA (66-70 s).** Teleport flash, a new sign: "NEXT GAME: EVERY STEP = FASTER". End card: "PART 2"
    + @viralrobloxgames + FOLLOW.
    *"Next game: every step makes you faster. Follow Viral Roblox Games for part two."*

## Assets

All already in the pack: obby blocks, lava strip, kill brick, checkpoint, spawn location, finish pad, trophy, podium,
stage sign, round timer board, island platforms, wedges. New: a small door-in-a-wall "trophy room" (built from obby
blocks + a doorway gap), a crack decal / broken-slab state for the finish platform, a pop SFX (pitch rising with size)
and a heavy landing thud (stretched `impact_*`).

## Cover idea

Giant Leo crouched at a tiny glowing door, one eye pressed to it, trophy visible inside. Headline "EVERY JUMP =
BIGGER", small "PART 1" tag. Everything inside y 240-1680.
