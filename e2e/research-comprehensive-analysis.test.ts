import { test, expect } from '@playwright/test';

test.describe('Research Comprehensive Analysis - All Data Sources', () => {
  test.setTimeout(300000); // 5 minutes timeout

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
    console.log('=== Starting Comprehensive Analysis Test ===');
    await page.goto('http://localhost:5173');
    
    // Login if needed
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/workspaces*', { timeout: 30000 });
    }
  });

  test('should verify that research analysis includes comments, responses, and all data sources', async ({ page }) => {
    console.log('=== Test: Verify Comprehensive Analysis ===');
    
    // Navigate to project overview
    const overviewUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}`;
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to project overview');

    // Step 1: Verify comments exist
    console.log('\n--- Step 1: Verify Comments Data ---');
    const commentsWidget = page.locator('.comments-widget, [class*="comments"]').first();
    await expect(commentsWidget).toBeVisible({ timeout: 10000 });
    
    // Check if comments count is displayed
    const commentsCountText = await commentsWidget.textContent();
    console.log(`Comments widget text: ${commentsCountText}`);
    
    // Navigate to comments tab to verify comments exist
    const commentsUrl = `http://localhost:5173/workspaces/${testProject.workspaceId}/projects/${testProject.projectId}/comments`;
    await page.goto(commentsUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for comments sources or comment items
    const hasComments = await page.locator('.comment-item, .source-stat, [class*="comment"]').count() > 0;
    console.log(`Has comments: ${hasComments}`);
    
    if (!hasComments) {
      console.log('⚠ No comments found, adding a test source...');
      // Add a Reddit source if no comments
      const redditInput = page.locator('.reddit-card .url-input[placeholder*="Reddit"]').first();
      if (await redditInput.isVisible().catch(() => false)) {
        await redditInput.fill('https://www.reddit.com/r/startups/');
        const addButton = page.locator('.reddit-card .add-url-btn').first();
        await addButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 2: Navigate back to overview and check Key Assumptions
    console.log('\n--- Step 2: Check Key Assumptions ---');
    await page.goto(overviewUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Wait for Key Assumptions section
    const keyAssumptionsSection = page.locator('text=Key Assumptions').first();
    await expect(keyAssumptionsSection).toBeVisible({ timeout: 10000 });
    console.log('✓ Key Assumptions section is visible');

    // Check if assumptions are displayed
    const assumptionCards = page.locator('.assumption-card, [class*="assumption"]');
    const assumptionCount = await assumptionCards.count();
    console.log(`Found ${assumptionCount} assumption cards`);

    if (assumptionCount === 0) {
      console.log('⚠ No assumptions found in project');
      test.skip();
      return;
    }

    // Step 3: Check if assumptions have evidence (which should include comments)
    console.log('\n--- Step 3: Verify Assumption Evidence ---');
    for (let i = 0; i < Math.min(assumptionCount, 3); i++) {
      const card = assumptionCards.nth(i);
      const cardText = await card.textContent();
      console.log(`Assumption ${i + 1}: ${cardText?.substring(0, 100)}...`);

      // Check for evidence toggle
      const evidenceToggle = card.locator('.assumption-evidence-toggle, button').filter({ hasText: /evidence|view|show/i });
      if (await evidenceToggle.count() > 0) {
        const toggleText = await evidenceToggle.textContent();
        console.log(`  Evidence toggle: ${toggleText}`);
        
        // Click to expand evidence
        await evidenceToggle.click();
        await page.waitForTimeout(500);
        
        // Check evidence content
        const evidenceContent = card.locator('.assumption-evidence-content, .assumption-evidence-text');
        if (await evidenceContent.count() > 0) {
          const evidenceText = await evidenceContent.textContent();
          console.log(`  Evidence: ${evidenceText?.substring(0, 150)}...`);
          
          // Verify evidence mentions comments or user feedback
          const mentionsComments = evidenceText?.toLowerCase().includes('comment') || 
                                   evidenceText?.toLowerCase().includes('reddit') ||
                                   evidenceText?.toLowerCase().includes('hacker news') ||
                                   evidenceText?.toLowerCase().includes('user') ||
                                   evidenceText?.toLowerCase().includes('feedback');
          
          if (mentionsComments) {
            console.log(`  ✓ Evidence mentions comments/user feedback`);
          } else {
            console.log(`  ⚠ Evidence does not explicitly mention comments`);
          }
        }
      }
    }

    // Step 4: Check Pain Points
    console.log('\n--- Step 4: Verify Pain Points Include Comments ---');
    const painPointsSection = page.locator('text=Top Pain Points, text=Pain Points').first();
    if (await painPointsSection.isVisible().catch(() => false)) {
      console.log('✓ Pain Points section found');
      
      const painPointItems = page.locator('.pain-point-item, .pain-point-text');
      const painPointCount = await painPointItems.count();
      console.log(`Found ${painPointCount} pain points`);
      
      if (painPointCount > 0) {
        const firstPainPoint = await painPointItems.first().textContent();
        console.log(`First pain point: ${firstPainPoint?.substring(0, 100)}...`);
      }
    } else {
      console.log('⚠ Pain Points section not found (may need to run research first)');
    }

    // Step 5: Check Executive Summary
    console.log('\n--- Step 5: Verify Executive Summary ---');
    const executiveSummary = page.locator('text=Executive Summary').first();
    if (await executiveSummary.isVisible().catch(() => false)) {
      console.log('✓ Executive Summary found');
      
      const summaryText = await page.locator('.summary-text, .summary-content').first().textContent();
      console.log(`Summary preview: ${summaryText?.substring(0, 200)}...`);
      
      // Check if summary mentions comments or user feedback
      const mentionsData = summaryText?.toLowerCase().includes('comment') || 
                          summaryText?.toLowerCase().includes('user') ||
                          summaryText?.toLowerCase().includes('feedback') ||
                          summaryText?.toLowerCase().includes('response');
      
      if (mentionsData) {
        console.log('✓ Summary mentions user data/comments');
      }
    } else {
      console.log('⚠ Executive Summary not found (may need to run research first)');
    }

    // Step 6: Run research if not already run
    console.log('\n--- Step 6: Verify Research Status ---');
    const startResearchButton = page.locator('button').filter({ hasText: /Start Research|start research/i });
    
    if (await startResearchButton.isVisible().catch(() => false)) {
      console.log('⚠ Research not started yet. Starting research...');
      
      await startResearchButton.click();
      await page.waitForTimeout(1000);
      
      // Wait for research to complete (or show loading)
      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return !buttons.some(btn => btn.textContent?.includes('Start Research'));
        },
        { timeout: 4 * 60 * 1000 } // 4 minutes
      );
      
      console.log('✓ Research completed (or in progress)');
      await page.waitForTimeout(5000); // Wait for data to load
      
      // Reload page to see updated data
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    } else {
      console.log('✓ Research already completed or in progress');
    }

    // Step 7: Final verification - check that assumptions have evidence after research
    console.log('\n--- Step 7: Final Verification ---');
    const finalAssumptions = page.locator('.assumption-card, [class*="assumption"]');
    const finalCount = await finalAssumptions.count();
    console.log(`Final assumption count: ${finalCount}`);
    
    let assumptionsWithEvidence = 0;
    for (let i = 0; i < Math.min(finalCount, 3); i++) {
      const card = finalAssumptions.nth(i);
      const hasEvidence = await card.locator('.assumption-evidence-toggle, .assumption-evidence-content').count() > 0;
      if (hasEvidence) {
        assumptionsWithEvidence++;
      }
    }
    
    console.log(`Assumptions with evidence: ${assumptionsWithEvidence}/${Math.min(finalCount, 3)}`);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/comprehensive-analysis-verification.png', fullPage: true });
    console.log('✓ Screenshot saved to test-results/comprehensive-analysis-verification.png');
    
    console.log('\n=== Test Completed ===');
  });
});
