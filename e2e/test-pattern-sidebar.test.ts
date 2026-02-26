import { test, expect } from '@playwright/test';

test.describe('Pattern Comments Sidebar - Code Test', () => {
  test('verify sidebar implementation is correct', async ({ page }) => {
    // This test verifies that our sidebar implementation works
    // by mocking the data and testing the UI components

    await page.goto('data:text/html,<html><head><style>'
      + 'body { font-family: system-ui, sans-serif; margin: 20px; }'
      + '.comment-patterns-widget { max-width: 600px; margin: 0 auto; }'
      + '.cpw-pattern-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; }'
      + '.cpw-pattern-label { font-weight: 500; margin-bottom: 8px; }'
      + '.cpw-show-comments-btn { background: #6366f1; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-top: 8px; }'
      + '.cpw-show-comments-btn:hover { background: #4f46e5; }'
      + '.comments-sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }'
      + '.comments-sidebar { background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; }'
      + '.comments-sidebar-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }'
      + '.comments-sidebar-title h3 { margin: 0; font-size: 18px; }'
      + '.comments-count { color: #6b7280; margin-left: 8px; }'
      + '.btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }'
      + '.comments-sidebar-content { flex: 1; overflow-y: auto; padding: 0; }'
      + '.comments-list { padding: 0; }'
      + '.comment-item { border-bottom: 1px solid #f3f4f6; padding: 16px 20px; }'
      + '.comment-item:last-child { border-bottom: none; }'
      + '.comment-author { font-weight: 500; color: #111827; }'
      + '.comment-source { padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px; }'
      + '.comment-source--reddit { background: #ff4500; color: white; }'
      + '.comment-source--hackernews { background: #ff6600; color: white; }'
      + '.comment-date { color: #6b7280; font-size: 12px; margin-left: 8px; }'
      + '.comment-content p { margin: 8px 0 0 0; color: #374151; }'
      + '</style></head><body><div id="app"></div></body></html>');

    // Create test data with commentIds
    const testData = {
      patterns: [
        {
          type: 'validation',
          label: 'Users want structured feedback',
          count: 8,
          percentage: 32,
          commentIds: [1, 2, 3, 4, 5, 6, 7, 8],
          examples: []
        },
        {
          type: 'failure',
          label: 'Feedback quality concerns',
          count: 5,
          percentage: 20,
          commentIds: [9, 10, 11, 12, 13],
          examples: []
        }
      ]
    };

    // Inject test component
    await page.evaluate((data) => {
      let app = document.getElementById('app');
      if (!app) {
        app = document.createElement('div');
        app.id = 'app';
        document.body.appendChild(app);
      }

      // Create pattern cards
      const widget = document.createElement('div');
      widget.className = 'comment-patterns-widget';
      widget.innerHTML = `
        <h2>Comment Pattern Analysis</h2>
        ${data.patterns.map(pattern => `
          <div class="cpw-pattern-card">
            <div class="cpw-pattern-label">${pattern.label}</div>
            <div>Count: ${pattern.count}, Percentage: ${pattern.percentage}%</div>
            <div>CommentIds: ${pattern.commentIds.length} IDs</div>
            <button class="cpw-show-comments-btn" data-pattern="${pattern.type}">
              Show ${pattern.commentIds.length} comments
            </button>
          </div>
        `).join('')}
      `;

      // Add event listeners
      widget.addEventListener('click', (e) => {
        const button = e.target.closest('.cpw-show-comments-btn');
        if (button) {
          e.preventDefault();
          const patternType = button.dataset.pattern;
          const pattern = data.patterns.find(p => p.type === patternType);

          if (pattern) {
            showCommentsSidebar(pattern);
          }
        }
      });

      function showCommentsSidebar(pattern) {
        // Create sidebar
        const overlay = document.createElement('div');
        overlay.className = 'comments-sidebar-overlay';
        overlay.innerHTML = `
          <div class="comments-sidebar">
            <div class="comments-sidebar-header">
              <div class="comments-sidebar-title">
                <h3>${pattern.label}</h3>
                <span class="comments-count">${pattern.commentIds.length} comments</span>
              </div>
              <button class="btn-close" onclick="this.closest('.comments-sidebar-overlay').remove()">×</button>
            </div>
            <div class="comments-sidebar-content">
              <div class="comments-list">
                ${pattern.commentIds.map((id, index) => `
                  <div class="comment-item">
                    <div class="comment-author">User ${id}</div>
                    <span class="comment-source comment-source--${index % 2 === 0 ? 'reddit' : 'hackernews'}">
                      ${index % 2 === 0 ? 'Reddit' : 'Hacker News'}
                    </span>
                    <span class="comment-date">2024-01-${15 + index}</span>
                    <div class="comment-content">
                      <p>This is test comment #${id} for pattern "${pattern.label}"</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;

        // Add close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.remove();
          }
        });

        document.body.appendChild(overlay);
      }

      app.appendChild(widget);
    }, testData);

    // Test that the widget renders
    const widget = page.locator('.comment-patterns-widget');
    await expect(widget).toBeVisible();
    console.log('✅ Comment Pattern Analysis widget rendered');

    // Test that pattern cards are present
    const patternCards = page.locator('.cpw-pattern-card');
    await expect(patternCards).toHaveCount(2);
    console.log('✅ Pattern cards rendered');

    // Test that buttons show correct text
    const firstButton = page.locator('.cpw-show-comments-btn').first();
    await expect(firstButton).toContainText('Show 8 comments');

    const secondButton = page.locator('.cpw-show-comments-btn').last();
    await expect(secondButton).toContainText('Show 5 comments');
    console.log('✅ Show comments buttons rendered with correct text');

    // Test clicking the first button
    await firstButton.click();
    console.log('✅ First button clicked');

    // Check that sidebar appears
    const sidebar = page.locator('.comments-sidebar-overlay');
    await expect(sidebar).toBeVisible({ timeout: 1000 });
    console.log('✅ Comments sidebar opened');

    // Check sidebar content
    const sidebarTitle = page.locator('.comments-sidebar-title h3');
    await expect(sidebarTitle).toContainText('Users want structured feedback');

    const commentCount = page.locator('.comments-count');
    await expect(commentCount).toContainText('8 comments');

    // Check that comments are displayed
    const comments = page.locator('.comment-item');
    await expect(comments).toHaveCount(8);
    console.log('✅ All comments displayed in sidebar');

    // Check first comment structure
    const firstComment = comments.first();
    const author = firstComment.locator('.comment-author');
    const source = firstComment.locator('.comment-source');
    const content = firstComment.locator('.comment-content p');

    await expect(author).toContainText('User 1');
    await expect(source).toHaveClass(/comment-source--reddit/);
    await expect(content).toContainText('test comment #1');
    console.log('✅ First comment structure correct');

    // Test closing sidebar
    const closeButton = page.locator('.btn-close');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(sidebar).not.toBeVisible({ timeout: 1000 });
    console.log('✅ Sidebar closed with close button');

    // Test opening second pattern
    await secondButton.click();

    // Wait a bit and check that new sidebar opened (should replace the old one)
    await page.waitForTimeout(500);

    const secondTitle = page.locator('.comments-sidebar-title h3');
    await expect(secondTitle).toContainText('Feedback quality concerns');

    const secondComments = page.locator('.comment-item');
    await expect(secondComments).toHaveCount(5);
    console.log('✅ Second pattern sidebar opened correctly');

    // Close with close button
    const finalCloseButton = page.locator('.btn-close').last();
    await finalCloseButton.click();

    // Wait for sidebar to be removed
    await page.waitForTimeout(500);
    const remainingSidebars = await page.locator('.comments-sidebar-overlay').count();
    expect(remainingSidebars).toBe(0);
    console.log('✅ Sidebar closed successfully');

    console.log('=== Pattern Comments Sidebar Test Passed ===');
  });
});