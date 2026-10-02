# Posting schedule (2 a day)

Plan from the analytics review on 2026-10-02, revised the same day to optimise for **TikTok Creator Rewards**, not raw views. The goal is views from high-paying countries (US first, then UK, Canada, Australia, Germany and the rest of Western Europe), not the Philippines. All times are UK time (BST until 25 Oct, then GMT; keep the same wall-clock times after the change). The data is at the bottom; re-check it after two weeks.

## The daily slots

| Slot | UK time | US time | What |
|---|---|---|---|
| A | **19:00** | 14:00 ET / 11:00 PT | ViralRoblox News (or the strongest 60 s+ video of the day) |
| B | **22:30** | 17:30 ET / 14:30 PT | Story Short (Leo/Max/Mia/Noob) |

- **Why these times:** TikTok tests a new video on whoever is online when it's posted, so the posting time decides which country gets the first push.
  - 19:00 to 24:00 UK is the US afternoon and after-school window, UK evening prime time, and 02:00 to 07:00 in the Philippines (asleep).
  - Posts in the 18:00 to 21:00 UK window had the highest US share (27%) and the lowest Philippines share (10%) of any window.
  - Two of the five biggest earners went out in this window: Thu 22:15 (£24.21, 46% US) and the 22:35 Admin Part 1 (45% UK, the best payout per view of the recent posts).
- **Weekends:** move slot A to **17:00** (noon ET). On Saturday and Sunday, US kids are awake from the UK afternoon onwards, and two of the top earners were weekend posts.
- **Never post 11:00 to 16:00 UK on weekdays.** That's the Philippines evening (the follower peak at 12:00 to 15:00 UK is mostly Philippine followers). Posts made 12:00 to 15:00 got only 10% US viewers and 25% Philippines, and earned £0 in total.
- **Same video, same time, both platforms.** YouTube isn't monetised yet (it needs YPP), but its Shorts pay most for US viewers too, and Admin Parts 2 and 3 took off on YouTube at 17:57 and 00:22, so these slots suit it.
- **Every rewards video must be over 60 s** (aim for 65 s or more). Videos under 1 minute earn nothing.
- **Keep posts at least 3.5 hours apart, and post one series part per day.**

## What actually earns

Creator Rewards to date: **£184.92** from 134 videos over a minute long; 31 of them earned anything.

- **Five "Roblox news / drama" videos earned £174.48 (94%)**:

  | Video | Posted | Earned | Views | US / Philippines |
  |---|---|---|---|---|
  | Scariest Roblox error code | Fri 27 Mar 15:30 | £74.89 | 1.23M | 21% / 23% |
  | Everyone DELETING Roblox | Sat 13 Jun 10:48 | £34.93 | 565K | 26% / 8% |
  | What if Roblox did THIS | Sun 31 May 09:30 | £31.02 | 1.39M | 14% / 21% |
  | All the BAD Roblox updates | Thu 21 May 22:15 | £24.21 | 353K | 46% / 18% |
  | Roblox DELETED forever | Fri 17 Apr 09:10 | £9.43 | 92K | 48% / 9% |

  The story Shorts have earned £0.50 so far. **News is the money format**, so it gets the better slot, and fixing its first 2 seconds is the priority.
- **Payout per 1,000 views ranges about 7x** between videos: from about £0.015 when around 40% of viewers are in the Philippines to about £0.10 when around 48% are in the US. Across the earning videos, Philippines share correlates with payout per view at −0.53. 1.39M views at 14% US earned less than 565K views at 26% US.
- **Recent posts reach Europe, not the US.** The admin series went 0 to 6% US. Its viewers were mostly UK, Germany, Poland and Romania, because every post went out in UK daytime or around midnight UK.
- **Content still matters most.** To pull in US viewers, use US topics and spelling (US games, US creators, "color" not "colour"). For news, Skye's American-sounding Brittney voice suits this; George is British.

## Scheduling

Approve the day's two videos in the morning, then use each platform's own scheduler:

- **TikTok:** TikTok Studio upload → "Schedule" (up to 10 days ahead on web).
- **YouTube:** Studio upload → Visibility → "Schedule", set the same time.

Nothing is posted or scheduled without the user's OK on that video (see publishing.md).

## Review rule

After 7 days, log each TikTok video's **est. rewards, views, and US / UK / Philippines viewer share**, with slot and format; most rewards come in the first week. After 14 days, compare the slots on **£ per 1,000 views and US share**, not on views. If a slot keeps getting under 20% US share, move it 1 to 2 hours later.

How to get the data: in a TikTok Studio tab, replay `/aweme/v2/data/insight/` with `video_rewards_data` (`total.amount`) and `video_viewer_location_percent_realtime` for each `aweme_id`, and replay `/tiktok/creator/manage/item_list/v1/` for the post list. Results returned from the page are capped at about 1,000 characters, so add the numbers up in the page before returning them.

## Data behind it (pulled 2026-10-02)

**TikTok videos over 60 s with at least 2K views, by UK posting time:**

| UK time | Posts | Median US | Median tier-1* | Median Philippines | Rewards earned | Median views |
|---|---|---|---|---|---|---|
| 00-03 | 7 | 12% | 33% | 8% | £0 | 8.8K |
| 03-09 | 5 | 15% | 25% | 22% | £1 | 3.2K |
| 09-12 | 31 | 19% | 32% | 18% | £77 | 15.9K |
| 12-15 | 3 | 10% | 21% | 25% | £0 | 8.7K |
| 15-18 | 19 | 16% | 33% | 23% | £78 | 12.0K |
| **18-21** | 7 | **27%** | **55%** | **10%** | £0 | 3.4K |
| 21-24 | 15 | 11% | 42% | 18% | £28 | 6.2K |

\*Tier-1 = US, GB, CA, AU, DE, NZ, IE, NL, the Nordics, CH, FR, BE and AT. The 09-12 and 15-18 money totals each come from one or two viral hits, so they say more about those videos than about the time. Few posts went out after 18:00, so the evening slots are a bet on the audience mix to test over the next two weeks.

**Follower base:** 25K followers: Philippines 17%, US 13%, UK 6%. Follower activity peaks 12:00 to 15:00 UK, which is the Philippines evening, so that peak is the audience we're avoiding.

**All-views view (first pass, all 687 posts):** posts at 16:00 to 18:00 got 1.17x the account's usual views and 12:00 to 14:00 got 1.10x; 00:00 to 02:00 got 0.62x and 20:00 to 22:00 got 0.75x. Evening posts get fewer raw views, but those views pay up to 7x more.

**Recent posts (2 to 40 hours old):**

| Video | TikTok posted | TikTok views | Avg watch | Top countries | YouTube views |
|---|---|---|---|---|---|
| Admin P1 | Wed 22:35 | 6,211 (£0.50) | 33.5 s | UK 45, DE 11, PL 7 | 51 |
| 1M coins noob | Thu 11:35 | 1,546 | 22.6 s | RO 11, UK 9, DE 7 | 40 |
| Admin P2 | Thu 17:43 | 797 | 22.6 s | PL 13, DE 11, UK 11 | 1,943 |
| Admin P3 | Fri 00:19 | 834 | 21.6 s | UK 24, DE 9, US 6 | 1,742 |
| News #1 | Fri 12:13 | 305 | **5 s** | PH 24, DE 7, UK 7 | 176 |

News #1 went out in the Philippines slot and got mostly Philippine viewers, and people left after 5 seconds on average. The next episode should test the 19:00 slot with a stronger opening.
