#!/usr/bin/env ts-node
/**
 * Test Reddit comment fetch (with Puppeteer fallback) for project "PII Guardian".
 * Usage: npx ts-node --transpile-only scripts/test-fetch-pii-guardian.ts
 */
import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import 'reflect-metadata';
import '../src/infrastructure/bootstrap/container';
import { container } from '../src/infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../src/modules/comments/types';
import { FetchCommentsUseCase } from '../src/modules/comments/application/use-cases/fetch-comments.usecase';
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

async function main() {
  const supabase = getSupabaseClient();

  const { data: projects, error: e1 } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', '%PII Guardian%');

  if (e1) {
    console.error('Projects error:', e1);
    process.exit(1);
  }
  if (!projects?.length) {
    console.error('Project "PII Guardian" not found.');
    process.exit(1);
  }

  const projectId = projects[0].id;
  console.log('Project:', projects[0].name, '| id:', projectId);

  const { data: sources, error: e2 } = await supabase
    .from('comment_sources')
    .select('id, source_type, reddit_url, subreddit_name, post_id')
    .eq('project_id', projectId)
    .eq('source_type', 'reddit');

  if (e2) {
    console.error('Sources error:', e2);
    process.exit(1);
  }
  if (!sources?.length) {
    console.error('No Reddit comment sources for this project. Add a Reddit post URL in the UI first.');
    process.exit(1);
  }

  const source = sources[0];
  console.log('Source:', source.reddit_url || `${source.subreddit_name} / ${source.post_id}`);

  const useCase = container.get<FetchCommentsUseCase>(COMMENT_TYPES.FetchCommentsUseCase);
  const result = await useCase.execute({
    sourceId: source.id,
    projectId,
    sourceType: 'reddit',
  });

  if (!result.isSuccess) {
    console.error('Fetch failed:', result.error?.message);
    process.exit(1);
  }

  console.log('Success:', result.data.commentsCount, 'comments saved.');
  if (result.data.errors?.length) {
    console.log('Warnings:', result.data.errors);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
