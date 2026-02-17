import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing auth guard...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Opening http://localhost:5175/workspaces without auth...');
    await page.goto('http://localhost:5175/workspaces');

    // Wait for potential redirect
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('✅ SUCCESS: Redirected to login page as expected');
    } else if (currentUrl.includes('/workspaces')) {
      console.log('❌ FAIL: Stayed on workspaces page - auth guard not working');
    } else {
      console.log('⚠️ UNEXPECTED: Redirected to', currentUrl);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();