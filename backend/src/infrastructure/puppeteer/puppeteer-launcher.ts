import puppeteer, { type Browser, type LaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Determines if code is running on Vercel serverless environment.
 */
function isVercelEnvironment(): boolean {
  return !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

/**
 * Launches Puppeteer browser with appropriate Chromium for the environment.
 * - On Vercel/serverless: uses @sparticuz/chromium (optimized for serverless)
 * - Locally: uses system Puppeteer with bundled Chromium
 */
export async function launchPuppeteer(options?: LaunchOptions): Promise<Browser> {
  const isVercel = isVercelEnvironment();

  if (isVercel) {
    // On Vercel: use @sparticuz/chromium
    const executablePath = await chromium.executablePath();
    return await puppeteer.launch({
      args: chromium.args || ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
      ...options,
    });
  } else {
    // Locally: use regular Puppeteer with bundled Chromium
    const puppeteerFull = await import('puppeteer');
    return await puppeteerFull.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      ...options,
    });
  }
}
