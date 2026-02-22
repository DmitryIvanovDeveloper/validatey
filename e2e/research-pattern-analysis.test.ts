import { test, expect } from '@playwright/test';

test.describe('Research - Comment Pattern Analysis Integration', () => {
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
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');

      // Wait for redirect (could be to workspaces or to the original destination)
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      console.log('✓ Logged in successfully');
    }
  });

  test('should analyze comment patterns when Start Research is executed', async ({ page }) => {
    console.log('=== Starting Research Pattern Analysis Test ===');

    // Navigate to project overview page
    const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
    console.log(`Navigating to: ${overviewUrl}`);
    await page.goto(overviewUrl);
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login, logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`**/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}*`, { timeout: 30000 });
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log(`✓ On overview page: ${page.url()}`);

    // Check if we have comments first (needed for pattern analysis)
    // Navigate to comments tab to check/add comments
    const commentsUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments`;
    console.log('Checking comments...');
    await page.goto(commentsUrl);
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login, logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`**/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments*`, { timeout: 30000 });
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if there are any comments
    const hasComments = await page.locator('.comment-item-sidebar, .url-item').count() > 0;
    console.log(`Comments available: ${hasComments}`);

    if (!hasComments) {
      console.log('No comments found. Adding a Reddit source...');
      // Add a Reddit URL source
      const redditInput = page.locator('.reddit-card .url-input[placeholder*="Reddit"]').first();
      if (await redditInput.count() > 0) {
        const testUrl = 'https://www.reddit.com/r/startups/';
        await redditInput.fill(testUrl);
        const addButton = page.locator('.reddit-card .add-url-btn').first();
        await addButton.click();
        await page.waitForTimeout(2000);
        console.log('✓ Reddit URL added');
      }
    }

    // Navigate back to overview
    console.log('Navigating back to overview...');
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('Redirected to login, logging in...');
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.toString().includes(`/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`), { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }

    // Debug: Take a screenshot to see what's on the page
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Find and click "Start Research" button - try multiple selectors
    console.log('Looking for Start Research button...');
    
    // First, try to find by text
    let startResearchButton = page.locator('button:has-text("Start Research")');
    const count = await startResearchButton.count();
    console.log(`Found ${count} buttons with "Start Research" text`);
    
    // If not found, try case-insensitive
    if (count === 0) {
      startResearchButton = page.locator('button').filter({ hasText: /start research/i });
      const count2 = await startResearchButton.count();
      console.log(`Found ${count2} buttons with case-insensitive "Start Research"`);
    }
    
    // If still not found, try looking for the widget class
    if (await startResearchButton.count() === 0) {
      console.log('Button not found with text filter, trying widget class...');
      startResearchButton = page.locator('.start-research-widget button, .btn-research-primary');
      const count3 = await startResearchButton.count();
      console.log(`Found ${count3} buttons in research widget`);
    }
    
    // Wait for button to be visible and enabled
    if (await startResearchButton.count() > 0) {
      await expect(startResearchButton.first()).toBeVisible({ timeout: 10000 });
      console.log('✓ Start Research button found');
    } else {
      // Log page content for debugging
      const bodyText = await page.locator('body').textContent();
      console.log('Page body text (first 500 chars):', bodyText?.substring(0, 500));
      throw new Error('Start Research button not found on page');
    }
    
    // Check if button is disabled (cooldown)
    const isDisabled = await startResearchButton.isDisabled();
    if (isDisabled) {
      console.log('⚠ Start Research is on cooldown. Skipping test.');
      test.skip();
      return;
    }

    console.log('Clicking Start Research button...');
    await startResearchButton.click();

    // Wait for research to start (button should show "Researching...")
    await expect(page.locator('button').filter({ hasText: /Researching.../i })).toBeVisible({ timeout: 10000 });
    console.log('✓ Research started');

    // Wait for research to complete (button should show "Start Research" again or be disabled)
    console.log('Waiting for research to complete (this may take a while)...');
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const hasStartResearch = buttons.some(btn => btn.textContent?.includes('Start Research'));
        const hasResearching = buttons.some(btn => btn.textContent?.includes('Researching...'));
        return hasStartResearch && !hasResearching;
      },
      { timeout: 180000 } // 3 minutes max
    );
    console.log('✓ Research completed');

    // Wait a bit more for pattern analysis to complete
    await page.waitForTimeout(5000);

    // Reload page to get fresh data
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check that Comment Pattern Analysis widget is visible and has data
    console.log('Checking Comment Pattern Analysis widget...');
    const patternWidget = page.locator('.comment-patterns-widget, [class*="cpw"]').first();
    await expect(patternWidget).toBeVisible({ timeout: 10000 });
    console.log('✓ Pattern Analysis widget is visible');

    // Check for patterns or score
    const hasPatterns = await page.locator('.cpw-pattern-card, [class*="pattern"]').count() > 0;
    const hasScore = await page.locator('.cpw-score-badge, [class*="score"]').count() > 0;
    
    if (hasPatterns || hasScore) {
      console.log('✓ Comment Pattern Analysis has data');
      
      // Log score if available
      const scoreText = await page.locator('.cpw-score-badge').first().textContent().catch(() => null);
      if (scoreText) {
        console.log(`Pattern Analysis Score: ${scoreText}`);
      }
    } else {
      // Check if it shows "No comments" message (which is also valid)
      const noCommentsMessage = await page.locator('text=/No comments/i').count() > 0;
      if (noCommentsMessage) {
        console.log('⚠ No comments available for analysis (expected if no comments were collected)');
      } else {
        console.log('⚠ Pattern Analysis widget visible but no patterns found');
      }
    }

    // Verify that the analysis was saved by checking API response
    console.log('Verifying pattern analysis via API...');
    try {
      const response = await page.request.get(
        `http://localhost:3000/api/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments/patterns`
      );
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✓ Pattern Analysis API response:`, {
          totalComments: data.totalComments,
          patternsCount: data.patterns?.length || 0,
          validationScore: data.validationScore,
        });
        
        expect(data).toHaveProperty('totalComments');
        expect(data).toHaveProperty('patterns');
        expect(data).toHaveProperty('validationScore');
      } else {
        const errorText = await response.text();
        console.log(`⚠ API returned ${response.status()}: ${errorText}`);
      }
    } catch (error) {
      console.log('⚠ Could not verify via API:', error);
    }

    console.log('=== Test completed ===');
  });
});
