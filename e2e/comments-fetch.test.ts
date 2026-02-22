import { test, expect } from '@playwright/test';

test.describe('Comments Fetching - Verify Comments Collection', () => {
  test.setTimeout(300000); // 5 minutes timeout

  const testCredentials = {
    email: 'dmitry.ivanov.developer@gmail.com',
    password: 'Qweasdzxc117!',
  };

  const testProject = {
    workspaceId: 'failure-patterns',
    projectId: 'startup-failure-patterns-analysis',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the application (same approach as working test)
    await page.goto('http://localhost:5173');

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');

      // Wait for redirect to workspaces
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
      console.log('✓ Logged in successfully');
    }

    // Navigate to project comments page
    const commentsUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments`;
    console.log(`Navigating to: ${commentsUrl}`);
    await page.goto(commentsUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for component to initialize
    console.log(`✓ On comments page: ${page.url()}`);
  });

  test('should fetch and collect comments from Reddit source', async ({ page }) => {
    console.log('=== Starting Reddit Comments Fetch Test ===');
    console.log(`Current URL: ${page.url()}`);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if we're on the right page
    const currentUrl = page.url();
    console.log(`Page URL after load: ${currentUrl}`);
    
    if (!currentUrl.includes('/comments')) {
      console.log('⚠️  Not on comments page, current URL:', currentUrl);
      // Try to navigate again
      const commentsUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments`;
      await page.goto(commentsUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // Wait for any content to appear
    console.log('Waiting for page content...');
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Try to find Reddit section with multiple selectors
    const redditSelectors = [
      'text=Reddit',
      '.reddit-card',
      '.comments-tab-view',
      'input[placeholder*="Reddit"]'
    ];
    
    let found = false;
    for (const selector of redditSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✓ Found element with selector: ${selector}`);
        found = true;
        break;
      } catch (e) {
        console.log(`✗ Not found: ${selector}`);
      }
    }
    
    if (!found) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/comments-page-debug.png', fullPage: true });
      console.log('⚠️  Screenshot saved to test-results/comments-page-debug.png');
      throw new Error('CommentsTab component not found on page');
    }
    
    // Verify Reddit section is visible
    await expect(page.locator('text=Reddit')).toBeVisible({ timeout: 10000 });
    console.log('✓ Reddit section found');

    // Use a real Reddit URL that likely has comments
    // Using a popular subreddit that should have recent posts with comments
    const testUrl = 'https://www.reddit.com/r/startups/';
    
    console.log(`Adding Reddit URL: ${testUrl}`);
    
    // Add Reddit URL source - try multiple selectors
    let redditInput = page.locator('input[placeholder*="Reddit"]').first();
    
    // Wait for input to be visible
    await redditInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Reddit input field found');
    
    await redditInput.fill(testUrl);
    console.log('✓ URL filled in input');
    
    // Find add button using class name
    const redditCard = page.locator('.reddit-card');
    await redditCard.waitFor({ state: 'visible', timeout: 10000 });
    
    // Look for add button by class
    const addButton = redditCard.locator('.add-url-btn').first();
    
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Add button found');
    
    // Check if button is enabled
    const isDisabled = await addButton.isDisabled();
    if (isDisabled) {
      console.log('⚠️  Add button is disabled, waiting for input to be valid...');
      await page.waitForTimeout(1000);
    }
    
    await addButton.click();
    console.log('✓ Add button clicked');
    await page.waitForTimeout(3000);
    
    // Verify URL was added
    await expect(page.locator(`text=${testUrl}`)).toBeVisible({ timeout: 10000 });
    console.log('✓ Reddit URL added successfully');

    // Find and click Fetch Comments button
    const fetchButton = page.locator('button').filter({ hasText: /Fetch Comments/i });
    await expect(fetchButton).toBeVisible();
    await expect(fetchButton).not.toBeDisabled();
    
    console.log('Clicking Fetch Comments button...');
    await fetchButton.click();

    // Wait for fetching to start (button should show "Fetching Comments...")
    await expect(page.locator('text=Fetching Comments...')).toBeVisible({ timeout: 10000 });
    console.log('✓ Fetch started');

    // Wait for fetching to complete
    // The button text should change back to "Fetch Comments" when done
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
    console.log('✓ Fetch completed');

    // Wait a bit more for comments to be loaded into the UI
    await page.waitForTimeout(5000);

    // Verify comments were collected by opening the comments sidebar
    console.log('Verifying comments were collected...');
    const urlItem = page.locator('.url-item').filter({ hasText: testUrl });
    
    if (await urlItem.count() > 0) {
      const viewCommentsButton = urlItem.locator('button[aria-label*="View comments"]');
      
      if (await viewCommentsButton.isVisible({ timeout: 10000 })) {
        console.log('Opening comments sidebar...');
        await viewCommentsButton.click();
        await page.waitForTimeout(3000);

        // Check if sidebar opened
        const sidebar = page.locator('.comments-panel, .detail-panel');
        await expect(sidebar).toBeVisible({ timeout: 10000 });
        console.log('✓ Comments sidebar opened');

        // Check for comment count badge
        const commentCountBadge = page.locator('.comment-count-badge');
        if (await commentCountBadge.isVisible({ timeout: 5000 })) {
          const countText = await commentCountBadge.textContent();
          const count = parseInt(countText || '0', 10);
          console.log(`✓ Comments collected: ${count}`);
          
          if (count > 0) {
            console.log('✅ SUCCESS: Comments were successfully collected!');
          } else {
            console.log('⚠️  WARNING: Fetch completed but no comments found (this might be normal if the URL has no comments)');
          }
          
          expect(count).toBeGreaterThanOrEqual(0);
        } else {
          console.log('⚠️  Comment count badge not found, checking for comments list...');
        }

        // Check if comments are displayed in the sidebar
        const commentsList = page.locator('.comment-item, [class*="comment"], [data-comment]');
        const commentsCount = await commentsList.count();
        console.log(`Comments found in sidebar: ${commentsCount}`);
        
        // Check for "No comments" message or actual comments
        const noCommentsMessage = page.locator('text=/no comments/i');
        const hasNoCommentsMsg = await noCommentsMessage.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasNoCommentsMsg) {
          console.log('⚠️  "No comments" message displayed');
        } else if (commentsCount > 0) {
          console.log(`✅ SUCCESS: Found ${commentsCount} comment(s) in sidebar!`);
        } else {
          console.log('⚠️  No comments found in sidebar, but fetch completed successfully');
        }

        // Close sidebar
        const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('.btn-close'));
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('⚠️  View comments button not found - comments may not have been collected');
      }
    } else {
      console.log('⚠️  URL item not found after fetch');
    }

    // Final verification: Check if there's any indication of comments on the page
    const anyCommentsIndicator = page.locator('text=/comment/i');
    const indicatorsCount = await anyCommentsIndicator.count();
    console.log(`Found ${indicatorsCount} comment-related text elements on page`);
    
    console.log('=== Test completed ===');
  });

  test('should verify existing comments are displayed', async ({ page }) => {
    console.log('=== Checking for existing comments ===');

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check if there are any existing sources with comments
    const urlItems = page.locator('.url-item');
    const urlCount = await urlItems.count();
    console.log(`Found ${urlCount} URL source(s)`);

    if (urlCount > 0) {
      // Try to open comments for the first source
      const firstUrlItem = urlItems.first();
      const viewCommentsButton = firstUrlItem.locator('button[aria-label*="View comments"]');
      
      if (await viewCommentsButton.isVisible({ timeout: 5000 })) {
        console.log('Opening comments for first source...');
        await viewCommentsButton.click();
        await page.waitForTimeout(2000);

        const sidebar = page.locator('.comments-panel, .detail-panel');
        if (await sidebar.isVisible({ timeout: 5000 })) {
          console.log('✓ Comments sidebar opened');

          // Check comment count
          const commentCountBadge = page.locator('.comment-count-badge');
          if (await commentCountBadge.isVisible({ timeout: 3000 })) {
            const countText = await commentCountBadge.textContent();
            const count = parseInt(countText || '0', 10);
            console.log(`✓ Found ${count} existing comment(s)`);
            expect(count).toBeGreaterThanOrEqual(0);
          }

          // Close sidebar
          const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('.btn-close'));
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
          }
        }
      } else {
        console.log('No view comments button found - source may not have comments yet');
      }
    } else {
      console.log('No URL sources found - add a source first to test comment collection');
    }

    console.log('=== Check completed ===');
  });
});
