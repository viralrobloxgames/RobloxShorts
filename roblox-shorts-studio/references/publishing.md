# Publishing (after the user approves the video)

Making a video and posting it are separate steps. Post only once the user has approved this specific video; standing rule: then it goes to TikTok first and YouTube Shorts straight after, public. Saved preferences are never a standing instruction to publish an unapproved video. The default hand-off is the local `delivery/<Title>.mp4` plus copy-ready title, description and hashtags.

## Before any upload

- `delivery/<Title>.validation.json` exists and its `sha256` matches the MP4 (written by `export.py`).
- The user has watched the whole video.
- **TikTok:** longer than 60 s if it's aimed at Creator Rewards.
- Audience settings are chosen deliberately. A cartoon look does not mean the video is made for kids. Declare AI-generated / synthetic content (the voice is AI) where the platform asks.

## Automatic posting from the cloud (`scripts/publish.py`) - the default once set up

After the user approves a finished video, post it with no browser: **TikTok first, then YouTube Shorts straight after.**

```
python3 scripts/publish.py projects/<slug>              # preview: checks, shows exactly what will be posted, no network
python3 scripts/publish.py projects/<slug> --approve    # only after the user approved THIS video
python3 scripts/publish.py projects/<slug> --post       # TikTok, then YouTube   (--only tiktok|youtube, --tiktok-mode draft)
```

- `delivery/post.json` holds the metadata: `tiktok` {`caption` (at most 5 hashtags), `privacy` (`PUBLIC_TO_EVERYONE`), `ai_generated` (true: the narration is an AI voice), `allow_comments/duet/stitch`} and `youtube` {`title`, `description`, `tags`, `category_id` (`20` Gaming), `privacy`, `made_for_kids` (false), `contains_synthetic_media` (false: a cartoon; YouTube's label is for realistic content), optional `channel_id`}.
- `delivery/published.json` records the approval (tied to the MP4's sha256) and each platform's result. A platform already marked posted is skipped; one left "started" must be checked by hand before retrying, so nothing is ever double-posted.
- **Cover:** TikTok's API only takes a cover *frame*, so the TikTok copy (`<Title>_tiktok.mp4`) has the cover appended as its last 0.1 s and that frame is chosen. YouTube gets `<Title>_cover.jpg` through `thumbnails.set` (Shorts may still show a frame).
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

## TikTok / YouTube Studio (browser, fallback)

Use the user's signed-in browser. Confirm the target account or channel on screen, upload the verified MP4, fill in the prepared metadata, set audience, disclosure and visibility, then read back the resulting URL and visibility. Don't claim an upload happened if you only opened the page.

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
