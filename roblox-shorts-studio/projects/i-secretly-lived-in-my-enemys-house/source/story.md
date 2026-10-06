# I Secretly Lived In My Enemy's House For A Week: outline

First long-form YouTube video: 16:9, about 12 minutes, eleven chapters of about 65 s, multi-voice, told in the first
person by Skye. The full script is `script.txt`; the per-chapter continuity contract is `source/boundary_sheet.md`.

## Logline

Max has teased Skye since kindergarten. When he tells the whole class she's scared of everything and that his house is
so boring nothing ever happens there, Skye moves into his attic for a week to haunt him. By day they fight at school; by
night she sees the real Max: a boy who makes the "ghost" crustless sandwiches, does what the fridge tells him, and
practises asking someone to the Halloween dance. On Saturday at midnight she comes for the biggest scare of his life,
and he's waiting with a sandwich. He knew she was there from the first night.

## The concept, and what was added to it

The concept is the default one: "I Secretly Lived In My Enemy's House For A Week", told by Skye. It puts the proven
"I Secretly Lived" hook together with the rivals-who-fall-for-each-other school story. Four things were added to make
twelve minutes hold:

1. **A motive with agency.** Skye isn't hiding by accident: she's haunting Max on purpose, to prove she isn't the
   scaredy-cat he called her. Each chapter has a haunting attempt or a near miss (closet, pancake, fridge, pumpkin, sheet).
2. **School by day, house by night.** The public rivalry plays in the classroom; the private Max shows up at night.
   This gives dramatic irony: at school he tells her his house is haunted while she keeps a straight face.
3. **A twist planted from frame 0.** Max knew from Monday night: her pink hair was sticking out between his hoodies.
   Every "lucky" moment is him covering for her (the unlocked back door, the sandwiches, "nice decoration", the
   unfinished phone line). The crustless sandwich runs through the whole story and is the last line.
4. **Halloween season.** The dance, the decorations and the sheet ghost make it seasonal. It should go out before
   31 October.

A grown-up note, so the premise doesn't read as "run away and nobody minds": on Sunday Max's dad makes Skye phone her mum
before she gets any pancakes.

## Cast and voices (four voices)

| Speaker tag | Character | Rig and look | Voice | Caption colour (proposed) |
|---|---|---|---|---|
| `VO` | Skye narrating: the hook, each day change, the last line and the CTA | (no picture) | `brittney` clone | pink, italic |
| `SKYE` | Skye, 12, competitive, dramatic, funny | Skye rig: her pink hair; a school outfit replaces her news blazer | `brittney` clone | pink |
| `MAX` | Max, 12, Skye's rival, a class clown who is secretly sweet | Max rig: dark-brown hair, his teal star hoodie | designed (Qwen3-TTS VoiceDesign): a 12-13-year-old boy | teal |
| `DAD` | Max's dad: cheerful, pancake-proud, British ("football", "good lad") | Leo rig scaled ~1.12, hair tinted dark brown to match Max, cardigan | `george` (George voice C setup) | amber |
| `LILY` | Lily, 7, Max's little sister: sharp, deadpan, charges a tea party to keep a secret | Mia rig scaled ~0.78, black ponytail | designed: a 7-year-old girl | yellow |

George plays the dad rather than Max because George is a grown man's storytelling voice and Max has to sound twelve.
Silent extras: three or four classmates in the classroom (Noob and recoloured extras with pack hats and hair). Skye's mum
is only a phone call.

## Script format (read by narrate.py)

- `# CH01 | MONDAY | 9:47 PM | The Dare`: chapter header with the day, the clock time for the card, and the YouTube
  chapter title.
- `SPEAKER: text` is one spoken line. `SPEAKER (note): text` adds a delivery note that is never spoken: `whisper`, `ghost`
  (echo in the mix), `shriek`, `behind door` / `offscreen` / `offscreen, below` (muffled and quieter), `phone`.
- `[ ... ]` is an action line for the animators; it is never spoken. `[+0.8 ...]` also adds 0.8 s of silence at that
  point for the action to play.
- Every chapter is narrated and timed on its own, and the speaker is carried onto every caption word.

## The twist: where each clue is planted

| Chapter | Clue | Paid off in Ch10 by |
|---|---|---|
| 1 | Max's flashlight finds a lock of pink hair between his hoodies; "Huh. Just hoodies." | "Same as in my closet on Monday." |
| 1, 2 | The back door is never locked | "Or leaving the back door open?" |
| 2 | Skye lets slip that he hid under his blanket; "How do you know that?" | (he already knew) |
| 3 | He agrees to "be nice to Skye", flustered; leaves the "ghost" a sandwich with the crusts cut off | "Who did you think was making the sandwiches?" |
| 4 | Cobweb, pancake and cinnamon teasing; "Since this week" he cuts his crusts off | (he's teasing her on purpose) |
| 5 | Lily: "He talks about you every night at dinner" | |
| 6 | He rehearses asking "her" to the dance | "I'm asking her to the dance" |
| 7 | He straightens the pumpkin on her head: "Nice decoration. Very realistic." | "Or fixing your pumpkin?" |
| 8 | On the phone, smiling: "Skye is the worst..." and she walks away | "...the worst at hiding." |
| 9 | His kindergarten drawing, ME AND SKYE. BEST FRENDS, kept on top of the box | (why the rivalry was never real) |

## Chapters

Every chapter break is a hard cut to the new day or time with a full-width card (day plus clock time) while Skye's VO
names the day. Words are spoken words only; the estimate is explained below the table.

| Ch | Card | YouTube chapter | Where | Beats | Words | Est. s |
|---|---|---|---|---|---|---|
| 1 | MONDAY 9:47 PM | The Dare | Max's bedroom (night) / classroom at lunch / back door at dusk | Hook in the closet; the spider prank and the dare; she slips in; first haunting ("Maaax"); "Day one." | 162 | 67-74 |
| 2 | TUESDAY 6:04 AM | Twelve Pancakes | upstairs hallway / kitchen before dawn / classroom | Down from the attic; Dad's pancakes; twelve become eleven; Lily: "Ghost." At school Max is "very alert"; Skye's slip | 162 | 68-75 |
| 3 | TUESDAY 11:52 PM | A Useful Ghost | kitchen at night | BE NICE 2 SKYE on the fridge; Max agrees and leaves the ghost a crustless sandwich; Dad's midnight snack; "Who's Skye?" | 156 | 67-74 |
| 4 | WEDNESDAY 12:15 PM | Cinnamon | classroom at lunch | Max is nice; cookie, cobweb, cinnamon; crusts "since this week"; "Stop it, face." | 153 | 62-69 |
| 5 | WEDNESDAY 3:41 PM | The Tea Party | attic, afternoon | Lily finds her; the deal; Skye is the horse; "He talks about you every night at dinner" | 163 | 70-81 |
| 6 | THURSDAY 10:15 PM | The Practice | upstairs hallway at night / inside Max's room | Max rehearses asking someone to the dance; "You like him"; Dad's broom patrol; "I'm checking every single box" | 158 | 67-74 |
| 7 | FRIDAY 4:05 PM | The Pumpkin Girl | attic, afternoon | Skye poses as a Halloween decoration; Dad and the vacuum; Max sends Dad away and fixes her pumpkin | 155 | 70-79 |
| 8 | FRIDAY 9:30 PM | The Worst | upstairs hallway / attic at night | Skye brings a confession note; overhears "Skye is the worst..."; revenge plan; "Then why are you crying?" | 155 | 62-69 |
| 9 | SATURDAY 2:20 PM | The Drawing | attic, afternoon | Building the sheet ghost; the kindergarten drawing; the sandcastle; "Yes." "You're both so dumb." | 154 | 64-71 |
| 10 | SATURDAY 11:59 PM | Hungry? | Max's bedroom at midnight | The big scare; the lamp clicks on; "Hey, Skye. Hungry?"; the reveal; "Nobody!" | 168 | 68-75 |
| 11 | SUNDAY 8:30 AM | No Crusts | kitchen, morning | Breakfast like a normal person; "The pancake thief!"; phone Mum; the fridge says SAY YES; the last line; subscribe | 155 | 65-73, plus a ~12 s end screen |
| | | | | **Total** | **1,741** | **12.1-13.5 min** |

**Length.** The low estimate assumes tightened clips, 0.25 s between lines and the scripted action pauses; the high one
assumes untrimmed clips (about 0.25 s of lead-in and tail per line) and 0.35 s gaps. Paces assumed: brittney 2.9 words/s
(measured on her sample), Max 2.7, Lily 2.6, George 2.5. Short dialogue lines cost more
time per word than narration, so the real number comes from the narration. If it runs long, the levers are the gap
between lines and the action pauses, not story beats.

## Chapter 1 hook (the Mia Rants pattern, one better)

- Frame 0: narration and caption start together. The first sentence is the whole premise and the title: "I secretly
  lived in my enemy's house for a week, and he had no idea."
- The threat is already moving: Max in his pyjamas, flashlight up, walking straight at his closet. The camera is inside the
  closet, so Skye's face (3/4, hand over her mouth) and Max's face both read in the first frame.
- Close-up on Skye by 1 s; a red hand-drawn circle on her face at about 2.5 s; the door swings open at about 4 s.
- A small time stamp (MONDAY 9:47 PM) from frame 0, no title card.

## Sets (built once in the shared kit)

| Set | Chapters | Notes |
|---|---|---|
| Max's bedroom | 1, 6 (inside), 8 (inside), 10 | bed under the window, bedside lamp, louvred closet with hoodies, desk with mirror |
| Upstairs hallway | 2, 6, 8 | Max's door, Lily's door, linen closet, attic hatch with a pull-down ladder, top of the stairs |
| Attic | 5, 7, 8, 9 | round window, rafters, Skye's nest, boxes (HALLOWEEN, XMAS, MAX - OLD STUFF), skeleton, witch, rocking chair |
| Kitchen | 2, 3, 11 | fridge with Lily's magnet letters, island with stools, stove, slatted pantry, back door, stairs coming down |
| Classroom | 1, 2, 4 | desks in rows, board, windows; Skye row 2 by the window, Max row 3 diagonally behind her |
| House exterior | 1 (back door at dusk); optional establishing shots under day cards | |

## Content line

No swearing, no sexual references. Skye hides in Max's closet only in the hook; from Tuesday she lives in the attic.
Romance stays at "a crush" and "the Halloween dance". The worst insult is "scaredy-cat"; the meanest moment is a rubber
spider. Dad makes Skye ring her mum.

## Posting

YouTube only, long-form. Title = the first sentence: "I Secretly Lived In My Enemy's House For A Week". Chapters from
the eleven cards (see `source/boundary_sheet.md`). Not posted until the user approves the finished video.
