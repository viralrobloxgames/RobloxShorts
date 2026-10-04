# Every Step Makes You Faster (Part 2)

Part 2 of **"Every ___ Makes You ___"** (`ideas/series/every-x-makes-you-y.md`), the game Part 1 teased. A new game, same
cast, stands alone: the rule is on a giant sign and the Speed counter climbs with every footstep from frame 1.

Main character: **Leo** (agency: farms the rule harder than anyone, then tries to sabotage Max with it). Rival: **Max**
(out-thinks the rule this time and wins). Part 1 was Leo's win; this part is Max's, so the rivalry stays even.

It's a tortoise-and-the-hare race inside a "+1 speed every step" game:
- **Leo never stops moving** from the hook to the kick. That's the running gag and the reason for every frame of motion.
- **Max finds the loophole:** jumps aren't steps, so he hops the course at speed 16 and never falls off.
- **Planted twist, paid off:** in the lobby Leo's laps make enough wind to spin Max (beat 2). Later Leo runs circles
  around Max to blow him into the lava; the wind becomes a tornado and throws Max over the lava onto the finish.
- **Planted button:** "Still at speed one thousand" (speed doesn't reset on respawn) carries Leo to 9,999, and a small
  "NO SPEED HACKS - AUTO KICK" line on the lobby sign (visible, not narrated) pays off when the anti-cheat kicks him.
  For speed hacking. In a speed game.
- **Series hook:** "Next game: every coin makes you heavier" (from the series ideas list).
- 172 words; Part 1 was 174 words for 65.0 s in George voice C, so this should land about 64-66 s. US spelling.

Devices kept from Part 1: rule sign on frame 1, Roblox leaderstats (Stage / Speed), round timer, "+1 SPEED" pops on
footsteps, x10 fast-forward for big counts, "PART 2" tag, call to action end card.

Speed on screen: leaderstats show the number; the stride stays at Roblox run speed visually up to ~100, then Leo turns
into a streak (motion blur afterimages, speed lines, dust trail) because real 1,000-stud/s motion can't be read. Every
run uses `web/lib/locomotion.js` with the leg cycle driven by distance (no running on the spot). No two-arms-up poses:
Max spinning in the wind uses `shock` (arms at shoulder height); Max's win is `proud`.

## Course (one straight lane, left to right in the wide shots)

Round **lobby** (spawn pad in the middle, glass gate on one side, rule sign above) -> long **runway** -> **lava field**
with obby blocks, a small rest island and one last big gap -> small **finish island** (finish pad, trophy, winners' podium) -> the end of the map (void).

## Beats (hook first)

1. **HOOK (0-3 s).** Crash-zoom on Leo mid-sprint, each footstep pops "+1 SPEED", leaderstats Speed 16, 17, 18...
   Giant sign behind: "EVERY STEP = FASTER". Round timer "STARTS IN 0:10".
   *"In this game, every step makes you faster."*
2. **Lobby laps (3-11 s).** Top-down: Leo running laps of the round lobby, x10 fast-forward. Speed 100, 500, 1,000; Leo
   turns into an orange streak with afterimages. Max stands at the spawn pad in the middle; the wind lifts his feet off
   the floor and he spins slowly, arms out (`shock`), dizzy face. (Plants the wind.)
   *"Leo ran laps of the lobby before the race even started. Speed: one thousand. He was so fast, he made wind. Max
   started spinning."*
3. **GO (11-15 s).** The glass gate drops. Leo's streak crosses runway, lava and finish in one second (whip-pan along it).
   *"Go! Leo crossed the whole map in one second."*
4. **Can't stop (15-20 s).** At the finish island his feet skid, sparks, he can't stop: shoots past the trophy, off the
   end of the map, arcs into the void. Banner: "LEO FELL OFF THE MAP".
   *"Then he found out he couldn't stop. He flew past the finish, and right off the map."*
5. **Respawn, speed kept (20-25 s).** Poof on the lobby spawn pad: Leo, already running. Leaderstats Speed still 1,000
   (circled). Max is still at the gate, dizzy.
   *"He respawned at the start. Still at speed one thousand."*
6. **Try two, try three (25-30 s).** Try two: the camera holds on the lobby, Leo is gone in one frame, dust settles on
   an empty lane, then the camera whips to catch up (too late). Try three: wide shot, the streak sails off the end of
   the map again. Counter: "FELL OFF MAP x3".
   *"Try two. The camera couldn't keep up. Try three. Off the map again."*
7. **Max's loophole (30-38 s).** Max hops block to block over the lava, careful, never runs. Every landing: "JUMP:
   +0 SPEED". Leaderstats: Max Speed 16. Leo's streak whooshes past him three times; Max doesn't even turn his head.
   *"Max didn't run. He jumped. Jumps aren't steps. Speed: still sixteen. Slow, but still on the map."*
8. **Sabotage (38-44 s).** Leo's face, scheming, mid-run. Max has reached the small rest island in the middle of the lava,
   before the last big gap. Leo runs circles around him on the island: faster, faster, an orange ring, speed 2,000, 4,000.
   *"Leo had a new plan: blow Max into the lava. He ran circles around Max. Faster. And faster."*
9. **The tornado (44-51 s).** The wind becomes a grey tornado with Max in it, spinning (`shock`), lifted. It throws him in
   a high arc over the last lava gap... he lands on the finish pad. Trophy. "MAX WINS". Max `proud`.
   *"The wind became a tornado. It picked Max up and threw him over the lava. Right onto the finish. Max wins."*
10. **The kick (51-59 s).** Leo still running circles, unable to stop, the counter rolls to 9,999. Close on the lobby
    sign's small print: "NO SPEED HACKS - AUTO KICK". A grey disconnect box: "You were kicked: speed hacking detected".
    Leo blinks out mid-stride; chat: "Leo left the game". Max, on the podium, looks at the empty ring of dust.
    *"Leo still couldn't stop. Nine thousand, nine hundred and ninety-nine. The anti-cheat kicked him. For speed
    hacking. In a speed game."*
11. **Series hook + CTA (59-65 s).** Teleport flash, new sign: "NEXT GAME: EVERY COIN = HEAVIER". End card "PART 3"
    + @viralrobloxgames + FOLLOW.
    *"Next game: every coin makes you heavier. Follow Viral Roblox Games for part three."*

## Assets

In the pack: spawn location, lobby platform, obby blocks, lava strip, finish pad, trophy, winners' podium, stage sign,
round timer board, island platforms. New, built in the clip: glass gate, orange speed streak / afterimages and speed
lines, dust puffs, a tornado (stacked translucent spinning rings), the kick dialog and chat lines as HUD overlays.
SFX: footstep ticks rising in pitch, whoosh (`swish_*`) per pass, sonic boom on GO, skid, fall whistle, wind loop for the
tornado, win sting, the kick "disconnect" tone.

## Cover idea

Leo as an orange streak running a ring around a spinning Max lifted in a tornado; headline "EVERY STEP = FASTER",
leaderstats "Speed 9,999", small "PART 2" tag. Everything inside y 240-1680.
