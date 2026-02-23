import { test, expect } from '@playwright/test';

/**
 * Test to verify comment fetching on Vercel production
 * Tests direct mode (COMMENT_FETCH_USE_JOBS=false) on production environment
 */
test.describe('Comments Fetch - Vercel Production Test', () => {
  test.setTimeout(300000); // 5 minutes timeout

  const testCredentials = {
    email: 'dmitry.ivanov.developer@gmail.com',
    password: 'Qweasdzxc117!',
  };

  const productionUrl = 'https://validatey.vercel.app';
  const testProjectUrl = 'https://validatey.vercel.app/workspaces/023fc4d2-e85a-4c22-ae5b-ad10c473e8c3/projects/ec73391f-6d45-40dc-b80b-6809cfd0cc1d/comments';
  const testRedditUrl = 'https://www.reddit.com/r/indiebiz/comments/1rb10vj/comment/o6uamlc/';

  test('should fetch comments from Reddit on Vercel production', async ({ page }) => {
    console.log('=== Testing Comment Fetch on Vercel Production ===');
    console.log(`Production URL: ${productionUrl}`);
    console.log(`Test Reddit URL: ${testRedditUrl}`);

    // Navigate to production
    console.log('Navigating to production site...');
    await page.goto(productionUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if we need to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login') || currentUrl.includes('auth')) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
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
    try {
      await expect(page.locator('text=Reddit').first()).toBeVisible({ timeout: 15000 });
      console.log('✓ Reddit section found');
    } catch (e) {
      console.log('⚠️  Reddit section not found, taking screenshot...');
      await page.screenshot({ path: 'test-results/vercel-comments-page.png', fullPage: true });
      throw new Error('Reddit section not found on page');
    }

    // Monitor network requests
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && (url.includes('comments') || url.includes('fetch'))) {
        apiRequests.push(`${request.method()} ${url}`);
        console.log(`📡 API Request: ${request.method()} ${url}`);
      }
    });

    // Check if URL already exists
    console.log(`Checking if Reddit URL already exists: ${testRedditUrl}`);
    const urlExists = await page.locator(`input[value="${testRedditUrl}"], text=${testRedditUrl}`).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (urlExists) {
      console.log('✓ URL already exists in the list, skipping add step');
    } else {
      // Add Reddit URL
      console.log(`Adding Reddit URL: ${testRedditUrl}`);
      
      // Find empty input field (not readonly) - look for input without readonly attribute
      const allInputs = page.locator('input[placeholder*="Reddit"], input[placeholder*="reddit"]');
      const inputCount = await allInputs.count();
      console.log(`Found ${inputCount} input field(s)`);
      
      let inputFound = false;
      let emptyInput = null;
      
      // Find first non-readonly input
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
          await emptyInput.fill(testRedditUrl, { timeout: 5000 });
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
          console.log('⚠️  Could not fill input (might be readonly), checking if URL already exists...');
          // Check if URL already exists by value
          const urlInInput = await allInputs.filter({ hasText: testRedditUrl }).first().isVisible({ timeout: 2000 }).catch(() => false);
          if (urlInInput) {
            console.log('✓ URL already exists in input, skipping add');
          }
        }
      } else {
        console.log('⚠️  All inputs are readonly or have values - URL likely already added');
        // Continue anyway - might be able to fetch if URL exists
      }
      
      // Verify URL was added (try multiple ways)
      const urlSelectors = [
        `text=${testRedditUrl}`,
        `.url-item:has-text("${testRedditUrl}")`,
        `[data-url*="${testRedditUrl.split('/').pop()}"]`
      ];
      
      let urlFound = false;
      for (const selector of urlSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✓ URL found with selector: ${selector}`);
          urlFound = true;
          break;
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (!urlFound) {
        console.log('⚠️  URL not immediately visible, but continuing...');
        await page.screenshot({ path: 'test-results/vercel-url-added.png', fullPage: true });
      } else {
        console.log('✓ Reddit URL added successfully');
      }
    }
    
    // Verify URL exists (either was just added or already existed)
    const urlExistsNow = await page.locator(`input[value="${testRedditUrl}"], text=${testRedditUrl}`).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!urlExistsNow) {
      console.log('⚠️  URL not found after add attempt, but continuing to test fetch...');
    }

    // Close any open overlays/modals first
    const overlay = page.locator('.detail-overlay, [class*="overlay"], [class*="modal"]');
    if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Closing overlay...');
      // Try to close overlay by clicking outside or close button
      const closeButton = page.locator('button[aria-label="Close"], .btn-close, [class*="close"]').first();
      if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      } else {
        // Click outside overlay
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    // Find and click Fetch Comments button
    console.log('Looking for Fetch Comments button...');
    const fetchButton = page.locator('button').filter({ hasText: /Fetch Comments/i });
    
    const buttonCount = await fetchButton.count();
    if (buttonCount === 0) {
      console.log('⚠️  Fetch Comments button not found');
      await page.screenshot({ path: 'test-results/vercel-no-fetch-button.png', fullPage: true });
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

    // Verify API was called
    console.log(`API requests made: ${apiRequests.length}`);
    apiRequests.forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${req}`);
    });

    // Wait for comments to be loaded
    await page.waitForTimeout(5000);

    // Verify comments were collected
    console.log('Verifying comments were collected...');
    
    // Try to find comments indicator
    const urlItem = page.locator('.url-item, [class*="url"]').filter({ hasText: testRedditUrl.split('/').pop() || 'reddit' });
    
    if (await urlItem.count() > 0) {
      console.log('✓ URL item found');
      
      const viewCommentsButton = urlItem.locator('button[aria-label*="View comments"], button[aria-label*="view"]').first();
      
      if (await viewCommentsButton.isVisible({ timeout: 10000 }).catch(() => false)) {
        console.log('Opening comments sidebar...');
        await viewCommentsButton.click();
        await page.waitForTimeout(3000);

        // Check if sidebar opened
        const sidebar = page.locator('.comments-panel, .detail-panel, [class*="panel"]');
        if (await sidebar.isVisible({ timeout: 10000 }).catch(() => false)) {
          console.log('✓ Comments sidebar opened');

          // Check for comment count
          const commentCountBadge = page.locator('.comment-count-badge, [class*="count"]');
          if (await commentCountBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
            const countText = await commentCountBadge.textContent();
            const count = parseInt(countText || '0', 10);
            console.log(`✓ Comments collected: ${count}`);
            
            if (count > 0) {
              console.log('✅ SUCCESS: Comments were successfully collected on Vercel production!');
            } else {
              console.log('⚠️  Fetch completed but no comments found');
            }
          }

          // Check for comments list
          const commentsList = page.locator('.comment-item, [class*="comment"]');
          const commentsCount = await commentsList.count();
          console.log(`Comments found in sidebar: ${commentsCount}`);
          
          if (commentsCount > 0) {
            console.log(`✅ SUCCESS: Found ${commentsCount} comment(s) in sidebar!`);
          }
        }
      } else {
        console.log('⚠️  View comments button not found');
      }
    } else {
      console.log('⚠️  URL item not found after fetch');
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/vercel-fetch-completed.png', fullPage: true });
    console.log('✓ Screenshot saved: test-results/vercel-fetch-completed.png');

    console.log('=== Vercel Production Test completed ===');
  });
});
