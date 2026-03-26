import { test, expect } from '@playwright/test';

test('auto-login does not redirect back to auth', async ({ page }) => {
  await page.goto('/');

  const targetUrl = await page
    .waitForURL(
      (url) => {
        const p = url.pathname;
        return (
          p.includes('/workspaces') ||
          p === '/auth' ||
          p.includes('/auth') ||
          p === '/login' ||
          p.includes('/login')
        );
      },
      { timeout: 20000 }
    )
    .catch(() => null);

  const finalPath = targetUrl ? targetUrl.pathname : new URL(page.url()).pathname;

  const isAuthRoute =
    finalPath === '/auth' ||
    finalPath === '/login' ||
    finalPath.includes('/auth') ||
    finalPath.includes('/login');

  expect(isAuthRoute, `Expected /workspaces, got ${finalPath}`).toBe(false);
});
