#!/usr/bin/env ts-node
/**
 * Debug: fetch one Reddit post comments URL and log structure to understand why we get 0 comments.
 * Run from backend: npx ts-node --transpile-only scripts/debug-reddit-response.ts
 */
const REDDIT_BASE = 'https://www.reddit.com';
const USER_AGENT = 'web:com.validatey.comments:v1.0.0 (by /u/validatey_bot)';

const url = `${REDDIT_BASE}/r/startups/comments/1r3vmqb.json?limit=500`;

async function main() {
  console.log('Fetching:', url);
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT },
  });
  console.log('HTTP status:', response.status, response.statusText);
  const text = await response.text();
  if (!response.ok) {
    console.log('Body (first 500 chars):', text.slice(0, 500));
    return;
  }
  const json = JSON.parse(text) as [unknown, unknown];
  console.log('Response is array length:', json.length);
  const postListing = json[0] as { kind?: string; data?: { children?: unknown[] } };
  const commentsListing = json[1] as { kind?: string; data?: { children?: unknown[] } };
  console.log('Post listing kind:', postListing?.kind, 'children count:', postListing?.data?.children?.length ?? 0);
  console.log('Comments listing kind:', commentsListing?.kind, 'children count:', commentsListing?.data?.children?.length ?? 0);

  const children = commentsListing?.data?.children ?? [];
  for (let i = 0; i < Math.min(5, children.length); i++) {
    const c = children[i] as { kind?: string; data?: { id?: string; body?: string; replies?: unknown } };
    console.log(`  [${i}] kind=${c?.kind} id=${c?.data?.id} bodyLen=${(c?.data?.body ?? '').length} repliesType=${typeof c?.data?.replies}`);
    if (c?.data?.replies && typeof c.data.replies === 'object') {
      const r = c.data.replies as { data?: { children?: unknown[] } };
      console.log(`       replies.data.children.length=${r?.data?.children?.length ?? 0}`);
    }
  }
  if (children.length === 0) {
    console.log('First 300 chars of comments listing:', JSON.stringify(commentsListing).slice(0, 300));
  }
}

main().catch(console.error);
