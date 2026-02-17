import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing login and workspaces functionality...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Opening login page...');
    await page.goto('http://localhost:5175/login');

    // Wait for page to load
    await page.waitForSelector('.login-card', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Fill in credentials - using test credentials from test-session.js
    const email = 'test@example.com';
    const password = 'password123';

    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    console.log('🔐 Submitting login...');
    await page.click('.btn-primary');

    // Wait for navigation or error
    try {
      await page.waitForURL('**/workspaces', { timeout: 15000 });
      console.log('✅ Successfully logged in and redirected to workspaces');

      // Check if workspaces page loaded
      await page.waitForSelector('.workspaces-list-view', { timeout: 10000 });
      console.log('✅ Workspaces page loaded successfully');

      // Check if user info is displayed in header
      const userBadge = await page.locator('.user-badge').first();
      if (await userBadge.isVisible()) {
        const userName = await userBadge.locator('.user-name').textContent();
        console.log('✅ User info visible in header:', userName?.trim());
      } else {
        console.log('❌ User info not found in header');
      }

      // Check if sign out button exists
      const signOutBtn = await page.locator('button:has-text("Sign out")').first();
      if (await signOutBtn.isVisible()) {
        console.log('✅ Sign out button visible');
      } else {
        console.log('❌ Sign out button not found');
      }

      // Try to create a new workspace
      console.log('📁 Testing workspace creation...');
      const createButton = page.locator('button:has-text("+ New Workspace")').or(page.locator('button:has-text("Create workspace")'));
      if (await createButton.isVisible()) {
        await createButton.click();
        console.log('✅ Create workspace button clicked');

        // Wait for modal to appear
        await page.waitForSelector('#workspace-name', { timeout: 5000 });

        // Fill workspace name
        const nameInput = page.locator('#workspace-name');
        if (await nameInput.isVisible()) {
          const testWorkspaceName = `Test Workspace ${Date.now()}`;
          await nameInput.fill(testWorkspaceName);
          console.log('✅ Filled workspace name:', testWorkspaceName);

          // Try to submit
          const submitButton = page.locator('button[type="submit"]').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            console.log('✅ Submitted workspace creation');

            // Wait for modal to close and check if workspace appears
            await page.waitForTimeout(3000);
            const workspaceCard = page.locator(`text=${testWorkspaceName}`).first();
            if (await workspaceCard.isVisible()) {
              console.log('✅ New workspace appeared in list');
            } else {
              console.log('⚠️ New workspace may not be visible yet, checking page content...');
              const pageContent = await page.textContent('body');
              if (pageContent.includes(testWorkspaceName)) {
                console.log('✅ Workspace name found in page content');
              } else {
                console.log('❌ Workspace name not found anywhere');
              }
            }
          } else {
            console.log('❌ Submit button not found');
          }
        } else {
          console.log('❌ Workspace name input not found');
        }
      } else {
        console.log('❌ Create workspace button not found');
      }

      // Test workspace opening UI
      console.log('📁 Testing workspace opening UI...');
      const workspaceCards = page.locator('.workspace-card').all();
      const cards = await workspaceCards;
      if (cards.length > 0) {
        console.log(`✅ Found ${cards.length} workspace(s) in list`);

        // Check if Open button exists on first workspace
        const openButton = cards[0].locator('button:has-text("Open")').first();
        if (await openButton.isVisible()) {
          console.log('✅ Open button visible on first workspace');
          // Don't actually click it in automated test to avoid navigation issues
        } else {
          console.log('❌ Open button not found on workspace');
        }
      } else {
        console.log('ℹ️ No workspaces found in list');
      }

    } catch (error) {
      console.log('❌ Login failed or redirect timeout');
      console.log('Current URL:', page.url());

      // Check for error messages
      const errorMsg = await page.locator('.login-error').textContent();
      if (errorMsg) {
        console.log('❌ Login error:', errorMsg);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();