/**
 * Test script to verify Puppeteer fallback when Reddit API fails
 * Run: ts-node scripts/test-reddit-puppeteer-fallback.ts
 */
import 'dotenv/config';
import { RedditFetcher } from '../src/modules/comments/infrastructure/fetchers/reddit-fetcher';
import { container } from '../src/infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../src/modules/comments/types';

const TEST_POST_URL = 'https://www.reddit.com/r/indiebiz/comments/1rb10vj/hi_fellow_founders_and_product_managers_were/';
const POST_ID = '1rb10vj';
const SUBREDDIT = 'indiebiz';

async function main() {
  console.log('=== Testing Puppeteer Fallback (when API returns 0 comments) ===\n');
  console.log(`Post URL: ${TEST_POST_URL}`);
  console.log(`Post ID: ${POST_ID}`);
  console.log(`Subreddit: r/${SUBREDDIT}\n`);

  const fetcher = container.get<RedditFetcher>(COMMENT_TYPES.RedditFetcher);

  // Test with invalid postId to trigger fallback
  // Using a non-existent post ID to force API to return 0 comments
  const invalidPostId = 'invalid_post_id_12345';
  
  console.log('Test 1: Invalid post ID (should trigger Puppeteer fallback)');
  console.log(`Using invalid post ID: ${invalidPostId}\n`);

  const input1 = {
    sourceType: 'reddit' as const,
    postId: invalidPostId,
    subredditNames: [`r/${SUBREDDIT}`],
    apiCredentials: undefined, // No credentials to ensure fallback
  };

  const startTime1 = Date.now();
  const result1 = await fetcher.fetch(input1);
  const duration1 = Date.now() - startTime1;

  console.log(`Fetch completed in ${Math.round(duration1 / 1000)}s\n`);

  if (result1.isSuccess) {
    const data1 = result1.data;
    console.log(`Comments fetched: ${data1.comments.length}`);
    
    if (data1.errors && Array.isArray(data1.errors) && data1.errors.length > 0) {
      console.log('Errors/warnings:');
      data1.errors.forEach((err: string, idx: number) => {
        console.log(`  ${idx + 1}. ${err}`);
        if (err.includes('Puppeteer') || err.includes('browser scrape')) {
          console.log('     ✅ Puppeteer fallback was triggered!');
        }
      });
    }

    if (data1.comments.length > 0) {
      console.log(`\n✅ Puppeteer fallback worked! Scraped ${data1.comments.length} comments`);
      console.log('\nSample comment:');
      const comment = data1.comments[0];
      console.log(`  ID: ${comment.externalId}`);
      console.log(`  Author: ${comment.author || 'unknown'}`);
      console.log(`  Content: ${comment.content.substring(0, 100)}...`);
    } else {
      console.log('\n⚠️  No comments fetched (Puppeteer fallback may have failed or post doesn\'t exist)');
    }
  } else {
    console.log(`❌ Failed: ${(result1.error as Error).message || String(result1.error)}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\nTest 2: Valid post ID but with sinceDate filter (should still work)');
  console.log(`Using valid post ID: ${POST_ID}`);
  console.log('Filtering comments from future date (should return 0, trigger fallback)\n');

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in future

  const input2 = {
    sourceType: 'reddit' as const,
    postId: POST_ID,
    subredditNames: [`r/${SUBREDDIT}`],
    apiCredentials: undefined,
    sinceDate: futureDate, // This should filter out all comments
  };

  const startTime2 = Date.now();
  const result2 = await fetcher.fetch(input2);
  const duration2 = Date.now() - startTime2;

  console.log(`Fetch completed in ${Math.round(duration2 / 1000)}s\n`);

  if (result2.isSuccess) {
    const data2 = result2.data;
    console.log(`Comments fetched: ${data2.comments.length}`);
    
    if (data2.errors && Array.isArray(data2.errors) && data2.errors.length > 0) {
      console.log('Errors/warnings:');
      data2.errors.forEach((err: string) => {
        console.log(`  - ${err}`);
      });
    }

    // With future date filter, API should return 0, triggering Puppeteer
    // But Puppeteer will also filter by date, so result might be 0
    if (data2.comments.length > 0) {
      console.log(`\n✅ Found ${data2.comments.length} comments (Puppeteer fallback may have been used)`);
    } else {
      console.log('\n⚠️  No comments (expected with future date filter)');
    }
  }

  console.log('\n=== Tests completed ===');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
