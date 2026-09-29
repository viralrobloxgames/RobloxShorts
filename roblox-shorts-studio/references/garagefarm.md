# Rendering on GarageFarm

All picture rendering happens here. The laptop only builds the `.blend` and encodes the final PNGs. Use the user's existing GarageFarm account in their signed-in **Brave** browser. Never enter credentials or payment details, and never top up credit.

## Budget

- Ask for a cap for each new short before its first job, covering tests and the full render. Record it in `source/garagefarm_job.json` and don't ask again within it.
- Reference costs (EEVEE, 1080 × 1920, Low priority):

  | Short | Frames | Tests | Full render |
  |---|---|---|---|
  | The Free Coin Trap | 651 | – | **$2.76** total |
  | The AFK Champion | 1,935 | 3 test runs, $0.24 | estimate $3.97, cap $8 |

- An estimate is not a cap. Watch the spend while the job runs.

## Upload

1. Build `<Title>_GarageFarm.blend` (packed, baked, no auto-run).
2. In the web app, open **Files**, create a folder `<Title>_GarageFarm`, and upload the `.blend` to `/<Title>_GarageFarm/data/`. If you re-upload a changed scene, give it a version suffix (`_gv004`) so jobs stay traceable. Record the farm path in `garagefarm_job.json`.
3. Before submitting, check **Jobs** for an existing job for this scene. Never submit a duplicate.

## Job settings

| Setting | Value |
|---|---|
| Version | **5.2.1_x64** (the uploader defaults to 5.3 alpha, so check this every time) |
| Output | PNG, 1080 × 1920 |
| Engine | EEVEE (24 samples was used for AFK) |
| Priority | Low |
| Frames per execution | 5 |
| Video option | **Off** (the local finish step adds voice and captions) |
| Test job | On, e.g. `1to651s50` (every 50th frame) |

## Test, then full render

1. Run the test job. Compare its frames with `farm_manifest.json` test frames. Check faces, text legibility, hand/button contact, props, framing of the hook, and the ending.
2. Fix the scene locally if needed, re-upload with a new version, and test again. On AFK, test 1 found a flat wave and a side-on hook; tests 2 and 3 drove the fixes.
3. If the test is good and the estimate fits the cap, use the test job's **Render full range** (`1to<END>s1`). Completed test frames are reused.

## Download

Use the official **renderBeamer** desktop app (sign in to the same account), or the site's ZIP download. Go to **Download / Jobs**, pick the job, and download its `-Renders` output. Put all PNGs directly into `projects/<slug>/renders/farm/`, keeping the frame number at the end of each name (`The_AFK_Champion_GarageFarm0001.png`). Don't use preview thumbnails. `finish.py --encode` refuses gaps and duplicates.
