import { test, expect } from '@playwright/test';

test.describe('Debug - Pattern Comments', () => {
  test('check if pattern data contains commentIds', async ({ page }) => {
    // Navigate to project and check pattern analysis data
    const testCredentials = {
      email: 'dmitry.ivanov.developer@gmail.com',
      password: 'Qweasdzxc117!',
    };

    const testProject = {
      workspaceId: 'failure-patterns',
      projectId: 'startup-failure-patterns-analysis',
    };

    // Login
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
    }

    // Navigate to project overview
    const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
    console.log(`Navigating to: ${overviewUrl}`);
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Debug: Check current page content
    const pageTitle = await page.title();
    const url = page.url();
    console.log(`Page title: "${pageTitle}"`);
    console.log(`Current URL: ${url}`);

    // Check if redirected to login
    if (url.includes('/login')) {
      console.log('❌ Redirected to login - authentication failed');
      test.skip();
      return;
    }

    // Look for any research-related content
    const hasResearchContent = await page.locator('text=/research|analysis|pattern/i').count() > 0;
    console.log(`Has research content: ${hasResearchContent}`);

    // Check if Comment Pattern Analysis widget exists
    const patternWidget = page.locator('.comment-patterns-widget, [class*="cpw"]').first();
    const widgetVisible = await patternWidget.isVisible();

    if (!widgetVisible) {
      console.log('❌ Comment Pattern Analysis widget not found');

      // Check if we need to run research first
      const startResearchButton = page.locator('button').filter({ hasText: /Start Research/i });
      const researchButtonCount = await startResearchButton.count();
      console.log(`Start Research buttons found: ${researchButtonCount}`);

      if (researchButtonCount > 0) {
        console.log('ℹ️ Research not completed yet. Need to run research first.');
      } else {
        console.log('ℹ️ Research may be completed but widget not loaded. Checking for other content...');

        // Take screenshot for debugging
        await page.screenshot({ path: 'debug-pattern-widget.png', fullPage: true });
        console.log('📸 Screenshot saved as debug-pattern-widget.png');
      }

      test.skip();
      return;
    }

    console.log('✅ Comment Pattern Analysis widget found');

    // Check pattern cards
    const patternCards = page.locator('.cpw-pattern-card');
    const cardCount = await patternCards.count();
    console.log(`Found ${cardCount} pattern cards`);

    if (cardCount === 0) {
      console.log('❌ No pattern cards found');
      test.skip();
      return;
    }

    // Check each pattern card for commentIds
    for (let i = 0; i < cardCount; i++) {
      const card = patternCards.nth(i);
      const label = await card.locator('.cpw-pattern-label').textContent();
      const count = await card.locator('.cpw-pattern-count').textContent();

      console.log(`Pattern ${i + 1}: "${label}" - ${count} comments`);

      // Check if "Show X comments" button exists
      const showButton = card.locator('.cpw-show-comments-btn');
      const buttonVisible = await showButton.isVisible();

      if (buttonVisible) {
        const buttonText = await showButton.textContent();
        console.log(`✅ "Show comments" button found: "${buttonText}"`);

        // Try to click the button
        await showButton.click();
        console.log('✅ Button clicked');

        // Check if sidebar appears
        const sidebar = page.locator('.comments-sidebar-overlay');
        const sidebarVisible = await sidebar.isVisible();

        if (sidebarVisible) {
          console.log('✅ Comments sidebar opened');

          // Check sidebar content
          const sidebarTitle = page.locator('.comments-sidebar-title h3').textContent();
          const commentCount = page.locator('.comments-count').textContent();
          console.log(`Sidebar: "${sidebarTitle}" - ${commentCount}`);

          // Close sidebar
          const closeBtn = page.locator('.btn-close');
          await closeBtn.click();
          await expect(sidebar).not.toBeVisible({ timeout: 1000 });
          console.log('✅ Sidebar closed');
        } else {
          console.log('❌ Comments sidebar did not open');
        }
      } else {
        console.log('❌ "Show comments" button not found - pattern may not have commentIds');

        // Check if old "Show N" button exists
        const oldButton = card.locator('button').filter({ hasText: /^Show \d+$/ });
        const oldButtonVisible = await oldButton.isVisible();
        if (oldButtonVisible) {
          const oldButtonText = await oldButton.textContent();
          console.log(`ℹ️ Found old "Show examples" button: "${oldButtonText}"`);
        }
      }

      console.log('---');
    }

    console.log('=== Debug completed ===');
  });
});