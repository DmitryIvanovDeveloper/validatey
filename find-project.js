// Script to find Give-to-Get Hypothesis project
const puppeteer = require('playwright');

async function findProject() {
  const browser = await puppeteer.chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/login')) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', 'dmitry.ivanov.developer@gmail.com');
      await page.fill('input[type="password"]', 'Qweasdzxc117!');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30000 });
    }

    // Navigate to workspaces
    await page.goto('http://localhost:5173/workspaces');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for workspaces
    const workspaceLinks = await page.locator('a[href*="/workspaces/"]').all();
    console.log(`Found ${workspaceLinks.length} workspace links`);

    for (const link of workspaceLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      console.log(`Workspace: ${text} -> ${href}`);
    }

    // Try to find Give-to-Get project in the first workspace
    if (workspaceLinks.length > 0) {
      const firstWorkspaceHref = await workspaceLinks[0].getAttribute('href');
      console.log(`Checking workspace: ${firstWorkspaceHref}`);

      await page.goto(`http://localhost:5173${firstWorkspaceHref}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for project cards
      const projectCards = await page.locator('[data-testid="project-card"], .project-card, a[href*="/projects/"]').all();
      console.log(`Found ${projectCards.length} project elements`);

      for (const card of projectCards) {
        const text = await card.textContent();
        const href = await card.getAttribute('href');

        if (text && text.toLowerCase().includes('give')) {
          console.log(`Found Give-to-Get project: ${text}`);
          console.log(`URL: ${href}`);

          // Extract project ID from URL
          const urlParts = href.split('/');
          const projectId = urlParts[urlParts.length - 1];
          console.log(`Project ID: ${projectId}`);

          return projectId;
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }

  console.log('Give-to-Get Hypothesis project not found');
  return null;
}

findProject();