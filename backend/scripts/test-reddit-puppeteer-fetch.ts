/**
 * Test script to verify Reddit comment fetching with Puppeteer fallback
 * Run: ts-node scripts/test-reddit-puppeteer-fetch.ts
 */
import 'dotenv/config';
import { RedditFetcher } from '../src/modules/comments/infrastructure/fetchers/reddit-fetcher';
import { container } from '../src/infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../src/modules/comments/types';

const TEST_POST_URL = 'https://www.reddit.com/r/indiebiz/comments/1rb10vj/hi_fellow_founders_and_product_managers_were/';
const POST_ID = '1rb10vj';
const SUBREDDIT = 'indiebiz';

async function main() {
  console.log('=== Testing Reddit Comment Fetch with Puppeteer Fallback ===\n');
  console.log(`Post URL: ${TEST_POST_URL}`);
  console.log(`Post ID: ${POST_ID}`);
  console.log(`Subreddit: r/${SUBREDDIT}\n`);

  const fetcher = container.get<RedditFetcher>(COMMENT_TYPES.RedditFetcher);

  // Test with postId (should trigger Puppeteer fallback if API fails)
  const input = {
    sourceType: 'reddit' as const,
    postId: POST_ID,
    subredditNames: [`r/${SUBREDDIT}`],
    apiCredentials: process.env.REDDIT_CLIENT_ID
      ? {
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
        }
      : undefined,
  };

  console.log('Input:', {
    ...input,
    apiCredentials: input.apiCredentials ? 'present' : 'none',
  });
  console.log('\n--- Starting fetch ---\n');

  const startTime = Date.now();
  const result = await fetcher.fetch(input);
  const duration = Date.now() - startTime;

  console.log(`\n--- Fetch completed in ${Math.round(duration / 1000)}s ---\n`);

  if (result.isSuccess) {
    const data = result.data;
    console.log(`✅ Success!`);
    console.log(`Comments fetched: ${data.comments.length}`);
    console.log(`Errors: ${data.errors?.length || 0}`);

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      console.log('\nErrors:');
      data.errors.forEach((err: string, idx: number) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    if (data.comments.length > 0) {
      console.log('\n📝 Sample comments (first 5):');
      data.comments.slice(0, 5).forEach((comment: any, idx: number) => {
        console.log(`\n${idx + 1}. Comment ID: ${comment.externalId}`);
        console.log(`   Author: ${comment.author || 'unknown'}`);
        console.log(`   Content: ${comment.content.substring(0, 150)}${comment.content.length > 150 ? '...' : ''}`);
        console.log(`   URL: ${comment.url || 'N/A'}`);
        console.log(`   Created: ${comment.createdAt.toISOString()}`);
      });

      console.log(`\n✅ Total comments: ${data.comments.length}`);
    } else {
      console.log('\n⚠️  No comments were fetched');
      console.log('Possible reasons:');
      console.log('  - Post has no comments');
      console.log('  - Reddit API blocked the request');
      console.log('  - Puppeteer fallback failed');
      console.log('  - Post ID or subreddit name is incorrect');
    }
  } else {
    const error = result.error as Error;
    console.log(`❌ Failed: ${error.message || String(error)}`);
  }

  console.log('\n=== Test completed ===');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
