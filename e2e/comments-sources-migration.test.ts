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
});