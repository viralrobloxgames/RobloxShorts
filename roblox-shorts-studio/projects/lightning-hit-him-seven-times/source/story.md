# Lightning Hit Him Seven Times (standalone story, one part)

Mode: true story told as "power with a downside" (references/story.md): one rule (lightning keeps finding him), each
beat a new place, his fixes (running out of the tower, the water can, outrunning the cloud) solve part of it and
expose the rest, and people react (nobody stands near him). Third person. **A true story, not an original premise,
and not from OddFrame:** the user asked (2026-10-05) for a good, engaging true story found through general research
rather than copying OddFrame's list. Shortlist after searching: Roy Sullivan (picked), the Press Your Luck VCR
scandal (strong, but Michael Larson later ran a $1.8M fraud, a poor hero), the 1904 Olympic marathon (needs the
strychnine and brandy cut). Picked Sullivan: a clean hero, cartoon-safe slapstick (hair on fire, eyebrows gone, a bear
stealing his fish), a running tally the HUD can count up, lightning as a Roblox-native hazard (Natural Disaster
Survival), and a world record that still stands as the payoff.

Script: `../script.txt` (155 words with the CTA, one sentence per line). It has more short sentences than Google (155
words, 62.8 s), so expect ~62-65 s. If the take runs long, cut "Then " and "own " first, then "Soon, ".
Cast: Max plays the ranger (needs a new ranger campaign hat); Leo is his boss, the chief ranger; Mia and Skye are the
people who move away from him; the bear is the pack's rigged `animal_bear`. Route: web (three.js).

## The facts (kept accurate; sources below)
- Roy C. Sullivan (1912-1983), ranger at Shenandoah National Park, Virginia, from 1936. Guinness World Records lists
  him for "most lightning strikes survived": 7, from 1942 to 1977. Two of his ranger hats with lightning-damaged
  crowns were put on show at Guinness World Exhibit Halls (shown on screen only, not narrated).
- 1 (April 1942): in a new fire lookout tower with no lightning rod; the tower was hit 7-8 times, he ran out and was
  struck a few feet away; a burn down his right leg, a hole in his shoe, a lost big toenail.
- 2 (July 1969): driving on a mountain road; the bolt hit nearby trees and came in through the open truck window;
  knocked out, eyebrows and eyelashes burned off, hair on fire; the truck rolled toward a cliff edge and stopped.
- 3 (July 1970): in his front yard; the bolt hit a power transformer and jumped to his left shoulder.
- 4 (16 April 1972): in a ranger station; hair set on fire; he couldn't fit his head under the restroom tap and used a
  wet towel. Afterwards he carried a can of water.
- 5 (7 August 1973): on patrol he saw a storm cloud, drove away fast, thought it followed him; when he felt safe he got
  out of the truck and was struck; hair on fire again, legs seared; he crawled to the truck and poured the water on his
  head.
- People avoided him in his later years. His own account: "I was walking with the Chief Ranger one day when lightning
  struck way off. The Chief said, 'I'll see you later.'" (The narration says "boss" and "flashes far away".)
- 6 (5 June 1976): ankle injured, hair burned again.
- 7 (25 June 1977): fishing at a freshwater pond; struck on the head, hair on fire, chest and stomach burned. A bear
  came to steal the trout from his line; he chased it off (Wikipedia: hit it with a tree branch; IrishCentral: jumped
  out to scare it away), "still smoking" covers both.
- "The record still stands": Guinness still lists him as the holder.
- Caveat for the notes, not the narration: the strikes were documented by the park superintendent, R. Taylor Hoskins,
  who wasn't present at them; Guinness accepted the record.
- Narration names nobody (keeps the hook fast); Roy Sullivan, Shenandoah and Guinness go in the post description.
  Staging only: the yard, the bench scene, who moves away, how the bear looks.

## Beats
1. Hook (frame 1): stormy sky over a forest clearing; a cartoon bolt hits Max in his ranger hat, white flash, his
   hat smoking; a HUD tally "STRIKES" with seven empty lightning-bolt slots; faces read (Max 3/4 to camera, `shock`
   with arms at shoulder height). Line 2: quick flashes of the places to come (tower, truck, yard, pond).
2. Strike one: a lookout tower on a hilltop; three bolts hammer its roof; Max runs down the stairs and out (real run,
   `travelTo`), a bolt hits him a few steps out; one shoe smokes, a tiny toenail pops off and spins. Tally 1.
3. Strike two: Max driving a ranger truck on a mountain road; the bolt hits a roadside tree and zig-zags in through the
   open window; flash; his eyebrows are gone (face without brows). Tally 2.
4. Strike three: front yard, Max watering flowers by a power pole; the bolt hits the transformer and jumps to his
   shoulder. Tally 3.
5. Strike four: ranger station desk; bolt, hair on fire (small cartoon flames); he tries the sink, his head won't fit
   under the tap, so he uses a wet towel. Cut to him walking out holding a red WATER can. Tally 4.
6. Strike five: Max in the truck sees a dark cloud in the mirror and floors it; the cloud follows over the road; he
   stops, steps out, looks back at a clear sky, smug; BANG; hair on fire; he tips the water can over his head. Tally 5.
7. Avoided: Max sits on a park bench; Mia and Skye shuffle to the far end, then walk away. Leo (CHIEF badge) walks the
   trail with Max; a flash far off on the horizon; Leo's bubble "I'll see you later." and he speed-walks away (real
   walk, no bubble over a face).
8. Strike six: on a trail; the bolt hits by his foot; Max hops on one leg holding the ankle (one hand). Tally 6.
9. Strike seven: Max fishing at a pond, a trout on the line; bolt, hair on fire; the bear lumbers up and grabs the
   fish; Max, still smoking, waves a branch (one arm) and the bear runs off. Tally 7.
10. Payoff: Max on the dock, hands on hips (`proud`), hair still smoking; the tally fills "7 STRIKES / 7 SURVIVED"; a
    WORLD RECORD plaque; last shot a glass case with two scorched ranger hats. Hold long enough to register.
11. CTA: "Follow Viral Roblox Games for more stories like this." + end card (@viralrobloxgames, FOLLOW FOR MORE).

## Notes
- Cartoon slapstick only: flashes, smoke and small flames, no wounds or burns on the body; nobody shown hurt badly.
- Assets: needs a ranger campaign hat (wide brim, pinched crown) added to the pack with an `ACCESSORY_FIT` rule and a
  full fit check; a "no eyebrows" face for after strike two; a lookout tower, ranger truck, power pole, station sink,
  bench, pond and dock built in the clip kit; `animal_bear` from the pack.
- Held props: water can, towel, fishing rod (two-handed), branch, steering wheel hands. All get a hold check.
- No two-arms-up poses (each strike is `shock` with arms at shoulder height); real walks and runs only; the truck's
  wheels turn with distance.
- Cover idea: Max mid-strike in his smoking ranger hat with seven bolt icons; headline "HIT BY LIGHTNING / 7 TIMES"
  inside y 240-1680.
- Post copy: title "Lightning Hit This Ranger 7 Times (True Story)"; description names Roy Sullivan, Shenandoah
  National Park and the Guinness record, plus one safety line ("When thunder roars, go indoors.").

## Sources
- Guinness World Records, Most lightning strikes survived: https://www.guinnessworldrecords.com/world-records/most-lightning-strikes-survived
- Guinness World Records news (2023): https://www.guinnessworldrecords.com/news/2023/1/incredible-story-of-man-who-survived-being-struck-by-lightning-seven-times-733932
- Wikipedia, Roy Sullivan: https://en.wikipedia.org/wiki/Roy_Sullivan
- IrishCentral (1973 cloud, water can, the bear): https://www.irishcentral.com/opinion/others/roy-sullivan-struck-lightning-seven-times
- The Weather Network (the 1977 strike): https://www.theweathernetwork.com/en/news/weather/severe/this-day-in-weather-history-june-25-1977-human-lightning
