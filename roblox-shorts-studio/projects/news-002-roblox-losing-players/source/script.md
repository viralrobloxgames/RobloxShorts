# ViralRoblox News #2: Roblox is losing players

**Status:** script draft v2, awaiting the user's approval. Nothing recorded or posted yet.

- **Topic:** Roblox's daily players fell from 152 million (Q3 2025) to 123 million (Q2 2026), three quarterly drops in a row. The stock is down about 70% from its $142 high, and on 2026-09-28 Jefferies cut it to Underperform. Reasons: age checks for chat (Roblox says younger players were hit hardest), last year's viral hits cooling off; the CEO puts it mostly down to seasonality.
- **Why this topic (v2, 2026-10-05):** the user asked for something bigger than v1 (YouTube videos removed from game pages). Nothing bigger broke in the last 72 hours (codes, Halloween events and developer updates only), so this is the biggest live story: "Roblox is losing millions of players" is the channel's proven "Everyone DELETING Roblox" format, it's US-centred, and the latest news hook (Jefferies, 2026-09-28; the stock at $44 on 2026-10-02) is a week old. Every number is from Roblox's own Q2 shareholder letter or named reporting.
- **v1 (kept as a candidate in `ideas/news-ledger.json`):** YouTube videos removed from game pages on 2026-09-30, Moments tap-to-buy in October. The v1 script is in git history.
- **Breaking bar headline:** `ROBLOX IS LOSING PLAYERS`
- **Cover headline:** `30 MILLION GONE?!` (highlight word: `30 MILLION`), Skye shocked, wall image = falling player-count chart.
- **Length:** 159 words, 5 news beats; about 61 to 63 s at News #1's pace. If the clone reads fast, `--beat 1.2`.
- **Hook:** opens on the number with no lead-in; frame 1 already shows the BREAKING bar and the falling chart.
- **Tone:** no doom. "Roblox isn't dying" is said outright, because it's true (DAUs are still up 10% year on year) and the comments will argue either way.

## Script and shot plan

| # | Beat | Line | Shot | Face | Wall / overlay |
|---|---|---|---|---|---|
| 1 | Hook | Roblox has lost almost 30 million daily players. | Medium, slow push in | shocked → talking | Wall: falling chart 152M → 123M. BREAKING bar: ROBLOX IS LOSING PLAYERS |
| 2 | Signature open | This is ViralRoblox News. | Wide | happy | Logo sting, ticker starts |
| 3 | Fact 1 | Last fall, 152 million people played Roblox every day. Now it's 123 million. That's three drops in a row. | Evidence: our own bar chart card (152 → 144 → 132 → 123), then the shareholder-letter line | talking (PiP) | Counter pop: 152M → 123M |
| 4 | Fact 2 | And Wall Street noticed. Roblox's stock has crashed about 70 percent from its high. On September 28th, the bank Jefferies said it could fall even further. | Medium on "Wall Street noticed", then evidence: stock-chart card ($142 → $44), Jefferies headline card | surprised → talking | Pop words: -70% · UNDERPERFORM |
| 5 | Fact 3 | So why are players leaving? Roblox now makes you pass an age check to chat, and Roblox says younger players were hit hardest. Last year's giant viral hits have cooled off too. But Roblox's CEO says a lot of it is just seasonal. | Close-up on the question, then evidence: shareholder-letter "younger cohorts" line | confused → talking | Pop words: AGE CHECKS · VIRAL HITS · SEASONAL? |
| 6 | What it means | So what does this mean for you? Roblox isn't dying. It still has more players than a year ago. But expect big moves to win players back, like Roblox right in your browser. | Close-up | talking → happy | Pop: +10% vs last year; wall flashes News #1's browser card |
| 7 | Follow CTA | Follow ViralRobloxGames so you never miss Roblox news! | Medium | happy | FOLLOW button pop-up |
| 8 | Comment prompt | Is Roblox getting better or worse? Comment below. | Close-up | talking → happy | "Comment below 👇" sticker |
| 9 | Sign-off and loop | I'm Skye, this has been ViralRoblox News. Follow for more! | Wide | happy (wave) | Cut back to frame 1 for the loop |

Charts are our own cards drawn from the published numbers (no screenshots of paid finance sites).

## Fact check

| Claim in the script | Source wording | Source |
|---|---|---|
| Lost almost 30 million daily players; 152M last fall, 123M now | "Q2 2026: 123 million; Q1 2026: 132 million; Q4 2025: 144 million; Q3 2025: 152 million" (152 − 123 = 29M) | Music Ally 2026-07-31; Roblox Q2 2026 shareholder letter (SEC 8-K, 2026-07-30): "DAUs … 123 million" |
| Three drops in a row | Q3 25 → Q4 25 → Q1 26 → Q2 26 all down; "third consecutive quarter of falling DAUs" | Music Ally; Tech Insider 2026-09-25 |
| Stock down about 70% from its high | "Stock down 70% from its high of $142, currently trading near $42"; closed $44.12 on 2026-10-02 | TIKR; Insider Monkey / Yahoo Finance |
| Sept 28, Jefferies said it could fall further | Jefferies cut from Hold to Underperform, $38 target (below the ~$44 price) | Tradingpedia 2026-09-28; TIKR |
| Age check to chat | "Roblox has been 'age-checking' all its users, and limiting chat features for people who haven't been age-checked" | Music Ally; Roblox IR (age checks required worldwide for chat) |
| Roblox says younger players were hit hardest | "In Q2 the near-term impact on younger cohorts has been larger than we anticipated"; "a decline in per hour monetization most notably with younger cohorts in the U.S. and Canada" | Roblox Q2 2026 shareholder letter |
| Last year's viral hits cooled off | CFO Naveen Chopra: "a greater-than-expected shift of engagement away from 2025's high-monetizing viral hits" | Yahoo Finance 2026-08-05 |
| CEO says a lot of it is seasonal | "CEO David Baszucki attributed the decline primarily to 'seasonality'" | Music Ally |
| More players than a year ago | "DAUs grew 10% year-over-year to 123 million" | Roblox Q2 2026 shareholder letter |
| Roblox in your browser | Chrome web player by the end of 2026 | Roblox Newsroom, RDC 2026 (News #1) |

## Description draft

```
Roblox has lost almost 30 MILLION daily players 😱 From 152 million a day last fall to 123 million now, the stock is down about 70%, and Wall Street thinks it could get worse. Here's why players are leaving, and why Roblox isn't dying.

Is Roblox getting better or worse? Comment below 👇
👉 Follow @viralrobloxgames for daily Roblox news

#robloxnews #roblox #viralrobloxgames #robloxupdate #gaming

Sources:
• Roblox Q2 2026 shareholder letter (ir.roblox.com)
• Music Ally: Roblox ended Q2 2026 with 123 million daily active users (musically.com)
• Tradingpedia: Roblox shares drop after Jefferies cuts rating and target (tradingpedia.com)
• Yahoo Finance: Roblox has 123 million players and still lost $70 billion (finance.yahoo.com)
```

YouTube title: `Roblox Lost 30 MILLION Players?! 😱 #roblox #robloxnews`
