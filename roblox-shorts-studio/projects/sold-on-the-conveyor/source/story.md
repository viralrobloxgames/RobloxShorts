# Everything on the Conveyor Gets Sold (standalone)

Status: script draft, awaiting approval. No narration or rendering until approved.

**Logline:** In Max's tycoon the furnace sells anything that rides the conveyor. Max needs $1,000 for the Golden Dropper,
and ore pays $1, so he sells his sword, hat and shoes, then tricks Leo onto the belt ($1). A "FREE ADMIN - STAND HERE"
sign brings a queue of noobs ($1 each) and Mia with both crowns ($900): $999. One dollar short, Leo talks Max into selling
himself. $1,000 - the Golden Dropper builds itself - but selling yourself sells your tycoon too. Max respawns outside his
own gate in his socks; Leo owns it now: "Hey Max. Check out my conveyor." (Loops back to the hook.)

**Why it's new:** first tycoon short (the pack's tycoon_dropper, tycoon_conveyor, tycoon_ore are unused). The literal
mechanic is "the sell furnace takes anything", with a running cash counter on screen the whole video. Max has agency and
the twist lands on him; Leo's revenge is set up early ("started planning").

**Cash counter (HUD, every beat):** sword +50 → hat +20 → shoes +5 = $75 → Leo +1 = $76 → 23 noobs × $1 = $99 →
Mia +900 = $999 → Max +1 = $1,000. Goal bar "GOLDEN DROPPER $1,000" fills as it climbs.

## Beats (~68 s)
1. **Hook (frame 1):** punch-in on Max tossing his sword onto the moving conveyor; it rides into the furnace, "+$50"
   pops, HUD $0 → $50. Whip-pan to the price pop.
2. **Hat, shoes:** hat on the belt "+$20", shoes "+$5" (Max now in grey socks for the rest of the video). HUD $75.
3. **The goal:** wide on the tiny tycoon; a glowing locked pad "GOLDEN DROPPER $1,000". The basic dropper plops one
   ore: "+$1". Max facepalms.
4. **Leo arrives** laughing (`laugh_big`) at the gate. Max waves him over, points at the belt.
5. **Leo stepped on:** Leo rides the conveyor, `shock`, into the furnace. "SOLD +$1". HUD $76.
6. **Respawn:** Leo pops in at the spawn pad, arms crossed, then `scheming` - he's planning (setup for the ending).
7. **The sign:** Max hammers up "FREE ADMIN - STAND HERE" at the conveyor start.
8. **The line:** overhead shot, a queue of noobs winding around the map. Rapid-fire "+$1 +$1 +$1" pops as noobs ride in,
   counter rattling up to $99.
9. **Mia:** Mia with both crowns struts up, `proud`, onto the belt. Crowns sparkle. "SOLD +$900". HUD $999.
10. **One short:** HUD flashes red "$999 / $1,000". Max pats his pockets, looks around the empty floor - nothing left.
11. **Leo returns:** walks in calm, `point` at Max: "You." Max `think`s, shrugs, steps on the belt.
12. **Sold:** Max rides in. "+$1". HUD hits "$1,000" in gold. Confetti burst.
13. **Golden Dropper builds itself:** pieces drop in and stack; gold ore starts falling. Leo smiles off to the side.
14. **The twist:** "OWNER: MAX" sign over the gate flips to "OWNER: NONE" then "OWNER: LEO" as Leo steps on the claim pad.
15. **Max respawns** outside the gate in his socks; the gate's owner-only laser blocks him (bounce back, small zap).
16. **Loop:** Leo at the conveyor, gesturing: "Hey Max. Check out my conveyor." Cuts back to the hook framing.
17. **CTA:** "Follow Viral Roblox Games for more" + @viralrobloxgames / FOLLOW FOR MORE end card (~2 s).

## Assets
Max (hat + shoes removed after beat 2; grey socks), Leo, Mia (two crowns), 4-6 noob variants for the queue;
map/tycoon_dropper, map/tycoon_conveyor, map/tycoon_ore, map/spawn_location, map/baseplate_tile_studs; procedural:
sell furnace (glowing intake), gate with owner sign + owner-only laser, "FREE ADMIN" sign, Golden Dropper (gold-tinted
dropper copy), price pops and HUD cash counter (overlays.json). Poses: `shock`, `laugh_big`, `scheming`, `proud`,
`think`, `shrug`, `point`, `facepalm` - no two-arms-up poses. Standalone; no part tags.
