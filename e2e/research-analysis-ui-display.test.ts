import { test, expect } from '@playwright/test';

test.describe('Research Analysis UI Display - Trinity Showcase', () => {
  test.setTimeout(300000); // 5 minutes timeout

  const testCredentials = {
    email: 'dmitry.ivanov.developer@gmail.com',
    password: 'Qweasdzxc117!',
  };

  const testProject = {
    workspaceId: '023fc4d2-e85a-4c22-ae5b-ad10c473e8c3',
    projectId: '44f2f181-0f5c-40f4-b707-00a145daed41', // Trinity Showcase
    projectSlug: 'trinity-showcase',
  };

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Research Analysis UI Display Test ===');
    await page.goto('http://localhost:5173');
    
    // Login if needed
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
    }
  });

  test('should display synthesis report and assumption assessments in UI after analysis', async ({ page }) => {
    console.log('=== Test: Verify UI Display of Analysis Results ===');
    
    // Navigate to project overview
    const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✓ Navigated to project overview');

    // Step 1: Verify Executive Summary is displayed
    console.log('\n--- Step 1: Verify Executive Summary ---');
    
    // Wait for page to fully load and data to be fetched
    await page.waitForTimeout(5000);
    
    // Try multiple selectors for Executive Summary
    const executiveSummary = page.locator('text=Executive Summary').first();
    await expect(executiveSummary).toBeVisible({ timeout: 15000 });
    console.log('✓ Executive Summary section is visible');

    // Check if summary text is displayed
    const summaryText = await page.locator('.summary-text, .summary-content, .executive-summary-text, p.summary-text').first().textContent();
    console.log(`Summary preview: ${summaryText?.substring(0, 150)}...`);
    expect(summaryText).toBeTruthy();
    expect(summaryText?.length).toBeGreaterThan(50);
    
    // Verify summary mentions validation score or comment patterns
    const mentionsValidation = summaryText?.toLowerCase().includes('validation') || 
                              summaryText?.toLowerCase().includes('comment') ||
                              summaryText?.toLowerCase().includes('87') ||
                              summaryText?.toLowerCase().includes('score');
    if (mentionsValidation) {
      console.log('✓ Summary mentions validation/comment patterns');
    } else {
      console.log('⚠ Summary does not explicitly mention validation score');
    }

    // Step 2: Verify Hypothesis status badge
    console.log('\n--- Step 2: Verify Hypothesis Status ---');
    const hypothesisSection = page.locator('text=Hypothesis').first();
    if (await hypothesisSection.isVisible().catch(() => false)) {
      console.log('✓ Hypothesis section found');
      
      // Check for status badge
      const statusBadge = page.locator('.hypothesis-status-badge, [class*="status-badge"]').first();
      if (await statusBadge.isVisible().catch(() => false)) {
        const statusText = await statusBadge.textContent();
        console.log(`Hypothesis status: ${statusText}`);
        expect(['Confirmed', 'Need more', 'Not supported']).toContain(statusText?.trim());
        console.log('✓ Hypothesis status badge is displayed');
      }
    }

    // Step 3: Verify Key Assumptions section
    console.log('\n--- Step 3: Verify Key Assumptions ---');
    const keyAssumptionsSection = page.locator('text=Key Assumptions').first();
    await expect(keyAssumptionsSection).toBeVisible({ timeout: 10000 });
    console.log('✓ Key Assumptions section is visible');

    // Check if assumption cards are displayed
    const assumptionCards = page.locator('.assumption-card, [class*="assumption"]');
    const assumptionCount = await assumptionCards.count();
    console.log(`Found ${assumptionCount} assumption cards`);
    expect(assumptionCount).toBeGreaterThan(0);

    // Verify assumption statuses are displayed
    let confirmedCount = 0;
    let needMoreCount = 0;
    
    for (let i = 0; i < Math.min(assumptionCount, 12); i++) {
      const card = assumptionCards.nth(i);
      const cardText = await card.textContent();
      
      // Check for status badge
      const statusBadge = card.locator('.assumption-badge, [class*="badge"]');
      if (await statusBadge.count() > 0) {
        const statusText = await statusBadge.textContent();
        if (statusText?.includes('Confirmed')) {
          confirmedCount++;
        } else if (statusText?.includes('Need more')) {
          needMoreCount++;
        }
      }

      // Check for evidence toggle
      const evidenceToggle = card.locator('.assumption-evidence-toggle, button').filter({ hasText: /evidence|view|show/i });
      if (await evidenceToggle.count() > 0) {
        const toggleText = await evidenceToggle.textContent();
        console.log(`  Assumption ${i + 1}: Has evidence toggle (${toggleText})`);
        
        // Click to expand evidence
        await evidenceToggle.click();
        await page.waitForTimeout(500);
        
        // Check evidence content
        const evidenceContent = card.locator('.assumption-evidence-content, .assumption-evidence-text');
        if (await evidenceContent.count() > 0) {
          const evidenceText = await evidenceContent.textContent();
          console.log(`  Evidence: ${evidenceText?.substring(0, 100)}...`);
          
          // Verify evidence mentions comments or patterns
          const mentionsComments = evidenceText?.toLowerCase().includes('comment') || 
                                  evidenceText?.toLowerCase().includes('pattern') ||
                                  evidenceText?.toLowerCase().includes('validation') ||
                                  evidenceText?.toLowerCase().includes('87');
          
          if (mentionsComments) {
            console.log(`  ✓ Evidence mentions comments/patterns`);
          }
        }
      }
    }

    console.log(`\nAssumption statuses: ${confirmedCount} confirmed, ${needMoreCount} need more`);
    expect(confirmedCount).toBeGreaterThan(0); // At least some assumptions should be confirmed
    console.log('✓ Assumption statuses are displayed correctly');

    // Step 4: Verify AssumptionsWidget in sidebar (if visible)
    console.log('\n--- Step 4: Verify AssumptionsWidget (if visible) ---');
    const assumptionsWidget = page.locator('.assumptions-widget').first();
    if (await assumptionsWidget.isVisible().catch(() => false)) {
      const widgetText = await assumptionsWidget.textContent();
      console.log(`AssumptionsWidget text: ${widgetText}`);
      
      // Check for donut chart
      const donutChart = assumptionsWidget.locator('svg.apexcharts-svg, .apexcharts-canvas, svg');
      if (await donutChart.count() > 0) {
        console.log('✓ Donut chart is visible in AssumptionsWidget');
      }
    }

    // Step 5: Verify Comment Pattern Analysis (if visible in sidebar)
    console.log('\n--- Step 5: Verify Comment Pattern Analysis ---');
    const commentPatternSection = page.locator('text=Comment Pattern Analysis, text=Comment Patterns').first();
    if (await commentPatternSection.isVisible().catch(() => false)) {
      console.log('✓ Comment Pattern Analysis section found');
      
      // Check for validation score or patterns
      const patternText = await page.locator('[class*="comment-pattern"], [class*="pattern"]').first().textContent();
      if (patternText) {
        console.log(`Pattern analysis preview: ${patternText?.substring(0, 100)}...`);
      }
    }

    // Step 6: Take screenshot for verification
    console.log('\n--- Step 6: Taking Screenshot ---');
    await page.screenshot({ path: 'test-results/research-analysis-ui-display-trinity.png', fullPage: true });
    console.log('✓ Screenshot saved to test-results/research-analysis-ui-display-trinity.png');

    console.log('\n=== Test Completed Successfully ===');
  });
});
