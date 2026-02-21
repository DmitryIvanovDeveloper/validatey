# Founder Validation Pain Survey — Reddit comments investigation

## 1) Project and links in comments

- **Project**: Founder Validation Pain Survey  
- **Project ID**: `ec73391f-6d45-40dc-b80b-6809cfd0cc1d`

### Comment sources (6 total)

| Type       | Source        | URL |
|-----------|----------------|-----|
| Hacker News | item 47079107 | https://news.ycombinator.com/item?id=47079107 |
| Reddit    | r/SEO          | https://www.reddit.com/r/SEO/comments/1r8vntm/... |
| Reddit    | r/Entrepreneur | https://www.reddit.com/r/Entrepreneur/comments/1r8mxdo/... |
| Reddit    | r/micro_saas   | https://www.reddit.com/r/micro_saas/comments/1r9q1zi/... |
| Reddit    | r/startups     | https://www.reddit.com/r/startups/comments/1r3vmqb/... |
| Reddit    | r/buildinpublic | https://www.reddit.com/r/buildinpublic/comments/1r88nwc/... |

### Links found in comments (from DB)

- `https://news.ycombinator.com/item?id=47080224`
- `https://news.ycombinator.com/item?id=47079107`

Only **1 comment** exists in the DB (from HN). So the only links are from that one comment and its context.

---

## 2) Why Reddit comments were not collected

### Observed behaviour

- **Comments in DB**: 1 (from Hacker News only).
- **Reddit sources**: 5; all have `fetch_jobs` with status `completed` and **comments_count: 0**.
- **HN**: One job failed with `error_message: "Failed to save comments to database"`; one job succeeded and saved 1 comment.

So Reddit fetches **complete successfully** but **never save any comments** (0 comments per job).

### Root cause: Only top-level comments parsed (OAuth not required)

**Update:** Reddit returns **HTTP 403 Blocked** for unauthenticated server requests (verified with a direct fetch). So in practice OAuth **is required** for server-side fetching. The main fix is to set `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` in `.env`. Flattening `replies` was also added so that when API returns data, all nested comments are collected. In `reddit-fetcher.ts`, for a **post URL** we call:

- `GET https://www.reddit.com/r/{subreddit}/comments/{postId}.json?limit=500`
- With or without `Authorization: Bearer <token>` depending on `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`.

If these env vars are **missing or invalid**:

- No OAuth token is sent.
- Reddit often **throttles or blocks** unauthenticated server requests (403/429 or empty listing).
- The fetcher catches errors and returns `{ comments: [] }`, so the job “succeeds” with 0 comments.

**What to do**: Set valid Reddit app credentials in `.env`:

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`

Create an app at https://www.reddit.com/prefs/apps (type “script” or “installed”) and use its client id and secret.

### Root cause 2: Only top-level comments are parsed

Reddit’s API returns comments as a **tree**: each comment has a `replies` field with nested comments. Our code only uses:

- `commentsData.data.children` (top level)

and does **not** walk `replies`. So:

- If a post has 50 comments but 49 are nested under one thread, we only get the top-level ones.
- If Reddit returns the thread in a format where the first-level `children` are not `t1` (e.g. "MoreComments" or the post itself), we could get 0 comments.

**Note:** OAuth is not required for read-only access; Reddit allows it with a proper User-Agent. So 0 comments are more likely due to parsing (only top level) or response shape than missing credentials.

**Improvement**: Flatten the comment tree (recurse into `replies.data.children`) and map all `kind === 't1'` comments to raw comments so all levels are saved.

### HN “Failed to save comments to database”

One HN job failed with that error. That comes from `FetchCommentsUseCase` when `_commentRepository.bulkSave(commentEntities)` fails (e.g. Supabase/DB error or constraint). Possible causes:

- Duplicate `(source_id, external_id)` when re-fetching the same HN thread.
- Temporary DB/network error.

Worth checking backend logs at the time of that job and ensuring upsert/conflict handling is correct for `comments`.

---

## Summary

| Issue | Cause | Action |
|-------|--------|--------|
| Reddit: 0 comments for all 5 sources | **HTTP 403** — Reddit blocks unauthenticated server requests. Replies flattening added. | Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in backend .env |
| (same) Reddit: only top-level | We don’t parse `replies` | Add recursive flattening of `replies` in `reddit-fetcher.ts` |
| HN: one job “Failed to save comments to database” | `bulkSave` failed (e.g. constraint or transient error) | Check logs and upsert/conflict handling for `comments` |

Links in comments are only from the single HN comment currently in the DB; after adding reply flattening, re-run fetch and you’ll get more comments and more links.
