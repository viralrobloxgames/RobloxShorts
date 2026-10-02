# Roblox horror series — working plan

Status: **researched proposal, 2 October 2026**. No series name, monster, script or production spend has been approved. The user requested research and an asset plan. See [evidence and limitations](horror-research-2026-10-02.md) and [asset checklist](../assets/roblox_pack/HORROR_ASSETS.md).

## Identity

Working name: **After Hours**. This is a creative placeholder, not a checked or cleared brand name.

Premise: Max, Mia and Leo enter ordinary Roblox-style places after everyone has left. One rule is broken before the story begins, and an unlisted player is learning how to copy them.

Tone: suspense with occasional character humour. Mia notices and tests patterns, Max acts, Leo takes the tempting shortcut. The Noob can be a witness or an unexpectedly competent helper. Skye remains the news presenter. Each episode resolves its immediate problem; a recurring clue connects the world. The viewer should not need a previous episode.

The prior research suggested comedy-horror. This plan keeps that option but does not require every scare to become a joke. Do not end every episode with “it was the Noob in a costume”; that removes the reason to fear the next encounter.

## Entity: The Unlisted (proposed)

An original standard-R6 figure with an off-white blank head, charcoal body and one cyan square in the chest. It has no hair or clothing logos. Its identifying cue is a delayed head turn and a two-note connection sound. Keep the ordinary silhouette initially; a rigid existing body makes controlled uncanny movement inexpensive.

Rule bible for the pilot batch:

- It is absent from the player list. Its presence never changes the displayed count.
- It copies an observed avatar, expression or action with a short delay. The delay is the clue, not a universal invulnerability rule.
- Its reflection or screen image can betray the copy. Use deliberately authored alternate images rather than promising a new real-time reflection system.
- It cannot predict a new choice before seeing it. The cast can test this; victories should come from a decision, not luck.
- Do not add a new power solely to undo the ending. Any exception needs a clue earlier in that episode and an entry in the continuity notes.

These are new creative proposals, not Roblox lore or an existing game mechanic.

## First three pilots

| Pilot | Opening image and line | Escalation and earned payoff | Minimum assets |
|---|---|---|---|
| **There Are Two of Us. The Server Says One.** | Max faces another avatar; the panel visibly reads one player. “That player wasn't on the list.” | The stranger repeats Max's last movement. Max tests it with an abrupt new turn, confirms the delay, lures it past a closing door and escapes. On the other side, his name briefly appears twice: the immediate escape succeeds, but the mystery remains. | H01–H09 below: entity, lobby dressing, door, UI, motion, lighting, audio, cover |
| **One of These Players Is Copying Me** | Two identical Leos approach Mia from opposite sides. | Mia gives each an unexpected action to perform. The copy follows a beat late; she directs it into the same lockable side room. Genuine Leo complains she suspected him first. The wall monitor still shows a third silhouette. | Reuse pilot 1; H10 monitor and duplicate-state setup; no new body rig |
| **The Customer Is Already Inside** | Customer stands at the service window while the monitor shows the same figure behind the counter. | Max spots a delayed movement on one feed. A visible rule says to close the window when a customer appears on both sides. Leo tries to finish the order anyway; Mia shuts the shutter, and the figure outside disappears. The locked stockroom then makes the connection sound. | H11–H13 service counter/shutter, rule card, simple food prop; reuse entity, monitor and sound |

All three premises are independent drafts. Final scripts must resolve the physical staging and establish any rule before its payoff. Do not reuse the same escape shot or near-identical narration across the pilots.

## Additional ideas after the pilot batch

| Idea | Distinct story engine | Incremental kit |
|---|---|---|
| The Statue Moved While I Was AFK | Leo uses his screen recording to discover a false “safe” pose; he must change position before the timer ends | Pedestal, statue material variant, look-away and stop-motion action |
| Never Answer Your Own Voice | A radio repeats instructions in Max's voice; Mia asks an unpredictable question to identify the real Max | Handheld radio, original processed voice cue, corridor dressing |
| The Campfire Has Two Shadows | Four campers cast five shadows; the extra one advances as fuel runs down | Forest clearing, campfire states, logs, torch, controlled extra shadow |
| The Door Number Changed | Returning to the exit changes the room number; the direction sign is the only object that does not reset | Modular corridor, numbered panels, reset transition |
| The Camera Shows Tomorrow | A monitor predicts an action until Mia deliberately breaks the sequence | Monitor insert system, countdown; story rule needs its own continuity review |
| The Last Train Has No Driver | An empty carriage arrives with the cast already sitting inside | Platform and carriage; defer because it adds a whole environment |

## Episode construction

Target 65–75 seconds for the initial channel experiment; set final cuts using measured narration timings.

| Approximate time | Job |
|---|---|
| 0–2 s | Visible contradiction already on screen; one short premise line |
| 2–10 s | Establish the normal behaviour or survival rule through an action |
| 10–25 s | First anomaly, character tests it, apparent explanation fails |
| 25–43 s | Escalation; audience can now identify the clue |
| 43–58 s | Character makes a choice; threat has a visible consequence |
| 58–68 s | Complete payoff, then an optional recurring clue |
| Final ~2 s | Existing channel CTA after the payoff; no promise of a part that is not planned |

The current workflow's 2–3-second cuts and 3–5-second payoffs are useful pacing references, not a reason to cut away before a clue can register. Allow a held shot when something changes within it. Show exactly one important clue at a time. Avoid introductory title cards, long rule lists, full black frames as filler and a scream every few seconds.

## Visual and sound direction

Use cool ambient light with a warm practical light near faces. Give the entity a readable outline and a visual signature independent of darkness. Keep Roblox block proportions and materials; inspect darkness on a phone-sized preview. Save bright, warning and emergency variants of the same set. Small, predictable light changes beat expensive volumetric effects for the first pack.

Use three layers: quiet ambience, sounds caused by the action, and a short entity motif. Allow silence before a reveal. Keep narration intelligible, with fear coming from wording and pauses rather than excessive voice effects. Reuse local George narration; do not generate a voice in the research phase. Use original/synthesised or properly licensed horror audio, and record provenance. The existing playful music bed does not establish this tone.

Cover: 1080×1920, one face, one unmistakable anomaly, three to five words such as **SERVER SAYS ONE**. Put essential text and faces within the existing y=240–1680 grid-safe band. Use a small consistent episode marker, with the actual premise as the headline. Label descriptions as original animated fiction rather than presenting invented error messages as a real Roblox warning.

## Production route and definition of ready

Prefer the current **web R6 pack** for these pilots. The installed general skill describes an older Blender starter, while this repository also contains a richer Studio-exported R6 library used by the web route. Do not mix their axes, facial systems or rig assumptions. Check the asset checklist for this distinction.

First deliverable for a future build: the entity's design sheet, one lit lobby/door test, a phone-sized UI mock-up and a short animation/contact proof. Then draft the first script, obtain the workflow's script approval and produce measured narration. New accessories still use the fit-check process. A Blender/farm production must follow the existing no-local-Blender-render rule and per-short farm budget requirement.

Ready to start pilot production when H01–H09 have passed their acceptance checks; H10–H13 are needed only for the later pilots. Three scripts do not justify three sets of duplicate assets. No full forest map, custom deforming creature or new rendering engine is required for pilot 1.

## Continuity and results

| Episode | State | Canon established | Results |
|---|---|---|---|
| Part 1: **The Server Says One** (`projects/the-server-says-one`) | Re-cut with an open ending, 2026-10-02 | The Unlisted is the observed player's mirror image, 0.5 s late; each copy creeps it closer; it can only copy what it has seen (freezes when Max leaves its sight). Escape: fake left, cut right, slam the EXIT door; it hits the door. Open ending: the list reads two players (Max, Max); lights out; two identical Maxes side by side, no longer late. CTA: "Which Max is real? Left or right? Comment below" + follow for part 2. **Secret canon for part 2: the real Max is on the LEFT; the copy is a mirror image, so its hoodie star is on the wrong side (the rewatch clue).** | Not posted yet |
| Duplicate player | Proposed | None yet | Not produced |
| Night shift | Proposed | None yet | Not produced |

After production, record the exact rule, clue, escape, unresolved question and reused assets here. Evaluate pilots with the same-age metrics in the research report. Successful pilots can become an ongoing series; no multi-part cliffhanger is required to begin testing.
