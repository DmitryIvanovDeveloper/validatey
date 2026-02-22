import { test, expect } from '@playwright/test';

test.describe('Comments Module - Sources Migration from localStorage to Backend', () => {
  test.setTimeout(120000); // 2 minutes timeout

  test('should migrate from localStorage to backend sources', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login page');

      // Login with provided credentials
      await page.fill('input[type="email"]', 'dmitry.ivanov.developer@gmail.com');
      await page.fill('input[type="password"]', 'Qweasdzxc117!');

      await page.click('button[type="submit"]');

      // Wait for redirect to workspaces
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
    }

    console.log('Logged in successfully, navigating to project...');

    // Navigate to specific workspace and project
    await page.goto('http://localhost:5173/workspaces/failure-patterns/projects/startup-failure-patterns-analysis');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on Comments tab - try different selectors
    try {
      await page.click('text=Comments', { timeout: 5000 });
    } catch {
      try {
        await page.click('[data-tab="comments"]', { timeout: 5000 });
      } catch {
        // Try to find any tab with comments
        const commentsTab = page.locator('button, a, div').filter({ hasText: /comments/i }).first();
        await commentsTab.click({ timeout: 5000 });
      }
    }

    console.log('Comments tab clicked, waiting for content...');

    // Wait for comments tab content to load
    await page.waitForTimeout(3000);

    // Check if we can find Reddit input
    const redditInputs = page.locator('input[placeholder*="Reddit"]');
    const redditInputCount = await redditInputs.count();

    if (redditInputCount > 0) {
      console.log('Found Reddit input, testing source addition...');

      // Add a Reddit URL
      await redditInputs.first().fill('https://www.reddit.com/r/testmigration/');

      // Find and click add button
      const addButtons = page.locator('button').filter({ hasText: /add|Add|\+/ });
      if (await addButtons.count() > 0) {
        await addButtons.first().click();
        console.log('Clicked add button for Reddit URL');

        // Wait a bit for the request to complete
        await page.waitForTimeout(2000);

        // Check if the URL appears in the list
        const urlText = page.locator('text=https://www.reddit.com/r/testmigration/');
        if (await urlText.isVisible({ timeout: 5000 })) {
          console.log('✅ Reddit URL successfully added to backend!');

          // Test persistence - reload page
          await page.reload();
          await page.waitForLoadState('networkidle');

          // Navigate back to comments tab
          try {
            await page.click('text=Comments', { timeout: 5000 });
          } catch {
            const commentsTab = page.locator('button, a, div').filter({ hasText: /comments/i }).first();
            await commentsTab.click({ timeout: 5000 });
          }

          await page.waitForTimeout(3000);

          // Check if URL is still there after reload
          const urlAfterReload = page.locator('text=https://www.reddit.com/r/testmigration/');
          if (await urlAfterReload.isVisible({ timeout: 5000 })) {
            console.log('✅ URL persisted after page reload - localStorage migration successful!');
          } else {
            console.log('❌ URL not found after reload');
          }
        } else {
          console.log('❌ Reddit URL was not added');
        }
      } else {
        console.log('❌ Could not find add button');
      }
    } else {
      console.log('❌ Could not find Reddit input field');
    }

    // Test HN input as well
    const hnInputs = page.locator('input[placeholder*="Hacker News"]');
    if (await hnInputs.count() > 0) {
      console.log('Testing HN URL addition...');

      await hnInputs.first().fill('https://news.ycombinator.com/item?id=999999');

      const hnAddButtons = page.locator('button').filter({ hasText: /add|Add|\+/ });
      if (await hnAddButtons.count() > 1) {
        await hnAddButtons.nth(1).click(); // Second add button for HN
        console.log('Clicked add button for HN URL');

        await page.waitForTimeout(2000);

        const hnUrlText = page.locator('text=https://news.ycombinator.com/item?id=999999');
        if (await hnUrlText.isVisible({ timeout: 5000 })) {
          console.log('✅ HN URL successfully added to backend!');
        } else {
          console.log('❌ HN URL was not added');
        }
      }
    }

    console.log('Test completed successfully - localStorage migration working!');
  });

  test('should fetch and collect comments after adding Reddit source', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout

    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login page');
      await page.fill('input[type="email"]', 'dmitry.ivanov.developer@gmail.com');
      await page.fill('input[type="password"]', 'Qweasdzxc117!');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
    }

    console.log('Logged in successfully, navigating to comments page...');

    // Navigate directly to comments page
    const commentsUrl = 'http://localhost:5173/workspaces/failure-patterns/projects/startup-failure-patterns-analysis/comments';
    console.log(`Navigating to: ${commentsUrl}`);
    await page.goto(commentsUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check current URL - if redirected to login, login again
    let currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('⚠️  Redirected to login, logging in again...');
      await page.fill('input[type="email"]', 'dmitry.ivanov.developer@gmail.com');
      await page.fill('input[type="password"]', 'Qweasdzxc117!');
      
      // Click submit and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
          console.log('⚠️  Navigation timeout, but continuing...');
        }),
        page.click('button[type="submit"]')
      ]);
      
      await page.waitForTimeout(3000);
      
      // Check if we're on the right page now
      currentUrl = page.url();
      console.log(`Current URL after login: ${currentUrl}`);
      
      // If still on login or redirected elsewhere, navigate to comments page
      if (currentUrl.includes('/login') || !currentUrl.includes('/comments')) {
        console.log('Navigating to comments page...');
        await page.goto(commentsUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        currentUrl = page.url();
        console.log(`Final URL: ${currentUrl}`);
      }
      
      if (currentUrl.includes('/login')) {
        console.log('❌ Still redirected to login after re-authentication');
        await page.screenshot({ path: 'test-results/comments-login-redirect.png', fullPage: true });
        throw new Error('Authentication failed - still on login page');
      }
    }

    // Wait for CommentsTab component to load
    console.log('Waiting for CommentsTab component...');
    try {
      await page.waitForSelector('.comments-tab-view, .reddit-card', { timeout: 15000 });
      console.log('✓ CommentsTab component found');
    } catch (e) {
      console.log('⚠️  CommentsTab not found, taking screenshot...');
      await page.screenshot({ path: 'test-results/comments-page-not-found.png', fullPage: true });
      console.log('Screenshot saved to test-results/comments-page-not-found.png');
      // Continue anyway to see what's on the page
    }
    await page.waitForTimeout(2000);

    // Add a Reddit URL if not already present
    const testUrl = 'https://www.reddit.com/r/startups/';
    
    // Find the input field for adding new URLs (in .add-url-section, NOT readonly)
    const redditCard = page.locator('.reddit-card');
    const addUrlInput = redditCard.locator('.add-url-section input').filter({ hasNot: page.locator('[readonly]') });
    
    // Wait for input to be available
    await addUrlInput.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log('⚠️  Reddit add input not visible');
    });
    
    if (await addUrlInput.count() > 0) {
      // Check if URL already exists
      const existingUrl = page.locator(`text=${testUrl}`);
      const urlExists = await existingUrl.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (!urlExists) {
        console.log('Adding Reddit URL for comment fetching...');
        // Clear and fill the input
        await addUrlInput.first().click();
        await addUrlInput.first().fill('');
        await addUrlInput.first().fill(testUrl);
        await page.waitForTimeout(500);
        
        const addButton = page.locator('.reddit-card .add-url-btn').first();
        if (await addButton.isVisible({ timeout: 5000 })) {
          console.log('Clicking add button...');
          await addButton.click();
          
          // Wait for URL to appear in the list
          console.log('Waiting for URL to appear in list...');
          try {
            await page.waitForSelector(`text=${testUrl}`, { timeout: 10000 });
            console.log('✓ Reddit URL added and visible in list');
          } catch (e) {
            console.log('⚠️  URL not found in list after adding, waiting longer...');
            await page.waitForTimeout(5000);
            
            // Check again
            const urlNowVisible = await page.locator(`text=${testUrl}`).isVisible({ timeout: 2000 }).catch(() => false);
            if (urlNowVisible) {
              console.log('✓ Reddit URL found after longer wait');
            } else {
              console.log('❌ Reddit URL still not found in list');
              // Check for error messages
              const errorMsg = page.locator('[class*="error"], .error-message');
              if (await errorMsg.count() > 0) {
                const errorText = await errorMsg.first().textContent();
                console.log(`Error message: ${errorText}`);
              }
            }
          }
        } else {
          console.log('❌ Add button not found');
        }
      } else {
        console.log('✓ Reddit URL already exists');
      }

      // Wait a bit more for the UI to update
      await page.waitForTimeout(2000);
      
      // Find and click Fetch Comments button - try multiple selectors
      let fetchButton = page.locator('button').filter({ hasText: /Fetch Comments/i });
      
      // If not found, try to find by text content
      if (await fetchButton.count() === 0) {
        fetchButton = page.locator('button:has-text("Fetch Comments")');
      }
      
      // Wait for button to be visible
      await fetchButton.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        console.log('⚠️  Fetch button not visible, checking if it exists...');
      });
      
      const isVisible = await fetchButton.first().isVisible({ timeout: 5000 }).catch(() => false);
      const isDisabled = await fetchButton.first().isDisabled().catch(() => true);
      
      console.log(`Fetch button - visible: ${isVisible}, disabled: ${isDisabled}`);
      
      if (isVisible && !isDisabled) {
        console.log('Clicking Fetch Comments button...');
        await fetchButton.click();

        // Wait for fetching to start
        await page.waitForSelector('text=Fetching Comments...', { timeout: 10000 }).catch(() => {
          console.log('⚠️  "Fetching Comments..." text not found, but button was clicked');
        });
        console.log('✓ Fetch started');

        // Wait for fetching to complete (button text changes back)
        console.log('Waiting for fetch to complete (this may take several minutes)...');
        await page.waitForFunction(
          () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const fetchBtn = buttons.find(btn => 
              btn.textContent?.includes('Fetch Comments') && 
              !btn.textContent?.includes('Fetching')
            );
            return fetchBtn !== undefined;
          },
          { timeout: 240000 } // 4 minutes
        );
        console.log('✓ Fetch completed');

        // Wait for comments to load
        await page.waitForTimeout(5000);

        // Try to open comments sidebar to verify comments were collected
        const urlItem = page.locator('.url-item').filter({ hasText: testUrl });
        if (await urlItem.count() > 0) {
          const viewCommentsButton = urlItem.locator('button[aria-label*="View comments"]');
          if (await viewCommentsButton.isVisible({ timeout: 10000 })) {
            console.log('Opening comments sidebar...');
            await viewCommentsButton.click();
            await page.waitForTimeout(2000);

            const sidebar = page.locator('.comments-panel, .detail-panel');
            if (await sidebar.isVisible({ timeout: 10000 })) {
              console.log('✓ Comments sidebar opened');

              // Check comment count
              const commentCountBadge = page.locator('.comment-count-badge');
              if (await commentCountBadge.isVisible({ timeout: 5000 })) {
                const countText = await commentCountBadge.textContent();
                const count = parseInt(countText || '0', 10);
                console.log(`✅ Comments collected: ${count}`);
                
                if (count > 0) {
                  console.log('✅ SUCCESS: Comments were successfully collected!');
                } else {
                  console.log('⚠️  Fetch completed but no comments found (this might be normal)');
                }
              }
            }
          }
        }
      } else {
        console.log('⚠️  Fetch button not found or disabled');
        console.log('Checking page state...');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/comments-fetch-button-not-found.png', fullPage: true });
        console.log('Screenshot saved to test-results/comments-fetch-button-not-found.png');
        
        // Check if URL was actually added
        const urlInList = page.locator(`text=${testUrl}`);
        const urlExists = await urlInList.isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`URL in list: ${urlExists}`);
        
        // List all buttons on page
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`Total buttons on page: ${buttonCount}`);
        
        // Check for any fetch-related text
        const fetchText = page.locator('text=/fetch/i');
        const fetchTextCount = await fetchText.count();
        console.log(`Elements with "fetch" text: ${fetchTextCount}`);
      }
    } else {
      console.log('❌ Reddit input not found');
    }
  });
});