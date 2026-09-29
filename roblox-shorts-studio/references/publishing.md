# Publishing (only on request)

Making a video and posting it are separate steps. Upload only when the user asks for this specific video, with the destination (TikTok / YouTube channel) and visibility named. Saved preferences are never a standing instruction to publish. The default hand-off is the local `delivery/<Title>.mp4` plus copy-ready title, description and hashtags.

## Before any upload

- `delivery/<Title>.validation.json` exists and its `sha256` matches the MP4 (written by `export.py`).
- The user has watched the whole video.
- **TikTok:** longer than 60 s if it's aimed at Creator Rewards.
- Audience settings are chosen deliberately. A cartoon look does not mean the video is made for kids. Declare AI-generated / synthetic content (the voice is AI) where the platform asks.

## TikTok / YouTube Studio (browser)

Use the user's signed-in browser. Confirm the target account or channel on screen, upload the verified MP4, fill in the prepared metadata, set audience, disclosure and visibility, then read back the resulting URL and visibility. Don't claim an upload happened if you only opened the page.

## YouTube API (`scripts/youtube_upload.py`)

1. One-time setup: create a Google Cloud project with YouTube Data API v3 and a **Desktop app** OAuth client, and keep its JSON outside this repo. Then:

   ```
   pip install -r scripts/requirements-youtube.txt
   python scripts/youtube_upload.py --connect --client <oauth.json>
   ```

   The token goes to the OS keyring (service `roblox-shorts-studio`).
2. Write `upload.json` with these fields: `title`, `description`, `tags`, `channel_id`, `privacy`, `made_for_kids`, `contains_synthetic_media`, and optionally `category_id`.
3. Preview with no network call: `python scripts/youtube_upload.py --file delivery/<Title>.mp4 --metadata upload.json`.
4. Only once the upload is authorized, run the same command with `--execute`. It verifies the hash and the channel, uploads once, and records the URL and the privacy YouTube actually returned. Unverified API projects may force uploads to private.
