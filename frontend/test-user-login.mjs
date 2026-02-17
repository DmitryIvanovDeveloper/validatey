import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing login with user credentials...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Opening login page on port 5173...');
    await page.goto('http://localhost:5173/login');

    // Wait for page to load
    await page.waitForSelector('.login-card', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Fill in user credentials
    const email = 'dmitry.ivanov.developer@gmail.com';
    const password = 'Qweasdzxc117!';

    console.log('📝 Filling login form...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    console.log('🔐 Submitting login...');
    await page.click('.btn-primary');

    // Wait for navigation or error
    try {
      await page.waitForURL('**/workspaces', { timeout: 15000 });
      console.log('✅ Successfully logged in and redirected to workspaces');

      // Check current URL
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      // Verify we're on port 5173
      if (currentUrl.includes('localhost:5173')) {
        console.log('✅ Frontend is running on correct port 5173');
      } else {
        console.log('❌ Frontend is not on port 5173:', currentUrl);
      }

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

      // Count existing workspaces
      const workspaceCards = page.locator('.workspace-card').all();
      const cards = await workspaceCards;
      console.log(`📊 Found ${cards.length} workspace(s) in list`);

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
            const newWorkspaceCard = page.locator(`text=${testWorkspaceName}`).first();
            if (await newWorkspaceCard.isVisible()) {
              console.log('✅ New workspace appeared in list');
            } else {
              console.log('⚠️ New workspace may not be visible yet');
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

      // Test logout
      console.log('🚪 Testing logout...');
      if (await signOutBtn.isVisible()) {
        await signOutBtn.click();
        console.log('✅ Sign out button clicked');

        // Wait for redirect to login
        try {
          await page.waitForURL('**/login', { timeout: 5000 });
          console.log('✅ Successfully logged out and redirected to login');
        } catch (error) {
          console.log('⚠️ Did not redirect to login after logout');
        }
      }

    } catch (error) {
      console.log('❌ Login failed or redirect timeout');
      console.log('Current URL:', page.url());

      // Check for error messages
      const errorMsg = await page.locator('.login-error').textContent();
      if (errorMsg) {
        console.log('❌ Login error:', errorMsg.trim());
      } else {
        console.log('❌ No error message found, but login failed');
      }

      // Check if still on login page
      if (page.url().includes('/login')) {
        console.log('⚠️ Still on login page - possible wrong credentials or API issue');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();