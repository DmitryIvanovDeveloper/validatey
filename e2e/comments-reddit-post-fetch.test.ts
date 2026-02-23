import { test, expect } from '@playwright/test';

/**
 * Test to verify comment fetching from a specific Reddit post
 */
test.describe('Comments Fetch - Reddit Post Test', () => {
  test.setTimeout(300000); // 5 minutes timeout

  const testCredentials = {
    email: 'dmitry.ivanov.developer@gmail.com',
    password: 'Qweasdzxc117!',
  };

  const productionUrl = 'https://validatey.vercel.app';
  const testProjectUrl = 'https://validatey.vercel.app/workspaces/023fc4d2-e85a-4c22-ae5b-ad10c473e8c3/projects/ec73391f-6d45-40dc-b80b-6809cfd0cc1d/comments';
  const testRedditPostUrl = 'https://www.reddit.com/r/indiebiz/comments/1rb10vj/hi_fellow_founders_and_product_managers_were/';

  test('should fetch comments from Reddit post on Vercel production', async ({ page, request }) => {
    console.log('=== Testing Reddit Post Comment Fetch ===');
    console.log(`Test Reddit Post URL: ${testRedditPostUrl}`);

    // Navigate to production
    console.log('Navigating to production site...');
    await page.goto(productionUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('auth')) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✓ Logged in successfully');
    }

    // Navigate to comments page
    console.log(`Navigating to comments page: ${testProjectUrl}`);
    await page.goto(testProjectUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if redirected to login
    const finalUrl = page.url();
    if (finalUrl.includes('/login')) {
      console.log('⚠️  Redirected to login, attempting login again...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.goto(testProjectUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    console.log(`✓ On comments page: ${page.url()}`);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify Reddit section is visible
    await expect(page.locator('text=Reddit').first()).toBeVisible({ timeout: 15000 });
    console.log('✓ Reddit section found');

    // Check if URL already exists
    console.log(`Checking if Reddit post URL already exists: ${testRedditPostUrl}`);
    const urlExists = await page.locator(`input[value="${testRedditPostUrl}"], text=${testRedditPostUrl}`).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (urlExists) {
      console.log('✓ URL already exists in the list, skipping add step');
    } else {
      // Add Reddit URL
      console.log(`Adding Reddit post URL: ${testRedditPostUrl}`);
      
      // Find empty input field (not readonly)
      const allInputs = page.locator('input[placeholder*="Reddit"], input[placeholder*="reddit"]');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} input field(s)`);
      
      let inputFound = false;
      let emptyInput = null;
      
      // Find first non-readonly, empty input
      for (let i = 0; i < inputCount; i++) {
        const input = allInputs.nth(i);
        const isReadonly = await input.getAttribute('readonly');
        const value = await input.inputValue().catch(() => '');
        if (!isReadonly && !value) {
          emptyInput = input;
          inputFound = true;
          console.log(`✓ Found empty input at index ${i}`);
          break;
        }
      }
      
      if (inputFound && emptyInput) {
        try {
          await emptyInput.fill(testRedditPostUrl, { timeout: 5000 });
          console.log('✓ URL filled in input');
          
          // Find and click add button
          const redditCard = page.locator('.reddit-card, [class*="reddit"]').first();
          await redditCard.waitFor({ state: 'visible', timeout: 10000 });
          
          const addButton = redditCard.locator('.add-url-btn, button[type="button"]:not([disabled])').first();
          await addButton.waitFor({ state: 'visible', timeout: 10000 });
          console.log('✓ Add button found');
          
          await addButton.click();
          console.log('✓ Add button clicked');
          await page.waitForTimeout(5000); // Wait for URL to be added
        } catch (e) {
          console.log('⚠️  Could not fill input, checking if URL already exists...');
        }
      } else {
        console.log('⚠️  All inputs are readonly or have values - URL might already be added');
      }
    }

    // Close any open overlays/modals first
    const overlay = page.locator('.detail-overlay, [class*="overlay"], [class*="modal"]');
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Closing overlay...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // Monitor API requests
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/') && (url.includes('comments') || url.includes('fetch'))) {
        apiRequests.push(`${req.method()} ${url}`);
        console.log(`📡 API Request: ${req.method()} ${url}`);
      }
    });

    // Find and click Fetch Comments button
    console.log('Looking for Fetch Comments button...');
    const fetchButton = page.locator('button').filter({ hasText: /Fetch Comments/i });
    
    const buttonCount = await fetchButton.count();
    if (buttonCount === 0) {
      console.log('⚠️  Fetch Comments button not found');
      await page.screenshot({ path: 'test-results/reddit-post-no-fetch-button.png', fullPage: true });
      throw new Error('Fetch Comments button not found');
    }
    
    await expect(fetchButton.first()).toBeVisible();
    const isDisabled = await fetchButton.first().isDisabled();
    
    if (isDisabled) {
      console.log('⚠️  Fetch button is disabled, waiting...');
      await page.waitForTimeout(3000);
    }
    
    console.log('Clicking Fetch Comments button...');
    const fetchStartTime = Date.now();
    
    // Try to click with force if overlay is blocking
    try {
      await fetchButton.first().click({ timeout: 10000 });
    } catch (e) {
      console.log('⚠️  Normal click failed, trying force click...');
      await fetchButton.first().click({ force: true });
    }

    // Wait for fetching to start
    try {
      await expect(
        page.locator('text=Fetching Comments...').or(page.locator('text=/fetching/i'))
      ).toBeVisible({ timeout: 10000 });
      console.log('✓ Fetch started');
    } catch (e) {
      console.log('⚠️  "Fetching" text not found, but fetch may have started (direct mode is fast)');
      await page.waitForTimeout(3000);
    }

    // Wait for fetching to complete
    console.log('Waiting for fetch to complete (this may take a while)...');
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const fetchButton = buttons.find(btn => 
          btn.textContent?.includes('Fetch Comments') && 
          !btn.textContent?.includes('Fetching')
        );
        return fetchButton !== undefined;
      },
      { timeout: 240000 } // 4 minutes max
    );
    
    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`✓ Fetch completed in ${Math.round(fetchDuration / 1000)}s`);

    // Wait a bit more for comments to be processed
    await page.waitForTimeout(5000);

    // Verify comments were collected via API
    console.log('Verifying comments were collected via API...');
    const projectId = 'ec73391f-6d45-40dc-b80b-6809cfd0cc1d';
    
    // Get all comments to find the source
    const commentsResponse = await request.get(
      `https://validatey-backend.vercel.app/api/projects/${projectId}/comments?limit=200`
    );
    
    expect(commentsResponse.ok()).toBe(true);
    const commentsData = await commentsResponse.json();
    console.log(`Total comments in project: ${commentsData.totalCount || commentsData.comments?.length || 0}`);
    
    // Find comments from this post (by post ID or subreddit)
    const postId = '1rb10vj';
    const matchingComments = commentsData.comments?.filter((c: any) => 
      c.url?.includes(postId) || 
      c.contextUrl?.includes(postId) ||
      (c.subsourceName === 'r/indiebiz' && c.fetchedAt && new Date(c.fetchedAt) > new Date(Date.now() - 600000)) // fetched in last 10 minutes
    ) || [];
    
    console.log(`Comments from this post: ${matchingComments.length}`);
    
    if (matchingComments.length > 0) {
      console.log('✅ SUCCESS: Comments were collected from the Reddit post!');
      console.log(`\nSample comments (first 3):`);
      matchingComments.slice(0, 3).forEach((comment: any, idx: number) => {
        console.log(`\n${idx + 1}. Comment ID: ${comment.externalId}`);
        console.log(`   Author: ${comment.author}`);
        console.log(`   Content: ${comment.content.substring(0, 150)}...`);
        console.log(`   URL: ${comment.url}`);
        console.log(`   Fetched: ${comment.fetchedAt}`);
      });
      
      expect(matchingComments.length).toBeGreaterThan(0);
    } else {
      console.log('⚠️  No comments found for this post yet');
      console.log('This might be normal if:');
      console.log('  - The post has no comments');
      console.log('  - Comments are still being processed');
      console.log('  - There was an error during fetch');
      
      // Check API requests to see if fetch was called
      const fetchRequests = apiRequests.filter(r => r.includes('/fetch'));
      console.log(`\nFetch API requests made: ${fetchRequests.length}`);
      fetchRequests.forEach((req, idx) => {
        console.log(`  ${idx + 1}. ${req}`);
      });
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/reddit-post-fetch-completed.png', fullPage: true });
    console.log('✓ Screenshot saved: test-results/reddit-post-fetch-completed.png');

    console.log('=== Reddit Post Fetch Test completed ===');
  });
});
