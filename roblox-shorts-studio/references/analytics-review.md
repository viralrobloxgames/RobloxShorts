# Analytics review ("check analytics")

When the user says **check analytics**, run this whole routine and report. It reads only; it changes nothing on either account. Use the user's Chrome (Claude in Chrome), where TikTok Studio and YouTube Studio are signed in. Takes about 10 minutes.

Judge TikTok on **£ per 1,000 views and US / tier-1 share**, not raw views (see [posting-schedule.md](posting-schedule.md)). YouTube isn't monetised yet, so judge it on views, "stayed to watch" and subscribers gained.

## 1. TikTok

Open `https://www.tiktok.com/tiktokstudio/content` in a new tab. Everything below runs with `javascript_tool` in that tab; the page's own `fetch` signs the requests. **Results returned from the page are cut at about 1,000 characters**, so keep the data in `localStorage` and return small summaries.

**Post list** (all posts, about 15 pages):

```js
const u='/tiktok/creator/manage/item_list/v1/?locale=en&aid=1988&priority_region=GB&region=GB&tz_name=Europe%2FLondon&app_name=tiktok_creator_center&app_language=en&device_platform=web_pc&channel=tiktok_web';
let all=[],cursor=0,more=true,n=0;
while(more&&n<60){const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json'},credentials:'include',body:JSON.stringify({cursor,size:50,query:{sort_orders:[{field_name:'create_time',order:2}],conditions:[]}})});const j=await r.json();if(!j.item_list||!j.item_list.length)break;all.push(...j.item_list.map(i=>({id:i.item_id,t:+i.post_time||+i.create_time,d:i.desc,dur:i.duration/1000,v:+i.play_count,l:+i.like_count,c:+i.comment_count,s:+i.share_count,f:+i.favorite_count})));more=j.has_more;cursor=j.cursor;n++;}
localStorage.setItem('__cl_posts',JSON.stringify(all)); all.length
```

**Per-video insight** for every video of 60 s or more plus everything from the last 45 days (about 150 requests, 4 at a time):

```js
const base='/aweme/v2/data/insight/?locale=en&aid=1988&priority_region=GB&region=GB&tz_name=Europe%2FLondon&app_name=tiktok_creator_center&app_language=en&device_platform=web_pc&channel=tiktok_web&tz_offset=3600&type_requests=';
const types=['video_rewards_data','video_per_duration_realtime','video_finish_rate_realtime','video_new_follower_realtime','video_traffic_source_percent_realtime','video_viewer_location_percent_realtime','video_viewer_follower_percent_realtime','video_uv'];
const posts=JSON.parse(localStorage.getItem('__cl_posts')),now=Date.now()/1000,targets=posts.filter(p=>p.dur>=60||now-p.t<45*86400),out={};let i=0;
async function work(){while(i<targets.length){const id=targets[i++].id;const j=await (await fetch(base+encodeURIComponent(JSON.stringify(types.map(t=>({insigh_type:t,aweme_id:id})))),{credentials:'include'})).json();const L={};j.video_viewer_location_percent_realtime?.value?.country_percent_list?.forEach(x=>L[x.country_name]=x.country_vv_percent);const tr={};(j.video_traffic_source_percent_realtime?.value?.value||[]).forEach(x=>tr[x.key]=x.value);out[id]={rw:j.video_rewards_data?.total?.amount||0,aw:j.video_per_duration_realtime?.value?.value,fr:j.video_finish_rate_realtime?.value?.value,nf:j.realtime_new_followers?.value?.value,loc:L,fy:tr['For You'],se:tr['Search'],fol:j.video_viewer_follower_percent_realtime?.value?.value,uv:j.video_uv?.value}}}
await Promise.all([work(),work(),work(),work()]);localStorage.setItem('__cl_ins',JSON.stringify(out));Object.keys(out).length
```

Notes: the parameter really is spelled `insigh_type`. Country shares are in `value.country_percent_list[].country_vv_percent` (ISO codes, plus `Others`). `aw` is average watch time in seconds, `fr` the share who watched to the end, `fy` the For You share of traffic, `fol` the share of viewers who already follow.

**Then compute in the page and return:**

1. One row per post since the last review: UK post time, length, views, likes, comments, shares, average watch, finish rate, rewards, US %, PH %, top 3 countries, For You %, follower %.
2. 60 s+ videos with at least 2K views, by UK posting hour (00-03, 03-09, 09-12, 12-15, 15-18, 18-21, 21-24): count, median US %, median PH %, rewards, median views.
3. All posts by the same hour buckets and by weekday: median views against the account median.
4. Median views by month (shows whether the account is warming up or cooling).
5. Top 10 by views, top earners, and median views by hashtag (hashtags with 8 or more posts) to compare concepts.

## 2. YouTube

Open `https://studio.youtube.com` (it redirects to the channel, `UC9BMTHo_LNCEZR9K4kc5y4Q`).

- **Dashboard** page text: subscribers, 28-day views and watch hours.
- **Per video:** Advanced mode, lifetime, by video:
  `…/analytics/tab-overview/period-default/explore?entity_type=CHANNEL&entity_id=<channel>&time_period=lifetime&explore_type=TABLE_AND_CHART&metric=VIEWS&granularity=DAY&t_metrics=VIEWS&t_metrics=SHORTS_FEED_IMPRESSIONS&t_metrics=SHORTS_FEED_IMPRESSIONS_VTR&t_metrics=AVERAGE_WATCH_TIME&t_metrics=AVERAGE_WATCH_PERCENTAGE&t_metrics=SUBSCRIBERS_NET_CHANGE&t_metrics=RATINGS_LIKES&t_metrics=COMMENTS&dimension=VIDEO&o_column=VIEWS&o_direction=ANALYTICS_ORDER_DIRECTION_DESC`
- **Countries** and **traffic sources:** the same URL with `dimension=COUNTRY` or `dimension=TRAFFIC_SOURCE_TYPE`.

Wait about 8 s after loading. `get_page_text` returns nothing here because the table is inside shadow DOM; read it with:

```js
function deep(root,sel,acc=[]){root.querySelectorAll('*').forEach(e=>{if(e.matches(sel))acc.push(e);if(e.shadowRoot)deep(e.shadowRoot,sel,acc)});return acc}
deep(document,'yta-explore-table-row, .data-row, [role=row]').map(r=>r.innerText.replace(/\s*\n\s*/g,'|')).filter(x=>x)
```

Video rows read: length | title | views | share | shown in feed | — | stayed to watch | average view duration | average % viewed | subscribers | share | likes | share | comments | share.

Also read the Shorts list (`…/videos/short`) and flag any upload with a missing or broken description, title or cover.

## 3. Report

Close the tabs you opened. Then:

1. Add a dated section to [analytics-log.md](analytics-log.md): the per-video tables for both platforms and the findings. Newest at the top.
2. If the evidence changes the slots or formats, update [posting-schedule.md](posting-schedule.md) and say so. Don't move a slot on fewer than about 7 posts in it.
3. Commit and push.
4. Tell the user, in this order: what changed since the last review, best and worst videos and why (retention first), which concepts are working, what the post-time data does and doesn't show, and the 3 or so actions to take next. Say plainly when a sample is too small to conclude from.
