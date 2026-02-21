#!/usr/bin/env ts-node
import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

const TRINITY_PROJECT_ID = '44f2f181-0f5c-40f4-b707-00a145daed41';
const FOUNDER_PROJECT_ID = 'ec73391f-6d45-40dc-b80b-6809cfd0cc1d';

async function main() {
  const supabase = getSupabaseClient();

  const { data: comments, error: eComments } = await supabase
    .from('comments')
    .select('source_id, external_id, content, author, url, context_title, context_url, created_at, fetched_at, is_processed, processed_at, import_origin, subsource_name')
    .eq('project_id', TRINITY_PROJECT_ID);

  if (eComments || !comments?.length) {
    console.error('Comments error or empty:', eComments?.message ?? 'no data');
    return;
  }

  const { data: tSources } = await supabase
    .from('comment_sources')
    .select('id, reddit_url, hn_url')
    .eq('project_id', TRINITY_PROJECT_ID);
  const { data: fSources } = await supabase
    .from('comment_sources')
    .select('id, reddit_url, hn_url')
    .eq('project_id', FOUNDER_PROJECT_ID);

  const fByUrl: Record<string, string> = {};
  (fSources ?? []).forEach((s: { id: string; reddit_url?: string; hn_url?: string }) => {
    const url = s.reddit_url || s.hn_url || '';
    fByUrl[url] = s.id;
  });
  const firstFounderSourceId = (fSources ?? [])[0]?.id;
  if (!firstFounderSourceId) {
    console.error('Founder has no sources.');
    return;
  }
  const tIdToFId: Record<string, string> = {};
  (tSources ?? []).forEach((t: { id: string; reddit_url?: string; hn_url?: string }) => {
    const url = t.reddit_url || t.hn_url || '';
    tIdToFId[t.id] = fByUrl[url] || firstFounderSourceId;
  });

  const rows = comments.map((c: Record<string, unknown>) => ({
      source_id: tIdToFId[c.source_id as string],
      project_id: FOUNDER_PROJECT_ID,
      external_id: c.external_id,
      content: c.content,
      author: c.author,
      url: c.url,
      context_title: c.context_title,
      context_url: c.context_url,
      created_at: c.created_at,
      fetched_at: c.fetched_at,
      is_processed: c.is_processed ?? false,
      processed_at: c.processed_at ?? null,
      import_origin: c.import_origin ?? 'api_fetch',
      subsource_name: c.subsource_name ?? null,
    }));

  if (rows.length === 0) {
    console.log('No comments with matching sources (same reddit_url/hn_url).');
    return;
  }

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('comments').upsert(chunk, { onConflict: 'source_id,external_id' });
    if (error) {
      console.error('Batch error:', error.message);
      break;
    }
    inserted += chunk.length;
  }
  console.log('Copied', inserted, 'comments from Trinity to Founder Validation Pain Survey.');
}

main().catch(console.error);
