import { test, expect } from '@playwright/test';

test.describe('Research Button Text Sequence - Event Driven Flow', () => {
  test.setTimeout(180000); // 3 minutes timeout

  const testCredentials = {
    email: 'dmitry.ivanov.developer@gmail.com',
    password: 'Qweasdzxc117!',
  };

  const testProject = {
    workspaceId: 'failure-patterns',
    projectId: 'ec73391f-6d45-40dc-b80b-6809cfd0cc1d', // Founder Validation Pain Survey
    projectSlug: 'founder-validation-pain-survey',
  };

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Research Button Text Sequence Test ===');
    await page.goto('http://localhost:5173');

    // Check if we're on login page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login') || currentUrl === 'http://localhost:5173/') {
      console.log('On login page, attempting login...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);

      // Click sign in button
      await page.click('button[type="submit"]');
      console.log('Clicked sign in button');

      // Wait for navigation to workspaces
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
      console.log('✓ Successfully logged in and navigated to workspaces');
    } else {
      console.log('Already logged in or on different page');
    }
  });

  test('should find and verify Start Research button exists', async ({ page }) => {
    console.log('=== Test: Find Start Research Button ===');

    // First try the research tab directly
    const researchUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/research`;
    console.log('First trying research tab:', researchUrl);
    await page.goto(researchUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if we have research content
    const hasResearchContent = await page.locator('text=Start Research').isVisible().catch(() => false) ||
                              await page.locator('text=Researching').isVisible().catch(() => false);

    if (!hasResearchContent) {
      console.log('❌ No Start Research button on research tab, trying overview page...');

      // Try overview page instead
      const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
      console.log('Trying overview page:', overviewUrl);
      await page.goto(overviewUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);

      const hasResearchOnOverview = await page.locator('text=Start Research').isVisible().catch(() => false) ||
                                   await page.locator('text=Researching').isVisible().catch(() => false);

      if (!hasResearchOnOverview) {
        console.log('❌ No Start Research button on overview either');

        // Debug: Show page content
        const pageText = await page.textContent('body');
        console.log('Page content (first 500 chars):', pageText?.substring(0, 500));
        console.log('Current URL:', page.url());

        throw new Error('Start Research button not found on either research tab or overview page');
      }

      console.log('✅ Found Start Research button on overview page');
    } else {
      console.log('✅ Found Start Research button on research tab');
    }

    console.log('Current URL:', page.url());

    // Debug: Check page content
    const pageContent = await page.textContent('body');
    console.log('Page contains text (first 200 chars):', pageContent?.substring(0, 200));

    // Debug: Look for any buttons
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Found ${buttonCount} buttons on page`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const buttonText = await allButtons.nth(i).textContent();
      const buttonClass = await allButtons.nth(i).getAttribute('class');
      console.log(`Button ${i}: "${buttonText}" (class: ${buttonClass})`);
    }

    // Wait a bit more for dynamic content to load
    console.log('Waiting for dynamic content to load...');
    await page.waitForTimeout(5000);

    // Try to find the button with multiple approaches
    let startButton = null;

    // First, try to find by text content
    try {
      startButton = page.locator('button').filter({ hasText: 'Start Research' }).first();
      await expect(startButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Found button by text "Start Research"');
    } catch {
      try {
        startButton = page.locator('button').filter({ hasText: 'Researching' }).first();
        await expect(startButton).toBeVisible({ timeout: 5000 });
        console.log('✅ Found button by text "Researching"');
      } catch {
        // Try by class
        try {
          startButton = page.locator('.btn-research-primary').first();
          await expect(startButton).toBeVisible({ timeout: 5000 });
          console.log('✅ Found button by class ".btn-research-primary"');
        } catch {
          console.log('❌ Could not find Start Research button');

          // Debug: Show all buttons with more detail
          const allButtons = page.locator('button');
          const buttonCount = await allButtons.count();
          console.log(`Found ${buttonCount} buttons total:`);

          for (let i = 0; i < buttonCount; i++) {
            const button = allButtons.nth(i);
            const text = await button.textContent();
            const className = await button.getAttribute('class');
            const isVisible = await button.isVisible();
            console.log(`  Button ${i}: text="${text}", class="${className}", visible=${isVisible}`);
          }

          throw new Error('Start Research button not found on research page');
        }
      }
    }

    console.log('🎉 Successfully found Start Research button!');

    // Verify the button text
    const buttonText = await startButton.textContent();
    console.log(`Button text: "${buttonText}"`);

    expect(buttonText?.trim()).toBe('Start Research');
  });

  test('should show correct button text sequence: Collecting comments → Researching... (Comments loading...) → Researching...', async ({ page }) => {
    console.log('=== Test: Button Text Sequence ===');

    // Navigate to project overview page (where Start Research button is located)
    const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
    console.log('Navigating to project overview:', overviewUrl);
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for data to load
    console.log('✓ Navigated to project overview, current URL:', page.url());

    // Find the Start Research button
    const startButton = page.locator('button').filter({ hasText: 'Start Research' }).first();
    await expect(startButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Found Start Research button');

    // Verify initial button text
    const initialText = await startButton.textContent();
    console.log(`Initial button text: "${initialText}"`);
    expect(initialText?.trim()).toBe('Start Research');

    // Click the Start Research button
    console.log('🚀 Clicking Start Research button...');
    await startButton.click();

    // Debug: Wait a moment and check button text immediately after click
    await page.waitForTimeout(1000);
    const buttonAfterClick = page.locator('.btn-research-primary').first();
    const textAfterClick = await buttonAfterClick.textContent();
    console.log(`📝 Button text immediately after click: "${textAfterClick}"`);

    // Check if there are any comments widgets on the page
    const commentsWidgets = page.locator('[class*="comments"], [class*="comment"]');
    const commentsCount = await commentsWidgets.count();
    console.log(`📝 Found ${commentsCount} comments-related elements on page`);

    // After click, we need to find the button again as text changes
    const dynamicButton = page.locator('.btn-research-primary').first();

    // Step 1: Should show "Collecting comments..." first
    console.log('⏳ Waiting for "Collecting comments..." text...');
    try {
      await expect(dynamicButton).toContainText('Collecting comments', { timeout: 15000 });
      console.log('✅ Button text contains "Collecting comments"');
    } catch (error) {
      console.log('❌ "Collecting comments" text not found, checking current button text...');
      const currentText = await dynamicButton.textContent();
      console.log(`📝 Current button text: "${currentText}"`);
      throw error;
    }

    // Step 2: Should show "Researching... (Comments loading...)" after comments start loading
    console.log('⏳ Waiting for "Researching... (Comments loading...)" text...');
    await expect(dynamicButton).toContainText('Researching', { timeout: 30000 });
    await expect(dynamicButton).toContainText('Comments loading', { timeout: 30000 });
    console.log('✅ Button text contains "Researching" and "Comments loading"');

    // Step 3: Should eventually show just "Researching..." when comments are done
    console.log('⏳ Waiting for final "Researching..." text...');
    // Wait for the button to eventually show just "Researching..." (without "Comments loading")
    await page.waitForFunction(
      () => {
        const button = document.querySelector('.btn-research-primary');
        return button && button.textContent?.includes('Researching') &&
               !button.textContent?.includes('Comments loading');
      },
      { timeout: 60000 }
    );
    console.log('✅ Button text changed to final "Researching..." (without "Comments loading")');

    // Wait a bit more to ensure the process completes
    await page.waitForTimeout(5000);

    console.log('🎉 Button text sequence test completed successfully!');
    console.log('✅ Verified: Collecting comments → Researching... (Comments loading...) → Researching...');
  });

  test('should handle disabled state correctly during research process', async ({ page }) => {
    console.log('=== Test: Button Disabled State During Research ===');

    // Navigate to research tab
    const researchUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/research`;
    await page.goto(researchUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the Start Research button
    const startButton = page.locator('.btn-research-primary').first();
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await expect(startButton).not.toBeDisabled();

    // Click the button
    await startButton.click();

    // Button should become disabled during research
    await expect(startButton).toBeDisabled({ timeout: 15000 });
    console.log('✅ Button is disabled during research process');

    // Wait for research to complete
    await expect(startButton).toHaveText('Researching...', { timeout: 60000 });
    await page.waitForTimeout(10000); // Wait a bit more

    // Button should become enabled again (assuming research completes)
    // Note: This might not happen if there are cooldowns, but let's check
    console.log('ℹ️ Research process completed, button state may vary based on cooldowns');
  });
});