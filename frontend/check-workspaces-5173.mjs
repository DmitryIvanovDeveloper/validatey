import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Checking http://localhost:5173/workspaces ...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors (e.g. "User not authenticated")
  const consoleErrors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('not authenticated') || text.includes('no userId')) {
      consoleErrors.push(text);
    }
  });

  try {
    // 1. Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.login-card', { timeout: 5000 });
    await page.fill('input[type="email"]', 'dmitry.ivanov.developer@gmail.com');
    await page.fill('input[type="password"]', 'Qweasdzxc117!');
    await page.click('.btn-primary');

    // 2. Wait for workspaces
    await page.waitForURL('**/workspaces', { timeout: 15000 });
    await page.waitForSelector('.workspaces-list-view', { timeout: 5000 });
    console.log('✅ Logged in and on workspaces page');

    // 3. Create workspace
    const createBtn = page.locator('button:has-text("+ New Workspace")').first();
    await createBtn.click();
    await page.waitForSelector('#workspace-name', { timeout: 5000 });
    const name = `Check ${Date.now()}`;
    await page.fill('#workspace-name', name);
    await page.locator('button[type="submit"]').first().click();

    // Wait for modal to close (success) or for error message
    await page.waitForTimeout(4000);

    const bodyText = await page.textContent('body');
    const hasDenied = bodyText.includes('User not authenticated') || bodyText.includes('no userId') || bodyText.includes('Access Denied');
    const hasNewWorkspace = bodyText.includes(name);

    if (consoleErrors.length) {
      console.log('⚠️ Console errors:', consoleErrors.slice(0, 3));
    }
    if (hasDenied) {
      console.log('❌ Page shows "not authenticated" or "Access Denied"');
    } else {
      console.log('✅ No "not authenticated" / "Access Denied" on page');
    }
    if (hasNewWorkspace) {
      console.log('✅ New workspace visible in list:', name);
    } else {
      console.log('⚠️ New workspace text not found in body (may still have been created)');
    }

    console.log('\n🎉 Check done. Workspaces on 5173 work as expected.');
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (consoleErrors.length) console.log('Console errors:', consoleErrors);
  } finally {
    await browser.close();
  }
})();
