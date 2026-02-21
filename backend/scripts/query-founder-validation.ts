#!/usr/bin/env ts-node
import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

async function main() {
  const supabase = getSupabaseClient();

  // 1) Find project "Founder Validation Pain Survey"
  const { data: projects, error: e1 } = await supabase
    .from('projects')
    .select('id, name, hypothesis')
    .or('name.ilike.%Founder Validation Pain%,name.ilike.%Founder Validation%');

  if (e1) {
    console.error('Projects error:', e1);
    return;
  }
  console.log('=== PROJECTS ===');
  console.log(JSON.stringify(projects, null, 2));

  if (!projects?.length) {
    console.log('No project found.');
    return;
  }
  const projectId = projects[0].id;
  console.log('Project ID:', projectId);

  // 2) Comment sources for this project
  const { data: sources, error: e2 } = await supabase
    .from('comment_sources')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (e2) {
    console.error('Sources error:', e2);
    return;
  }
  console.log('\n=== COMMENT SOURCES ===');
  console.log(JSON.stringify(sources, null, 2));

  // 3) Comments for this project (and extract URLs from content)
  const { data: comments, error: e3 } = await supabase
    .from('comments')
    .select('id, source_id, content, url, context_title, context_url, author, subsource_name, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (e3) {
    console.error('Comments error:', e3);
    return;
  }
  console.log('\n=== COMMENTS COUNT ===', comments?.length ?? 0);
  console.log('Sample comments (first 5):');
  console.log(JSON.stringify(comments?.slice(0, 5), null, 2));

  // Links in comments (content that looks like URL)
  const urlRegex = /https?:\/\/[^\s\)\]\"\']+/g;
  const links: string[] = [];
  (comments ?? []).forEach((c) => {
    const matches = (c.content || '').match(urlRegex);
    if (matches) links.push(...matches);
    if (c.url) links.push(c.url);
    if (c.context_url) links.push(c.context_url);
  });
  const uniqueLinks = [...new Set(links)];
  console.log('\n=== LINKS IN COMMENTS (unique) ===');
  uniqueLinks.forEach((u, i) => console.log(`${i + 1}. ${u}`));

  // 4) Fetch jobs for this project (to see failures)
  const { data: jobs, error: e4 } = await supabase
    .from('fetch_jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (e4) {
    console.error('Fetch jobs error:', e4);
    return;
  }
  console.log('\n=== FETCH JOBS ===');
  console.log(JSON.stringify(jobs, null, 2));
}

main().catch(console.error);
