# Stealing a T-Rex Egg (Part 1)

A parody of **Steal an Egg** (Roblox, released August 2026, 1M+ concurrent players): sneak into a biome, grab an egg,
and the guardian wakes and chases you. Get caught and you ragdoll, get flung and drop the egg. Reach the safe zone at
your base and the guardian has to stop. Giant eggs slow you down ("carry drag"). Hatched eggs become pets that earn
money every second, and other players can walk into your base and take your eggs. Players really do team up against
guardians with "bait and switch": one pulls the guardian away while the other grabs the egg. Research notes:
games.gg biome guide, stealanegg.pro steal/escape guide, player.one popularity article.

Cast: **Leo** (main: goes first, carries the egg), **Max** (rival turned decoy, flung three times), **Mia** (the
twist: a background thief the whole video). All original assets: the T-rex is a new blocky R6-style build, not the
game's model.

Why it should work:
- Frame 1 reads on mute: a giant sleeping T-rex (Zzz), a glowing giant egg under its chin, Leo tiptoeing in.
- A payoff every 3-5 s: wake-up roar, chase, BONK ragdoll flings (each one higher), a "TRIES" counter, a decoy dance,
  the tail jump, a slam at the safe-zone line, the hatch.
- Rules are planted before they pay off: carry drag ("giant eggs make you slow") makes the decoy plan necessary, and
  the safe zone stopping the T-rex is shown once before the final run.
- **Twist with a fair plant:** Mia is visible in the background of the chase and montage shots, tiptoeing in and out
  with eggs while the T-rex chases the boys. The nest's egg count visibly drops in every nest shot (12 -> 0). On a
  rewatch it's all there.
- Every beat is physical: flings, chases, a dance, the tail stomp. No standing around.
- 165 words, about 67 s in George voice C. US spelling.

## Beats (hook first)

1. **HOOK (0-3 s).** Dusk-lit prehistoric biome. A huge sleeping T-rex curled around a nest of eggs; one giant golden
   egg glows under its chin. "Zzz" puffs. Leo tiptoes in from the foreground. HUD: biome name "PREHISTORIC", Leo's
   speed, "GUARDIAN: ASLEEP".
   *"This T-rex is sleeping on the best egg in Steal an Egg."*
2. **Grab (3-6 s).** Leo hugs the giant egg to his chest (carry pose). One eye of the
   T-rex snaps open. HUD flips to "GUARDIAN: AWAKE".
   *"Leo tiptoed in and grabbed it. The T-rex woke up."*
3. **Carry drag (6-9 s).** The T-rex stands up and ROARS (jaw wide, camera shake). Leo runs, but slowly: "SPEED -80%"
   tag, his legs pedal and he barely moves. The safe zone glows far away.
   *"Problem: giant eggs make you slow."*
4. **BONK 1 (9-11 s).** The T-rex catches him: a headbutt, Leo ragdolls through the air, the egg drops and rolls back
   to the nest. "BONK".
   *"Bonk. Leo went flying."*
5. **Max tries (11-15 s).** Max laughs at Leo in the grass, then sprints in, grabs the egg, and gets flung even
   higher (cut to him tiny against the sky).
   *"Max laughed. Then Max tried. Bonk. Max went flying higher."*
6. **Ten tries (15-19 s).** Fast montage: TRIES 3... 10, each a different fling (tail swipe, stomp bounce, nudge).
   In the background of two shots, Mia tiptoes past with an egg (plant). They lie side by side, dazed, and look at each
   other.
   *"Ten tries later, they had one idea left. Teamwork."*
7. **The plan (19-23 s).** A quick chalk-style plan card: Max = DECOY, Leo = EGG. Fist bump.
   *"Max would distract the T-rex. Leo would grab the egg."*
8. **The decoy (23-28 s).** Max runs in waving one arm and dancing; the T-rex chases him in a big circle around the
   nest. (Mia slips past in the background again, with an egg.)
   *"Max ran in waving, dancing, anything. It worked. The T-rex chased Max in circles."*
9. **The run (28-33 s).** Leo grabs the giant egg and waddles away: "SPEED -80%" again. The T-rex stops, sniffs, and
   turns its head towards Leo. Tension sting.
   *"Leo grabbed the egg and ran. Slowly. Then the T-rex turned around."*
10. **The sacrifice (33-39 s).** Max sprints in and jumps on the T-rex's tail. It spins round: BONK, Max flies
    (third and highest fling, over the camera). "MAX: TOOK ONE FOR THE TEAM".
    *"So Max did the bravest thing he's ever done. He jumped on its tail. Bonk. Max went flying. Again."*
11. **Safe zone (39-44 s).** Leo staggers over the glowing line into the base. The T-rex lunges and slams into the
    invisible wall; it can't follow. "SAFE".
    *"But Leo made it. Safe zone. The T-rex couldn't follow."*
12. **The hatch (44-50 s).** Leo places the egg in their garden; Max limps back. It cracks, and out pops a tiny baby
    T-rex. Money tag: "+$1/s". The boys look at each other.
    *"Their first egg. They'd earned it. It hatched into a baby T-rex worth one dollar a second."*
13. **The twist (50-62 s).** Pan to the next plot: MIA's base, twelve eggs lined up glowing, a money counter racing.
    Mia waves one hand. Quick replay strip of the background plants (Mia tiptoeing past each chase). Back at the nest,
    the T-rex looks down: empty nest. "NEST: 0 EGGS".
    *"Then they saw Mia's base. Twelve T-rex eggs. While the T-rex was busy chasing them, Mia just walked in and took
    them. Every. Single. Time."*
14. **CTA (62-67 s).** The T-rex slowly turns its head towards Mia's base (cliffhanger). End card "PART 2: THE T-REX
    WANTS ITS EGGS BACK?" + @viralrobloxgames + FOLLOW.
    *"Follow Viral Roblox Games for part two."*

## Build notes

- New: blocky T-rex rig (body, head with jaw, eyes with lids, tiny arms, two legs, 4-segment tail; procedural sleep
  breathing, wake, roar, run cycle driven by distance, headbutt, tail spin, turn-and-sniff), eggs (speckled ellipsoids,
  one giant golden), nest, ferns/palms/rocks/volcano backdrop, safe-zone boundary (glowing green wall), base plots
  with name signs, a baby T-rex.
- Ragdoll flings: arc + spin with `shock` pose (no two-arms-up), dust on landing. Carry pose: `hold` with the egg
  in front. Max's wave: `waveArm` (one arm).
- No accessories unless a later choice adds one (fit check otherwise has 0 pairs).
