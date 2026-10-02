# Publishing (after the user approves the video)

Making a video and posting it are separate steps. Post only once the user has approved this specific video; standing rule: then it goes to TikTok first and YouTube Shorts straight after, public. Saved preferences are never a standing instruction to publish an unapproved video. The default hand-off is the local `delivery/<Title>.mp4` plus copy-ready title, description and hashtags.

## Before any upload

- `delivery/<Title>.validation.json` exists and its `sha256` matches the MP4 (written by `export.py`).
- The user has watched the whole video.
- **TikTok:** longer than 60 s if it's aimed at Creator Rewards.
- Audience settings are chosen deliberately. A cartoon look does not mean the video is made for kids. Declare AI-generated / synthetic content (the voice is AI) where the platform asks.

## TikTok caption rule (every video)

Keep `post.json` tiktok.caption **short**:
- one hook line and one question to drive comments;
- 4-6 hashtags;
- a one-line source at the end, e.g. `Source: Roblox RDC 2026`.

Aim for about 150 characters at most. Don't write a paragraph summarising the video, and don't add a "Follow @..." line (the video says it).

The full explainer and source links go in the YouTube description only. The user said the 368-character News #1 caption was "WAY too long for tiktok" (2026-10-02).

## Cover spec (every video)

- `delivery/<Title>_cover.jpg` (+ `.png`): **1080x1920 (9:16)**, JPG under 2 MB (YouTube's thumbnail limit), sRGB.
- **Everything that must be read sits inside y 290..1560 and x 60..1020**: the headline, part/episode badges and the
  main faces. TikTok's profile grid shows only the middle 3:4 (1080x1440, y 240..1680) and the TikTok/Shorts feed
  covers the bottom ~300 px with UI. Above y 290 and below y 1560 is background only. (Max Got Admin Part 2's first
  cover put the headline at y 60..450 and TikTok cut it off.)
- Before delivering, check the crop, `ffmpeg -i <cover>.png -vf crop=1080:1440:0:240 grid.png`, and look at it: the
  whole headline has to read in that crop.
- **The cover has to be a frame of the uploaded video.** The YouTube Shorts shelf (channel page, Shorts feed) ignores
  an uploaded thumbnail and shows the frame chosen under Thumbnail → *Select from video*. Max Got Admin Part 2 had the
  cover uploaded, but the shelf showed a random mid-video frame. So upload `delivery/<Title>_upload.mp4`, the approved
  MP4 with the cover added as its last 0.1 s (`publish.py` builds it; by hand, run the ffmpeg command below), and pick
  that last frame as the cover on both platforms. Also upload the JPG as the YouTube thumbnail for search/watch pages.

  ```
  ffmpeg -i <Title>.mp4 -loop 1 -framerate 30 -t 0.1 -i <Title>_cover.jpg -f lavfi -t 0.1 -i anullsrc=r=48000:cl=stereo -filter_complex "[0:v]fps=30,format=yuv420p,setsar=1[v0];[1:v]scale=1080:1920,fps=30,format=yuv420p,setsar=1[v1];[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[v0][a0][v1][2:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart <Title>_upload.mp4
  ```

## Automatic posting from the cloud (`scripts/publish.py`) - once the platform reviews pass

After the user approves a finished video, post it with no browser: **TikTok first, then YouTube Shorts straight after.**

```
python3 scripts/publish.py projects/<slug>              # preview: checks, shows exactly what will be posted, no network
python3 scripts/publish.py projects/<slug> --approve    # only after the user approved THIS video
python3 scripts/publish.py projects/<slug> --post       # TikTok, then YouTube   (--only tiktok|youtube, --tiktok-mode draft)
```

- `delivery/post.json` holds the metadata: `tiktok` {`caption` (at most 5 hashtags), `privacy` (`PUBLIC_TO_EVERYONE`), `ai_generated` (true: the narration is an AI voice), `allow_comments/duet/stitch`} and `youtube` {`title`, `description`, `tags`, `category_id` (`20` Gaming), `privacy`, `made_for_kids` (false), `contains_synthetic_media` (false: a cartoon; YouTube's label is for realistic content), optional `channel_id`}.
- `delivery/published.json` records the approval (tied to the MP4's sha256) and each platform's result. A platform already marked posted is skipped; one left "started" must be checked by hand before retrying, so nothing is ever double-posted.
- **Cover:** both platforms get `<Title>_upload.mp4` (cover appended as the last 0.1 s). TikTok's API picks that frame; YouTube also gets `<Title>_cover.jpg` through `thumbnails.set`, but the Shorts shelf frame can't be set through the API, so set it to the last frame in Studio (Thumbnail → Select from video) after the post.
- **Credentials** are environment variables in the cloud environment's settings, never files or chat: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REFRESH_TOKEN`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`. Network access must allow `open.tiktokapis.com`, `oauth2.googleapis.com` and `www.googleapis.com`.

### One-time setup

**YouTube**
1. Google Cloud console: new project, enable **YouTube Data API v3**, OAuth consent screen (External, add the channel's Google account as a test user, then **Publish app** so the login doesn't expire after 7 days), create an OAuth client of type **Web application** with `https://developers.google.com/oauthplayground` as a redirect URI.
2. OAuth Playground (cog: "Use your own OAuth credentials", paste the client ID/secret there): authorize `https://www.googleapis.com/auth/youtube.upload` and `https://www.googleapis.com/auth/youtube.readonly` with the channel's account, exchange the code, and copy the refresh token straight into the environment variable `YOUTUBE_REFRESH_TOKEN` (client ID/secret into the other two).
3. Until the Google project passes YouTube's API audit (form: "YouTube API Services - Audit and Quota Extension"), uploads from it are forced to **private**; publish.py reports the visibility YouTube returned. Apply once; it's free.

**TikTok**
1. developers.tiktok.com: create an app, add **Login Kit** and **Content Posting API** (enable Direct Post), scopes `user.info.basic`, `video.upload`, `video.publish`. It needs a terms and privacy page URL.
2. Log in once with the channel's TikTok account to get the refresh token (valid 365 days) into `TIKTOK_REFRESH_TOKEN`, with the app's key and secret in the other two.
3. Until TikTok audits the app, direct posts can only be private. Use `--tiktok-mode draft` meanwhile: the video lands in the TikTok app's inbox with the caption ready to finish in a couple of taps. Apply for the audit; after approval, direct mode posts publicly by itself.

## Posting through the user's browser (current default)

The API route below needs developer apps that both platforms keep private-only until they pass a review, so for now
approved videos are posted from a Claude session **on the user's computer** (Claude Desktop with the built-in browser,
Claude in Chrome or computer use), in the browser where TikTok and YouTube are already signed in. A cloud session
can't reach that browser.

1. `git pull` the repo so the approved `delivery/<Title>.mp4`, `<Title>_cover.jpg` and `post.json` are on disk. Check
   the cover against the cover spec above, then build `<Title>_upload.mp4` (ffmpeg command above) and check that its
   last frame is the cover.
2. **TikTok first** (tiktok.com/tiktokstudio/upload): confirm the account is @viralrobloxgames, upload `_upload.mp4`, paste
   `post.json` tiktok.caption, set the cover (Edit cover → upload the cover image if offered, else pick the frame the
   cover is based on; once posted, TikTok only allows a frame pick, so get the cover right first), leave the
   AI-generated content label **off** (the user's call, 2026-10-01), visibility Everyone, comments/duet/stitch on. Post.
3. **YouTube Shorts straight after** (studio.youtube.com → Create → Upload): confirm the channel, upload the same _upload.mp4,
   title / description / tags from `post.json`, "No, it's not made for kids", altered content: No, visibility Public.
   **Thumbnail:** *Select from video* → drag to the very end and choose the cover frame (this is what the Shorts shelf
   shows), and also *Upload file* → `<Title>_cover.jpg`. Publish, then open the channel's Shorts tab and check the
   tile shows the cover; if it shows another frame, fix it under *Select from video* in the video's details.
4. Read back both links and visibility, write them into `delivery/published.json`, set the ledger status to `posted`.
   Never claim a post happened if you only opened the page.

## YouTube API from a laptop (`scripts/youtube_upload.py`, older alternative)

1. One-time setup: create a Google Cloud project with YouTube Data API v3 and a **Desktop app** OAuth client, and keep its JSON outside this repo. Then:

   ```
   pip install -r scripts/requirements-youtube.txt
   python scripts/youtube_upload.py --connect --client <oauth.json>
   ```

   The token goes to the OS keyring (service `roblox-shorts-studio`).
2. Write `upload.json` with these fields: `title`, `description`, `tags`, `channel_id`, `privacy`, `made_for_kids`, `contains_synthetic_media`, and optionally `category_id`.
3. Preview with no network call: `python scripts/youtube_upload.py --file delivery/<Title>.mp4 --metadata upload.json`.
4. Only once the upload is authorized, run the same command with `--execute`. It verifies the hash and the channel, uploads once, and records the URL and the privacy YouTube actually returned. Unverified API projects may force uploads to private.
