#!/usr/bin/env ts-node
/**
 * Scrape one Reddit post page with Puppeteer (bypasses API 403) and insert comments into Supabase.
 * Usage: npx ts-node --transpile-only scripts/scrape-reddit-comments-to-supabase.ts
 */
import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import puppeteer from 'puppeteer';
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

const REDDIT_POST_URL = 'https://www.reddit.com/r/micro_saas/comments/1r9q1zi/i_built_a_tool_that_tells_you_not_to_build_your/';
const OLD_REDDIT_URL = 'https://old.reddit.com/r/micro_saas/comments/1r9q1zi/i_built_a_tool_that_tells_you_not_to_build_your/';
const FOUNDER_PROJECT_ID = 'ec73391f-6d45-40dc-b80b-6809cfd0cc1d';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface ScrapedComment {
  externalId: string;
  content: string;
  author: string | null;
  permalink: string;
  createdAt: string;
}

async function scrapeCommentsWithPuppeteer(): Promise<ScrapedComment[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setDefaultNavigationTimeout(30000);
    await page.goto(OLD_REDDIT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const comments = await page.evaluate(() => {
      const result: { externalId: string; content: string; author: string | null; permalink: string; createdAt: string }[] = [];
      const things = document.querySelectorAll('div.thing[data-fullname^="t1_"]');
      things.forEach((el) => {
        const fullname = el.getAttribute('data-fullname') || '';
        const externalId = fullname.replace(/^t1_/, '');
        const authorEl = el.querySelector('a.author');
        const author = authorEl?.textContent?.trim() || null;
        const usertextBody = el.querySelector('.usertext-body');
        const content = usertextBody?.querySelector('.md')?.textContent?.trim() || usertextBody?.textContent?.trim() || '';
        const timeEl = el.querySelector('time');
        const createdAt = timeEl?.getAttribute('datetime') || new Date().toISOString();
        const permalinkEl = el.querySelector('a.bylink');
        let permalink = permalinkEl?.getAttribute('href') || '';
        if (permalink && !permalink.startsWith('http')) permalink = 'https://old.reddit.com' + permalink;
        if (!content && el.querySelector('.deleted')) return;
        result.push({ externalId, content: content.slice(0, 10000), author, permalink, createdAt });
      });
      return result;
    });

    return comments;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('Scraping', OLD_REDDIT_URL, '...');
  const scraped = await scrapeCommentsWithPuppeteer();
  console.log('Scraped', scraped.length, 'comments');

  if (scraped.length === 0) {
    console.log('No comments found. Reddit may require login or block headless.');
    return;
  }

  const supabase = getSupabaseClient();
  const { data: sources } = await supabase
    .from('comment_sources')
    .select('id')
    .eq('project_id', FOUNDER_PROJECT_ID)
    .eq('reddit_url', REDDIT_POST_URL)
    .limit(1);

  const sourceId = sources?.[0]?.id;
  if (!sourceId) {
    console.error('No comment_sources row for this URL and Founder project. Add the source in the UI first.');
    return;
  }

  const now = new Date().toISOString();
  const rows = scraped.map((c) => ({
    source_id: sourceId,
    project_id: FOUNDER_PROJECT_ID,
    external_id: c.externalId,
    content: c.content || '[empty]',
    author: c.author,
    url: c.permalink || REDDIT_POST_URL,
    context_title: null,
    context_url: REDDIT_POST_URL,
    created_at: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
    fetched_at: now,
    is_processed: false,
    processed_at: null,
    import_origin: 'manual',
    subsource_name: 'r/micro_saas',
  }));

  const { data, error } = await supabase.from('comments').upsert(rows, { onConflict: 'source_id,external_id' });
  if (error) {
    console.error('Supabase error:', error.message);
    return;
  }
  console.log('Inserted/updated', rows.length, 'comments in Supabase for Founder Validation Pain Survey.');
}

main().catch(console.error);
