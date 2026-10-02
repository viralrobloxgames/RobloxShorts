# What to add next

For the proposed horror series, use the dedicated [horror asset checklist](HORROR_ASSETS.md),
based on the [2 October 2026 research](../../references/horror-research-2026-10-02.md).
It separates existing assets from new work and defines a small first-pilot kit.

Ideas for the next round of assets, ordered by how often they show up in viral Roblox Shorts and how cheaply the
existing pipeline can make them. Everything here would be built the same way as this pack: generic Roblox look,
original or Roblox-made free items, no logos and no copied game IP (no Brookhaven, Doors, Adopt Me or Pet Simulator
branding).

## Quick wins (hours, not days)

1. **HUD / UI kit (2D, for `web/lib/overlay.js`).** The screen UI is what makes a clip read as Roblox:
   - player list (top right) and bubble-chat bubbles;
   - name tags and health bars over heads;
   - mobile thumbstick and jump button;
   - "You died" / "Respawning", kick and disconnect dialogs, "Server is shutting down";
   - badge-awarded toast and purchase prompt.
   All of it would be drawn without Roblox logos.
2. **Lag and glitch gags:** a T-pose animation (arms straight out), rubber-band teleport, a frozen frame with a ping
   counter, and falling through the map into the void.
3. **More characters from the same system.** New Shirt/Pants PNGs plus free hair give new characters in minutes:
   - the "bacon hair" default look (Pal Hair plus a plain outfit);
   - a guest-style grey character;
   - a rich player in a gold suit, a hacker (hoodie and mask), a pro gamer (headset);
   - police and robber, a zombie;
   - a younger sibling built with a smaller Humanoid scale.
4. **Obby hazards:**
   - spinning kill bar, moving and disappearing platforms, bounce/jump pads;
   - wall-hop and truss towers, numbered stage signs 1-100, win portals.

## Game genres that keep trending

5. **Pets and eggs:** three egg rarities (common / rare / legendary with glow), 4-6 cute blocky pets, an egg hatch
   effect and a pet follow animation.
6. **Tycoon kit:**
   - plot floor and walls, dropper, conveyor, collector and upgrader (the dropper, conveyor and ore are already in the pack);
   - green "$100" buy buttons with a price decal, a cash counter board, a "rebirth" pad.
7. **Simulator kit:** dumbbell / sword / clicker tools, training pads, rebirth portal, zone gates with prices,
   floating "+1 Strength" numbers.
8. **Disaster survival:** meteor with a crater, flood water plane, tornado cone, lava flood, a siren and a "Survivors"
   board.
9. **Roleplay town:**
   - house pieces: walls, doors, windows, couch, bed, TV, fridge, kitchen counter;
   - a pizza shop counter, school desks, a jail cell, a bank vault;
   - a classic blocky car, go-kart and boat.

## Effects and sound

10. **Effects in the world.js style:**
    - Roblox classic explosion (blast sphere plus debris);
    - sparkles, fire and smoke;
    - teleport beam, confetti, speed trail and respawn shimmer.
11. **Original SFX (ElevenLabs):** coin pickup, button click, level-up, purchase ding, pop, whoosh, and a death sound
    in the old style (not the Roblox "oof").

## Classic gear (props for gags)

12. Speed coil, gravity coil, hoverboard, magic carpet, paintball gun, slingshot, trowel (building), superball, jetpack,
    grappling hook, boombox, ban hammer.

## Pipeline improvements

- **Pose sheet preview.** Load the authored poses into Studio as KeyframeSequences and screenshot a pose sheet, the
  same way the face sheet was made.
- **Even sharper clothing.** The character atlases are 1024 px at 128 px per stud (the clothing designs rendered at 2x).
  A 2048 px atlas (4x) would hold up in extreme close-ups, with an exception to the 1024 px limit.
- **Material textures.** Studio only writes a modern material texture (Grass, Slate, Metal...) into the OBJ after it
  has streamed it at full resolution, which needs the Studio window active. Re-running the map export with Studio in
  front would give the islands and tycoon parts their Roblox textures (Wood already came through).
