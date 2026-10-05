# The Dog Who Found The World Cup (standalone story, one part)

Mode: true story told as "grounded action" (references/story.md): open on the find itself (a dog pulls a parcel out
of a hedge and it's the World Cup), jump back a week, then each beat changes what people know (the guarded case is
empty, the ransom arrest doesn't produce the trophy, the finder becomes the suspect), a happy high (the dog at the
victory dinner), and a last beat that reframes how lucky that sniff was: the trophy was stolen again in 1983 and,
with no Pickles, never found. Third person; the owner is never named in the narration. **A true story, found through
general research, not from OddFrame's list** (user, 2026-10-05).

Shortlist after searching: Pickles and the 1966 World Cup (picked), the Great Emu War (funny, but it is soldiers
machine-gunning birds), Victor Lustig selling the Eiffel Tower (another criminal lead, straight after the Mona Lisa).
The Press Your Luck VCR story was already turned down (Lightning notes: a poor hero). Picked Pickles: a dog hero
nobody can dislike, cartoon-safe (nobody hurt), built-in comedy (the finder grilled till 2:30 a.m., the dog licking
the players' plates), a reveal the viewer can read on mute (country names on the base), and a reframing last line.
Topical: the 2026 World Cup was this summer and the 60th anniversary of 1966 is this year.

Script: `../script.txt` (160 words with the CTA, one sentence per line). Mona Lisa (160 words) measured 59.9 s of
speech, so expect ~60-62 s plus the end card. If the take runs short of 61 s with the card, put back "out" in line 1
("drags a parcel out from under a hedge"). If long, cut "One " -> "A ", then "day and night", then "clean".
Cast (as built): Max plays the owner (work jacket: he was a Thames lighterman); Pickles is the pack golden retriever cut
into parts and recoloured as a black-and-white collie (`animal_collie_parts`, tools/cut_collie.py); Skye is the guard;
Leo the football boss on the phone and the captain; the Noob the middleman; Mia the undercover officer and the
detective; recoloured Noobs are visitors, the night guard, police, the desk sergeant, players and dinner guests.
Route: web. (No hats: the pack has no flat cap, and every accessory would need a fit check.)

## The facts (kept accurate; sources below)
- Sunday 20 March 1966, four months before the 1966 World Cup in England, the Jules Rimet Trophy was stolen from a
  glass cabinet at the Stampex stamp exhibition in Methodist Central Hall, Westminster, London. Security was
  round-the-clock; the thief left stamps worth about GBP 3 million and took the cup.
- A man calling himself "Jackson" phoned Joe Mears (FA and Chelsea chairman) demanding GBP 15,000, sending the cup's
  removable top lining as proof. Police arrested Edward Betchley at the handover (an undercover officer); he said he
  was only a middleman and the trophy was not recovered. The narration says "a ransom demand arrives" and "police
  arrest a man at the handover", which hold for every account.
- Sunday 27 March 1966, seven days after the theft: David Corbett, a Thames lighterman, walking his four-year-old
  black-and-white collie Pickles in Beulah Hill, Upper Norwood, south London. Pickles sniffed out a parcel wrapped in
  newspaper and tied with string, by the wheel of a parked car at the bottom of a garden hedge (Wikipedia's two
  articles say "by the front wheel of a parked car" and "at the bottom of a suburban garden hedge"; the narration says
  "from under a hedge").
- Corbett feared it was a bomb (his own account; the IRA was active), tore the paper and saw "Brazil, West Germany,
  Uruguay" (past winners) on the base. He took it to Gipsy Hill police station (some accounts: home first, briefly).
- Police treated him as the prime suspect, questioned him until 2:30 a.m. and put him in a line-up before his alibi
  cleared him (Mental Floss and others).
- England won the World Cup that summer (30 July 1966, 4-2 v West Germany at Wembley). Pickles was invited to the
  celebration banquet and the players let him lick their plates clean (Mental Floss). He got the National Canine
  Defence League silver medal, a year's dog food and a film role (The Spy with a Cold Nose); Corbett got about GBP
  5,000 in rewards. Shown on screen only, not narrated.
- The FA secretly made a replica afterwards. Brazil won the trophy outright in 1970 (third win). On 19 December 1983
  it was stolen from the Brazilian Football Confederation in Rio (the wooden back of the bulletproof cabinet was forced
  with a crowbar); four men were convicted, the cup was never recovered and is widely believed melted down. "Seventeen
  years later" = 1966 -> 1983. The narration says "never been found", not "melted" (unproven).
- Not used: Pickles died in 1967 (choked on his lead chasing a cat). Leave it out of every surface.

## Beats
1. Hook (frame 1): a south London street at dusk; Pickles (collie) already has his head under a hedge by a parked
   car, tugging a newspaper parcel tied with string; Max (owner, flat cap, lead in one hand) leans in, faces read
   (Max 3/4 to camera, puzzled). By "Inside is the stolen World Cup", a quick tear shows a gold glint.
2. "One week earlier": a stamp-exhibition hall, glass case on a plinth with the gold cup; a banner "1966 WORLD CUP -
   ENGLAND" (generic, no FIFA marks); Mia and Skye as guards stroll past it. Cut: the same case, empty (lock open).
   Guard faces: `shock`.
3. Ransom: a candlestick phone rings in an office; a note "GBP 15,000" (on screen). A park bench handover: Noob with a
   parcel meets an undercover cop (Leo in a trench coat); cop flashes a badge; Noob shrugs, palms up ("only a
   middleman"). Empty case again with a "?" pop. HUD idea: "TROPHY: MISSING".
4. The walk: Max and Pickles walk a real path (travel at walk speed; dog trots), Pickles stops, sniffs, pulls the
   parcel. Max holds it at arm's length (bomb fear: sweat drop, wince). Tear: close-up of the base, engraved names
   "BRAZIL / WEST GERMANY / URUGUAY" appearing one by one with the narration.
5. Police station: Max sets the cup on the front desk, proud; the desk sergeant's face goes from smile to suspicion;
   Max in an interrogation room under a lamp, a wall clock spinning to 2:30; a line-up of block characters with Max
   in the middle, Pickles sitting outside the door.
6. Victory: a stadium, players (Leo, Skye, Noob in red shirts) lift the cup (one arm each, no two-arms-up poses; or the
   captain holding it at chest height with `proud`). Banquet: long table, players in suits, Pickles in a chair with a
   napkin, licking a plate; players laugh (`laugh_big`). Medal on his collar.
7. 1983: caption "1983, RIO"; a dark office, a cabinet with a glass front; the camera swings round to the wooden
   back, open, cup gone. Light, not scary: a crowbar lying on the floor, no people shown.
8. Payoff: "This time, there's no Pickles." Empty street in Rio-ish colours, a hedge, nobody sniffing; then hold on the
   empty cabinet. "It's never been found." Hold long enough to register.
9. CTA: "Follow Viral Roblox Games for more stories like this." + end card (@viralrobloxgames, FOLLOW FOR MORE),
   Pickles sitting beside the text.

## Notes
- No FIFA or Football Association logos, no real team crests; a generic gold winged-figure cup (or the pack's
  `trophy` recoloured) and plain red/white shirts. Real players aren't shown as likenesses.
- New assets: rigged collie `animal_dog` (walk/trot, sniff, sit, tug, plate-lick), newspaper parcel with string,
  glass display case, candlestick phone (Mona Lisa may have one), lamp, wall clock, banquet table and plates,
  1983 cabinet with a wooden back.
- Held props: lead (Max, one hand), parcel (Max, both hands at arm's length), trophy (Max at the desk; captain at chest
  height), badge (Leo), parcel (Noob), crowbar lies on the floor (not held). All get a hold check; the parcel in the
  dog's mouth sits at the jaw.
- No two-arms-up poses: the trophy lift is one-handed or chest height. Real walks only (Max at walk speed, the dog
  trotting alongside).
- Cover idea: Pickles under a hedge with the gold cup poking out of torn newspaper, Max's surprised face behind;
  headline "THIS DOG FOUND / THE WORLD CUP" inside y 240-1680.
- Post copy: title "A Dog Found The Stolen World Cup (True Story)"; description names Pickles, David Corbett, the 1966
  theft from Westminster Central Hall, England's win and the 1983 theft in Rio.

## Sources
- Wikipedia, Pickles (dog): https://en.wikipedia.org/wiki/Pickles_(dog)
- Wikipedia, FIFA World Cup Trophy (Jules Rimet Trophy section): https://en.wikipedia.org/wiki/FIFA_World_Cup_Trophy
- Mental Floss, The Dog Who Saved the World Cup for England: https://www.mentalfloss.com/animals/dogs/dog-who-saved-world-cup-england
- History UK, Pickles the dog: https://www.history.co.uk/articles/pickles-the-dog-world-cup
- FIFA, Pickles and the stolen World Cup: https://inside.fifa.com/news/pickles-and-the-stolen-world-cup-2771152
