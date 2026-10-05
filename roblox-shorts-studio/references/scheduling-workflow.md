# Scheduling a post ("schedule the next post")

When the user says something like **schedule the next post**:

1. **Ask which video** (one question). Offer the ones that are approved for posting and not yet posted (`delivery/published.json` has an approval and no platform result), and the slot: A 19:00 or B 22:30 UK ([posting-schedule.md](posting-schedule.md); weekends A is 17:00). Naming the video and slot is the go-ahead to schedule it on both platforms; don't ask again.
2. Run the steps below. The user clicks nothing. Target: 6 to 8 minutes for both platforms.
3. Record it, push, and report both scheduled times and anything that differs from `post.json`.

Only an approved video is ever scheduled: `published.json`'s `sha256` must match the MP4. If it doesn't, stop and say so.

## Before the browser

- Get `delivery/<Title>.mp4` and `delivery/post.json` on disk from `main` (`git show origin/main:<path> > <path>` works when the checkout is on another branch) and check `sha256sum` against `published.json`.
- The MP4 already ends with the cover (last 0.5 s), so the cover on both platforms is **the last frame**. No image upload.
- TikTok: AI-generated label **off** (the user's standing choice, whatever `post.json` says). YouTube: not made for kids, altered content No, category Gaming.

## Opening a file picker with no user click

The browser is Brave, driven with Claude in Chrome. The extension's `file_upload` only takes files under 10 MB and its clicks don't open the native dialog, so use a real mouse click:

1. In the tab: `document.title = 'CLAUDE-UPLOAD-TAB'` (any unique marker).
2. `scripts/browser_focus_tab.ps1 -Title CLAUDE-UPLOAD-TAB` brings that tab to the front (UI Automation; the extension works in background tabs, which a real click would miss).
3. **After** the tab is in front, read the button's centre and `innerHeight` with `getBoundingClientRect()`. (Measured in a background tab the numbers are wrong: 0,0 on YouTube, and a 557 px viewport instead of 501.)
4. Screen position, with Brave maximised on the 1280x720 logical screen (window rect -7,-7,1288,680): `X = x`, `Y = y + (680 - 7 - innerHeight)`; that is `y + 172` when the "Claude is active" bar is showing. Ignore `window.screenX/outerHeight`; the extension overrides them.
5. `scripts/browser_pick_file.ps1 -X <X> -Y <Y> -Path <full path to the MP4>` clicks and fills the dialog. It prints `Dialog: <site> wants to open` then `OK`.

Buttons: TikTok `button` with text "Select videos" on `tiktok.com/tiktokstudio/upload`; YouTube `#select-files-button` on `studio.youtube.com/channel/<id>/videos/upload?d=ud`.

## Order (saves the waiting time)

1. **TikTok tab:** upload, caption, cover, schedule time, settings, Schedule.
2. **YouTube tab:** upload, details, cover frame (about a minute's wait for the frames), Visibility → Schedule.

**TikTok's "Content check lite"** (Checks, at the bottom) starts on upload and was still "in progress" after 13 minutes on 2026-10-05. While it runs, pressing Schedule opens "Continue to post?" with a **Post now** button; cancel that. Switch the Content check lite toggle off, then press Schedule: it schedules at once, the list shows a clock with the time, and the toast says "Video published" (it means scheduled). Tell the user the check was skipped.

First run (2026-10-05, Every Lie Comes True): 17 minutes, 8 of them waiting on that check and a few on working out the steps above. Without those it is about 6 to 8 minutes.

## TikTok details

- **Caption:** click the description, `ctrl+a`, Delete, type line 1, Enter, then each hashtag followed by a space (a 1 s pause between them lets the suggestion list settle).
- **Cover:** "Edit cover" on the thumbnail. The frame strip sits below the visible area and the modal doesn't scroll, so move it with events on the canvas, then click Save with JS (it is off-screen too):

  ```js
  const c=document.querySelector('[class*=FramePicker__canvas]:not([class*=Container])'),r=c.getBoundingClientRect(),y=r.y+r.height/2,x=r.right-2,sx=r.x+10;
  const o={bubbles:true,cancelable:true,clientY:y,button:0,pointerId:1,pointerType:'mouse',isPrimary:true,view:window};
  for(const [t,xx] of [['pointerdown',sx],['mousedown',sx],['pointermove',(sx+x)/2],['mousemove',(sx+x)/2],['pointermove',x],['mousemove',x],['pointerup',x],['mouseup',x],['click',x]]){const C=t.startsWith('pointer')?PointerEvent:MouseEvent;((t.includes('down')||t==='click')?c:document).dispatchEvent(new C(t,{...o,clientX:xx,buttons:t.includes('up')||t==='click'?0:1}))}
  ```

  Wait 3 s and take a screenshot: the preview must show the cover before saving.
- **Schedule:** Settings → When to post → Schedule (the date defaults to today). Open the time box; for the hour and then the minute, scroll the option into view with JS and click it for real:
  `[...document.querySelectorAll('.tiktok-timepicker-left')].find(e=>e.innerText.trim()==='19').scrollIntoView({block:'center'})` (`-right` for minutes), then click the coordinates it reports. Click a blank area to close.
- "Show more": AI-generated content off, Comment on, Content check lite off. Screenshot to confirm, read the time and date boxes back, then Schedule.

## YouTube details

- The upload saves as a private draft straight away. Title: click, `ctrl+a`, type. Description: click and type (no `ctrl+a` in the empty box; it leaves a stray "a"). Read both back.
- With JS: click `tp-yt-paper-radio-button[name=VIDEO_MADE_FOR_KIDS_NOT_MFK]`, `#toggle-button` (Show more), `tp-yt-paper-radio-button[name=VIDEO_HAS_ALTERED_CONTENT_NO]`; read `#category` (should say Gaming). Tags: click the Tags box and type them comma-separated with a trailing comma.
- **Cover before scheduling, always:** Thumbnail → "Select from video". It shows three grey "Auto-generating" tiles for about a minute; leave it open and re-screenshot. On 2026-10-05 the third tile was the cover frame (the held last 0.5 s); click it, Done, and check the thumbnail box shows the cover. If none of the three is the cover, wait for the scrubber and pick the last frame.
- Next x3 to Visibility → expand Schedule. The date defaults to **tomorrow**: open the date button, take a screenshot, click the day (the calendar can open scrolled to another month; typing a date into it doesn't work), and read the button back. Then click the time box, `ctrl+a`, type `19:00`, Enter. Time zone is local (UK) by default. Screenshot the date and time before pressing Schedule. YouTube confirms with "Video scheduled ... public on <date> at <time>" and the Short's link.

## Afterwards

- Check TikTok Studio's post list and YouTube's content list show the video as scheduled for the right time.
- Write the times into `delivery/published.json`, set the ledger status to `scheduled`, re-run `scripts/post_md.py`, commit and push.
- Close the tabs you opened.
