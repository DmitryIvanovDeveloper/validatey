import { test, expect } from '@playwright/test';

test.describe('Reset Research Cooldown', () => {
  test('find Give-to-Get Hypothesis project and reset cooldown', async ({ page }) => {
    const testCredentials = {
      email: 'dmitry.ivanov.developer@gmail.com',
      password: 'Qweasdzxc117!',
    };

    // Login
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForLoadState('networkidle');
    }

    console.log('Logged in successfully');

    // Try to navigate to workspaces
    await page.goto('http://localhost:5173/workspaces');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot to see what's there
    await page.screenshot({ path: 'workspaces-page.png', fullPage: true });

    // Look for workspace links
    const workspaceElements = await page.locator('a, [role="link"]').all();
    console.log(`Found ${workspaceElements.length} link elements`);

    let foundProject = false;
    let projectUrl = '';

    // Try different selectors for finding projects
    const selectors = [
      'a[href*="/projects/"]',
      '[data-testid*="project"]',
      '.project-card',
      'a[href*="give"]'
    ];

    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      console.log(`Selector "${selector}": found ${elements.length} elements`);

      for (const element of elements) {
        const text = await element.textContent();
        const href = await element.getAttribute('href');

        if (text && text.toLowerCase().includes('give')) {
          console.log(`Found Give-to-Get project: "${text}"`);
          console.log(`URL: ${href}`);
          foundProject = true;
          projectUrl = href;
          break;
        }
      }

      if (foundProject) break;
    }

    if (!foundProject) {
      // Try to find any project and check if it contains "give" in the name
      console.log('Searching all projects for "give" in name...');

      const allLinks = await page.locator('a').all();
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();

        if (href && href.includes('/projects/') && text && text.toLowerCase().includes('give')) {
          console.log(`Found project with "give": "${text}" -> ${href}`);
          foundProject = true;
          projectUrl = href;
          break;
        }
      }
    }

    if (!foundProject) {
      console.log('Give-to-Get Hypothesis project not found on workspaces page');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'workspaces-debug.png', fullPage: true });

      // List all links on the page
      const allLinks = await page.locator('a').all();
      console.log('All links on page:');
      for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
        const link = allLinks[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`${i + 1}. "${text}" -> ${href}`);
      }

      test.skip();
      return;
    }

    // Extract project ID from URL
    const urlParts = projectUrl.split('/');
    const projectId = urlParts[urlParts.length - 1];
    console.log(`Extracted project ID: ${projectId}`);

    // Navigate to project page
    const fullProjectUrl = `http://localhost:5173${projectUrl}`;
    console.log(`Navigating to project: ${fullProjectUrl}`);

    await page.goto(fullProjectUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if research is on cooldown
    const cooldownIndicator = page.locator('text=/cooldown|Cooldown/i');
    const isOnCooldown = await cooldownIndicator.isVisible();

    if (isOnCooldown) {
      console.log('✅ Project is on cooldown - need to reset');

      // Try to reset via API call
      console.log('Attempting to reset cooldown via API...');

      try {
        // Make API call to reset research status
        const apiResponse = await page.request.put(`http://localhost:8080/api/workspaces/failure-patterns/projects/${projectId}/research/status`, {
          data: { status: 'ready' }
        });

        if (apiResponse.ok()) {
          console.log('✅ Research cooldown reset successfully via API');
        } else {
          console.log(`❌ API call failed: ${apiResponse.status()} ${apiResponse.statusText()}`);
          const errorText = await apiResponse.text();
          console.log(`Error details: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ API call exception: ${error}`);
      }

    } else {
      console.log('ℹ️ Project is not on cooldown');
    }

    // Check Start Research button
    const startResearchButton = page.locator('button').filter({ hasText: /Start Research/i });
    const buttonVisible = await startResearchButton.isVisible();
    const buttonDisabled = await startResearchButton.isDisabled();

    console.log(`Start Research button visible: ${buttonVisible}`);
    console.log(`Start Research button disabled: ${buttonDisabled}`);

    if (buttonDisabled) {
      console.log('❌ Button is still disabled - cooldown not reset');
    } else {
      console.log('✅ Button is enabled - cooldown reset successfully');
    }

    // Take final screenshot
    await page.screenshot({ path: 'project-after-reset.png', fullPage: true });
    console.log('📸 Screenshot saved: project-after-reset.png');
  });
});