const { chromium } = require('playwright');

async function testLandingPreview() {
  console.log('Testing landing preview...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // First, test the iframe directly
    console.log('Testing iframe content directly...');
    await page.goto('http://localhost:8080/l/project-44f2f181/');

    const title = await page.locator('title').textContent();
    console.log('Direct iframe title:', title);

    const h1 = await page.locator('h1').textContent();
    console.log('Direct iframe H1:', h1);

    const ctaButton = page.locator('.cta-button');
    const buttonText = await ctaButton.textContent();
    console.log('Direct iframe CTA:', buttonText);

    // Now test the project page
    console.log('\nOpening project page...');
    await page.goto('http://localhost:5173/workspaces/023fc4d2-e85a-4c22-ae5b-ad10c473e8c3/projects/44f2f181-0f5c-40f4-b707-00a145daed41/landing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page content
    const pageTitle = await page.title();
    console.log('Project page title:', pageTitle);

    // Look for any iframes
    const iframes = page.locator('iframe');
    const iframeCount = await iframes.count();
    console.log('Number of iframes on page:', iframeCount);

    if (iframeCount > 0) {
      for (let i = 0; i < iframeCount; i++) {
        const src = await iframes.nth(i).getAttribute('src');
        console.log(`Iframe ${i} src:`, src);
      }
    }

    // Look for landing-related elements
    const landingElements = page.locator('[class*="landing"], [class*="preview"]');
    const landingCount = await landingElements.count();
    console.log('Landing-related elements:', landingCount);

    // Check page HTML for any landing content
    const pageContent = await page.content();
    const hasLanding = pageContent.includes('ProjectLandingWidget') || pageContent.includes('landing-preview');
    console.log('Page contains landing HTML:', hasLanding);

    // Check for Vue components
    const vueComponents = page.locator('[data-v-], [class*="vue"]');
    const vueCount = await vueComponents.count();
    console.log('Vue components found:', vueCount);

    // Check for error messages
    const errorElements = page.locator('[class*="error"], .text-red-500, .text-red-600');
    const errorCount = await errorElements.count();
    console.log('Error elements:', errorCount);

    if (errorCount > 0) {
      const errorText = await errorElements.first().textContent();
      console.log('Error text:', errorText);
    }

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000); // Wait a bit for any async errors

    if (errors.length > 0) {
      console.log('Console errors:', errors.slice(0, 3));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testLandingPreview();