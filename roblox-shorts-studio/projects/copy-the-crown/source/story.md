# Copy the Crown (standalone story, one part)

Mode: game rule with a downside, third person (references/story.md). The 2026-10-05 analytics review found Admin-style
rivalry premises and simple game rules (Every Jump Makes You Bigger) hold viewers best, so this is a crown-power
rivalry built on one game rule, with a bookend payoff. Script: `../script.txt` (150 words with the CTA; expect about
60-61 s of speech, a 61-63 s video: inside the 61-65 s rule). Cast: Leo, Max, Mia, plus Skye, the Noob and a few
extras copying in the background. Route: web (three.js): round arena platform in a lava sea, `crown_admin` accessory,
big round timer and a million-coin board.

## The rule (one, kept consistent)
Whoever wears the crown, every other player copies their moves: each step, jump, spin, dance or bow, done from where
they stand and the way they face. When the crown holder stands still, everyone else can move freely. Touch the crown
and it's yours. Whoever has it when the timer ends wins a million coins. Everything comes from the rule:
- the same move from a different spot is a different outcome (Max steps off the edge);
- the chaser always copies the runaway, so facing Leo and charging him just mirrors him backwards (never closer);
- a bow towards someone right in front of you brings two heads together (the bonk steals the crown);
- once Mia has it, Leo copies her: her small step back is his step back, and all his backing away left him (and Max)
  at the edge. The opening trick comes back on the boys.

## Beats
1. Hook (frame 1): Leo puts the crown on in the middle of the arena. Big round timer (0:60) and "1,000,000 COINS"
   board. He takes three steps forward; every player takes three steps; Max, at the arena's edge, steps off into the
   lava (splash, respawn sparkle). Reads on mute: crown, copied steps, splash.
2. Max respawns and charges Leo while he stands still. Leo walks backwards; Max, facing him, walks backwards too. Side
   shot showing the gap staying the same. Max's frustrated face. (Both are drifting towards the edge: plant it with a
   wide shot showing Leo's heels getting closer to the lava rim.)
3. Leo shows off: he spins, the whole server spins (wide, 6-8 players in sync); he dances (`dance1`), everyone dances.
   Timer ticks down, 0:30.
4. 0:10. Leo stops to soak it in (`proud`, hands on hips). Mia, free while he's still, walks right up in front of him,
   smiling. Speech bubble: "Leo, that was amazing. Take a bow."
5. Leo can't resist: he bows; Mia, facing him, bows too. BONK (heads meet, star pop). The crown hops from Leo's head
   onto Mia's. Leo's shock (arms out at shoulder height).
6. 0:03. Mia takes one small step back. Everyone takes one step back. Wide reveal: Leo and Max are both on the very rim
   from all their backing away. Splash. Splash. Timer 0:00: "WINNER: MIA", million-coin counter. Mia's sweet wave
   (`waveArm`). Hold.
7. CTA: "Follow Viral Roblox Games for more stories like this." + end card (@viralrobloxgames, FOLLOW FOR MORE).

## Notes
- Copying should look exact: all copiers start and stop on the same frame as the crown holder, with the same
  distance-driven leg cycle (`travel` / `travelTo`, Roblox walk speed), each along their own facing.
- No two-arms-up poses: the spin is a turn on the spot with idle arms; the dance is a pack dance checked from the
  camera angle; the bow is a forward lean from the hips (author it if the pack has none).
- Lava falls are the standard Roblox reset (splash + respawn sparkle), not injury. No swearing, nothing sexual.
- Crown on a non-holder must never show: one `crown_admin` object that moves between heads (`wear()`), plus fit check.
- Cover idea: Leo in the crown, a row of players behind him copying the same pose, Max mid-splash; text
  "EVERYONE COPIES / THE CROWN" inside y 240-1680.
