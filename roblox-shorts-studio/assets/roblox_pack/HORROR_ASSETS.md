# Horror asset build checklist

Planning audit: **2 October 2026**. Priority means production dependency, not permission to spend. See [series plan](../../references/horror-series.md) and [research](../../references/horror-research-2026-10-02.md).

## Build status (first review, 2 October 2026)

A first pass of the whole kit (P0 to P2 geometry) has since been built by `tools/build_horror.py` (original procedural
geometry, motions and synthesised audio; rerun `tools/build_horror_studio.py` afterwards to augment the Studio file):
the Unlisted and UnlistedForest entities with their face set, 28 map/prop models listed in `horror/manifest.json`,
12 `horror_*` motions, 16 sound cues in `assets/audio/horror/`, `studio/AfterHours_HorrorPack.rbxmx`,
and the web helpers `web/lib/horror.js` (assets, controls, lighting presets, torch beam, panels) and `web/lib/horrorUi.js`
(server panel, warnings, rule card, CCTV, fuel bar, cover, receipt).

Review: `validate_pack.py` passes (0 errors). Every model, the entity variants, the moving parts, all 12 motions and the
night presets were rendered with `web/examples/horror_kit.js` (one check per frame, frames 1-58); sheets in
`previews/horror_*.jpg`. Fixed in the review: the door failed to load (its `clearance` entry was treated as a moving part),
and labels/panels on box fronts were mirrored (UVs). The checkboxes below stay open: they also need the contact,
clearance and portrait checks of a real episode.

Known issues to handle in the first episode that needs them:

- **Service counter shutter**: fully open, it slides up out of the frame and hangs above the counter (no housing). Frame
  the top out, or add a housing/roll-up before a shot shows it.
- **Held props follow the arm**: `attachHorrorProp` keeps the prop's rotation relative to the arm, so the takeaway bag
  sticks out sideways in `handoff`. Counter-rotate per shot.
- **Night presets are mild**: normal/warning/emergency differ mainly in sky colour and read as teal evening, not dark.
  Faces stay readable (the H07 requirement); tune per episode with practical lights.
- **Small label text**: the takeaway bag brand and fuse box warning are unreadable at phone size; use inserts for clues.
- **Entity head**: the blank off-white head is the design; the `revealed` cyan eyes are thin, so use a close-up for the reveal.

## Existing inventory: reuse before building

The current `catalog.json` records **5 characters, 32 faces per character, 12 accessories, 10 props, 36 map pieces and 51 animation entries**. Character/prop/accessory/map paths present in the catalogue were checked for existence; this was not a fresh visual or motion validation.

| Existing asset / helper | Useful for horror | Qualification |
|---|---|---|
| Max, Mia, Leo, Noob | Main cast, ordinary customers, duplicate actors | Keep Skye in news; instantiate a second actor for a copy |
| `scared`, `nervous`, `suspicious`, `confused`, `shocked`, `blink`, `evil_grin` faces | Suspense and reactions | No need to commission a whole new expression set |
| Idle, walk/run/sprint, shock, duck, point, hold, typing and other motion entries | Baseline movement | Entries are not guarantees of convincing horror acting; test actual shot contacts |
| `phone`, `tablet`, `free_coins_button` | Message screen, CCTV-style insert surface, interaction button | Add appropriate screen graphics; do not build a second phone |
| `lobby_platform`, tiles, boards, `stage_sign`, trees | Empty server, warning boards, forest background later | Trees alone are not a complete forest set |
| `web/lib/overlay.js`: `chat`, `adminTimer`, `caption`, `flash` | Dialogue, countdown, captions and restrained transition | Player count, disconnect box, rule card and CCTV layouts still need authored variants |
| `web/lib/world.js`: parts, signs, fog, emissive material, stage lights | Modular environment and night treatment | Existing lighting reference is bright obby lighting; a readable horror preset is new work |
| `web/lib/gestures.js`: `panicArms`, `waveArm`, `cheerWave` | Safe raised-arm alternatives | Avoid pack `panic`, `celebrate` and default `wave`, as current workflow documents clipping |
| George voice, narration/alignment/finish pipeline | Narrator and measured captions | Existing voice is enough for pilot; no paid new voice required |
| Click, swish and impact sounds | Selected motivated effects | Dedicated room ambience and entity motif are still missing |

## P0 — minimum kit for the first empty-server pilot

Each checkbox means the row's complete deliverable is reviewed. Sizes are rough relative effort (S: one focused asset/task; M: several coordinated pieces). They are not elapsed-time or cost promises.

| Done | ID | Asset / status | Required deliverable | Acceptance check | Size |
|---|---|---|---|---|---|
| [ ] | H01 | **The Unlisted**, ADAPT + NEW textures | Existing R6-compatible body with original blank face, charcoal/off-white palette and cyan chest mark; neutral and revealed variants; front/side/back sheet | Recognisable silhouette at phone scale; does not look like a copied game monster; all body parts rigged; no unused hair clipping | M |
| [ ] | H02 | **Empty lobby shell**, ADAPT | Reuse floor/lobby/boards; add wall, corner and doorway modules; one assembly with clear foreground/midground/background | Camera has room for two actors and the counter UI; no exposed backfaces; readable escape route | M |
| [ ] | H03 | **Hinged door and frame**, NEW | Separate door, frame and handle; closed/open/locked states; hinge pivot and real clear opening | Widest dressed actor passes with clearance; door and hands meet; door never sweeps through a body | M |
| [ ] | H04 | **Server UI**, ADAPT + NEW | One-player/two-player panels, missing-name state, join/leave messages and fictional connection warning; extend existing chat/timer drawing | Legible at 360×640; visual contradiction understood without narration; positions avoid caption and platform UI | M |
| [ ] | H05 | **Suspense motion set**, NEW authored clips | Look over shoulder, cautious backward step, freeze, listen/head tilt, delayed imitation; reuse shock and run for transitions | Root/feet do not slide unintentionally; arms clear body; imitation delay remains consistent and deliberate | M |
| [ ] | H06 | **Door interaction**, NEW staging/animation | Hand approaches handle, opens/closes door, actor crosses threshold, entity chase stop; reusable attachment marker | Contact frames reviewed before/during/after grip; actor fits; escape physically makes sense | M |
| [ ] | H07 | **Night lobby lighting**, ADAPT | Cool ambient + warm practical + entity edge light; normal/warning/emergency presets; shallow fog optional | Faces and clue readable in small low-brightness preview; no completely crushed blacks; flicker does not obscure the action | M |
| [ ] | H08 | **Horror audio starter**, NEW | Quiet room hum, footsteps, door/latch, two-note entity cue, short tension rise and reveal hit, optional sparse loop; isolated WAV stems and provenance | Speech remains clear; cues match action; no clipping; tension works without a loud jump; each cue has source/licence or synthesis recipe | M |
| [ ] | H09 | **Cover and clue layout**, ADAPT | Series cover template, short premise headline, episode marker and reusable clue framing; existing captions retained | 1080×1920 plus 3:4 centre crop reviewed; no face/text collision; clue visible with sound off | S |

## P1 — unlock the duplicate and night-shift pilots

| Done | ID | Asset / status | Required deliverable | Acceptance check | Size |
|---|---|---|---|---|---|
| [ ] | H10 | **Monitor and alternate-view insert**, ADAPT | Start with tablet or a simple monitor housing; authored screen image/video states and a CCTV overlay; separate true/copy actor IDs | Screen clue matches shot chronology; duplicate actors do not share unintended animation/expression state; fake feed labelled as story content | M |
| [ ] | H11 | **Service window kit**, NEW | Counter, serving opening, sliding shutter, rear doorway and small stockroom; assemble from H02/H03 where possible | Shutter pivot/travel correct; counter height fits R6 hands; minimum two camera angles expose inside/outside clearly | M |
| [ ] | H12 | **Rule card + shift UI**, ADAPT | Three swappable rule-card layouts, clock, one highlighted active rule; one simple original receipt design | One rule legible at a time; no wall of text; rule shown before consequence | S |
| [ ] | H13 | **Order prop + acting**, NEW/ADAPT | Generic takeaway bag or cup, desk bell; handoff, press-bell and shutter-close actions | Props stay in hands and meet counter; minimal cast variants use existing clothes/rigs | M |

## P2 — expansion after evidence from pilots

| Done | ID | Kit | Contents and dependency |
|---|---|---|---|
| [ ] | H14 | Torch and radio | Two handheld props with grip markers; torch beam on/off/weak states; radio noise and original voice treatment. Requires contact proof from H06. |
| [ ] | H15 | Corridor / house | Straight and corner hallway, window, alternate door panel, locker or closet, fuse box; reuse H02/H03. No full town. |
| [ ] | H16 | Statue challenge | H01 rigid material variant, pedestal, look-away/freeze/advance states; no new skeleton. |
| [ ] | H17 | Forest clearing | Reuse both tree types; add 2–3 silhouettes, rocks, path, small cabin and ground dressing; daylight/night presets. |
| [ ] | H18 | Campfire survival | Campfire with high/low/out states, fuel logs, safe-zone marker, fuel UI and matching crackle loop; no simulation needed. |
| [ ] | H19 | Original forest threat | Design only after a forest script needs it; reuse H01 if adequate. A quadruped needs a separate verified rig and gait. |
| [ ] | H20 | Controlled anomalies | Authored extra shadow, mismatched reflection insert, door-number swap, delayed screen feed; implement only the effect used by an episode. |
| [ ] | H21 | Expanded sound | Outdoor wind, leaf steps, radio, shutter, bell, forest movement; preserve separate ambience/action/music stems. |

Defer train sets, hospitals, school maps, many monsters, full lip-sync upgrades, physics destruction and a new rendering system. The current rig and a few well-staged anomalies are enough to judge the format.

## Technical handoff requirements

Use the conventions in this pack's `README.md` and the web loader as the source of truth: **one stud per unit, Y up, forward −Z** for these exports. The older Blender starter is **Z up, forward −Y** and has only six original expression sets. These are separate systems; do not assume this pack drops into the Blender helpers unchanged.

Every new asset needs its source/build recipe, geometry and textures, preview, catalogue record, dimensions, pivot/attachment definition and source/licence record. Use lower_snake_case IDs. Handheld props pivot at the grip; ordinary world props use bottom centre; doors and shutters explicitly declare their animation pivots. Keep face features aligned when swapping textures. Reuse the current 1024px atlas convention unless a demonstrated close-up needs more.

Proposed organisation (paths are targets, not files created yet):

- Geometry in `characters/Unlisted/`, `map/horror_*/` and `props/horror_*/`, alongside the existing pack.
- New authored motions in `animations/` with entries in its index; behaviour timing remains in the episode.
- UI in existing overlay helpers or a small horror-specific helper only when two clips actually reuse it.
- Lighting presets alongside the current lighting reference; preserve the bright-obby preset.
- Audio in `assets/audio/horror/` with provenance; project mixes remain in the episode folder.
- Preview sheets and validation records alongside the relevant assets; new render settings use fresh render directories.

Use original assets or verified reusable sources. A marketplace item being free does not establish all redistribution rights. Record permissions before bundling third-party models, music or effects. Do not copy the DOORS/Forsaken/99 Nights character roster merely because those videos performed well.

## Build order and stop condition

1. H01/H04/H07: prove the figure and impossible player count read in one still. Use existing floor and cast.
2. H02/H03/H05/H06: assemble one usable room and demonstrate the escape physically.
3. H08/H09: establish tone and packaging, then produce pilot 1 through the existing narration, preview, fit-check and encode workflow.
4. H10, then H11–H13: add only the pieces needed for pilots 2 and 3.
5. Review comparable performance and production time. Build H14–H21 only when an episode and the results justify them.

Definition of done for the starter: the first pilot can be staged with no placeholder geometry, the central clue is readable on mute, door/hand/foot contacts pass review, entity behaviour is consistent, sound is sourced and intelligible, and the cover/captions pass portrait checks. A catalogue entry alone is not completion.
