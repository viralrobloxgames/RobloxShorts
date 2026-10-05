# Whatever Mia Draws (standalone story, one part)

Mode: power with a downside, third person (references/story.md). Script: `../script.txt` (153 words with the CTA;
expect about 61 s of speech, so a 62-63 s video: inside the 61-65 s rule).
Mia has the pencil; Leo is the class's best artist; Max and the Noob are classmates who scream and run.
Lion: `assets/roblox_pack/creatures/animal_lion`.

## The rule (one, kept consistent)
Anything drawn with Mia's pencil comes to life exactly as it was drawn: wobbly lines, square wheels, missing
parts and all. It's the pencil, not Mia, so it works for whoever holds it.
The downside: Mia can't draw, so everything she makes is useless. The real danger is the opposite: in a good
artist's hand the pencil makes something perfect, and a perfect lion is a real lion.
The way out uses the same rule: a scribble is the one thing nobody can draw badly, and a scribble is a ball of yarn.

## Beats
1. Hook (frame 1): Mia's pencil finishes a stick dog on the page and it hops off the paper onto her desk,
   wagging. Reads on mute in a second.
2. Rule: "Exactly the way she draws it. And Mia can't draw." Close on her drawing: four sticks and a circle.
3. Montage (~1.5-2 s each, snappy): the stick dog fetches a stick (it's basically the same shape as the dog); a bike with
   square wheels clunking across the classroom (bonk, bonk); her stick-figure boyfriend standing beside her
   giving one thumbs-up / a single wave.
4. Leo, the class artist, leans over and grabs the pencil: "Watch and learn."
5. Leo draws fast and carefully; the page shows a detailed lion. "Every hair. Every tooth. It's perfect."
   The lion steps out of the page, full size. It roars (hair blown back, papers flying).
6. Panic: Max and the Noob run for the door (real runs, `travel`). The lion backs Leo into the corner by the
   board. Mia snatches the pencil out of Leo's hand.
7. Attempt 1 (partial fix): Mia draws a cage. Wobbly hand-drawn bars drop around the lion and hold when it
   swipes. "She forgot the roof." Camera tilts up: no top. The lion leaps straight out.
8. Attempt 2 (fails, but shows the clue): the stick boyfriend steps between the lion and Leo, one arm out.
   The lion paws him across the floor like a cat with a toy; he spins away and lands, still giving a thumbs-up.
9. The realisation: Mia watches the lion swat; beat on her face. "Mia stops. It's just a big cat. And there's
   one thing anyone can draw."
10. Payoff: Mia scribbles a big messy loop. A ball of yarn drops off the page and rolls across the floor. The lion
    pounces, rolls on its back with it, purring. Leo slides down the wall, safe.
11. Reframe: "For once, Mia drew something perfectly." Hold on the lion with the yarn, the stick dog
    sitting next to it.
12. Button: "Leo wants another go." He reaches for the pencil; Mia pulls it away, deadpan: "No. You're too good."
13. Spoken CTA + end card: "Follow Viral Roblox Games for more stories like this." @viralrobloxgames,
    FOLLOW FOR MORE.

## Build notes (web route)
- New: a classroom (desks, board, door, window), a paper sheet on Mia's desk with a pencil, and the drawn things:
  a stick dog, a square-wheeled bike, a stick boyfriend, a wobbly cage (no roof) and a yarn ball. Build the drawn
  things from thin dark "pencil-line" cylinders and loops with a slight wobble, so they read as drawings come
  alive and contrast with the solid lion.
- One consistent "comes to life" effect each time (a quick pencil-scratch shimmer as the drawing lifts off the
  paper), so viewers learn the rule by eye; the lion gets the same effect, just bigger.
- Show the page for Leo's lion as a detailed decal (it's fine for that one to look like a good sketch).
- The lion is the pack's `animal_lion`: check its scale against the desks and the classroom door; give it a
  pounce/swat, a leap and a roll-over (keyframed body rotation). It must clear the cage bars, not pass through them.
- Runs are real locomotion (`travel`), never on the spot. Leo's cornered pose uses `shock` (arms at shoulder
  height), never two arms up. Mia's last line is a single arm pulling the pencil back.
- Speech bubbles for "Watch and learn." and "No. You're too good." so the button reads on mute.
