import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import 'reflect-metadata';
import '../src/infrastructure/bootstrap/container';
import { container } from '../src/infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../src/modules/comments/types';
import { FetchCommentsUseCase } from '../src/modules/comments/application/use-cases/fetch-comments.usecase';
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

const PROJECT_ID = 'ec73391f-6d45-40dc-b80b-6809cfd0cc1d';

async function main() {
  console.log('🧪 Testing comment fetch locally...\n');
  
  const supabase = getSupabaseClient();

  // Get project info
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', PROJECT_ID)
    .single();

  if (projectError || !project) {
    console.error('❌ Project error:', projectError);
    process.exit(1);
  }

  console.log(`📁 Project: ${project.name} (${project.id})\n`);

  // Get Reddit sources for this project
  const { data: sources, error: sourcesError } = await supabase
    .from('comment_sources')
    .select('id, source_type, reddit_url, subreddit_name, post_id')
    .eq('project_id', PROJECT_ID)
    .eq('source_type', 'reddit')
    .order('created_at', { ascending: false });

  if (sourcesError) {
    console.error('❌ Sources error:', sourcesError);
    process.exit(1);
  }

  if (!sources || sources.length === 0) {
    console.error('❌ No Reddit comment sources for this project.');
    process.exit(1);
  }

  console.log(`📋 Found ${sources.length} Reddit source(s):\n`);
  sources.forEach((source, idx) => {
    console.log(`  ${idx + 1}. ${source.reddit_url || `${source.subreddit_name} / ${source.post_id}`}`);
    console.log(`     ID: ${source.id}`);
    console.log(`     postId: ${source.post_id || 'N/A'}`);
    console.log(`     subredditName: ${source.subreddit_name || 'N/A'}\n`);
  });

  // Check existing comments count
  const commentsBySource = new Map<string, number>();
  const { data: existingComments, error: commentsError } = await supabase
    .from('comments')
    .select('id, source_id')
    .eq('project_id', PROJECT_ID);

  if (commentsError) {
    console.error('❌ Comments query error:', commentsError);
  } else {
    existingComments?.forEach(c => {
      const count = commentsBySource.get(c.source_id) || 0;
      commentsBySource.set(c.source_id, count + 1);
    });
    
    console.log(`📊 Existing comments by source:`);
    sources.forEach(source => {
      const count = commentsBySource.get(source.id) || 0;
      console.log(`  ${source.id}: ${count} comments`);
    });
    console.log('');
  }

  const useCase = container.get<FetchCommentsUseCase>(COMMENT_TYPES.FetchCommentsUseCase);

  // Test fetch for ALL sources that have 0 comments
  const sourcesToTest = sources.filter(s => s.post_id && s.subreddit_name && !commentsBySource.get(s.id));
  
  if (sourcesToTest.length === 0) {
    console.log('✅ All sources already have comments. Testing with first source anyway...\n');
    const sourceToTest = sources.find(s => s.post_id && s.subreddit_name) || sources[0];
    await testFetchForSource(sourceToTest, useCase, PROJECT_ID);
  } else {
    console.log(`📋 Testing ${sourcesToTest.length} source(s) with 0 comments:\n`);
    for (const sourceToTest of sourcesToTest) {
      await testFetchForSource(sourceToTest, useCase, PROJECT_ID);
      console.log('\n' + '='.repeat(60) + '\n');
    }
  }
  
  console.log('✅ All tests completed successfully!');
}

async function testFetchForSource(sourceToTest: any, useCase: FetchCommentsUseCase, projectId: string) {
  console.log(`🚀 Testing fetch for source: ${sourceToTest.id}`);
  console.log(`   URL: ${sourceToTest.reddit_url || 'N/A'}`);
  console.log(`   postId: ${sourceToTest.post_id || 'N/A'}`);
  console.log(`   subredditName: ${sourceToTest.subreddit_name || 'N/A'}\n`);

  const startTime = Date.now();
  console.log('⏳ Starting fetch...\n');
  
  const result = await useCase.execute({
    sourceId: sourceToTest.id,
    projectId: projectId,
    sourceType: 'reddit',
  });

  const duration = Date.now() - startTime;
  console.log(`\n⏱️  Fetch completed in ${Math.round(duration / 1000)}s\n`);

  if (!result.isSuccess) {
    console.error('❌ Fetch failed:', result.error?.message);
    if (result.error?.stack) {
      console.error('\nStack trace:', result.error.stack);
    }
    throw new Error(`Fetch failed for source ${sourceToTest.id}`);
  }

  console.log('✅ Fetch successful!');
  console.log(`   Comments saved: ${result.data.commentsCount}`);
  console.log(`   Sources processed: ${result.data.sourcesProcessed}`);
  if (result.data.errors?.length) {
    console.log(`   Warnings: ${result.data.errors.join(', ')}`);
  }

  // Verify comments were saved
  const supabase = getSupabaseClient();
  const { data: newComments, error: verifyError } = await supabase
    .from('comments')
    .select('id, external_id, author, content')
    .eq('source_id', sourceToTest.id)
    .order('fetched_at', { ascending: false })
    .limit(5);

  if (verifyError) {
    console.error('⚠️  Could not verify comments:', verifyError);
  } else {
    console.log(`\n📝 Latest comments for this source:`);
    if (newComments && newComments.length > 0) {
      newComments.forEach((c, idx) => {
        console.log(`  ${idx + 1}. [${c.external_id}] by ${c.author || 'unknown'}`);
        console.log(`     ${(c.content || '').substring(0, 80)}...`);
      });
    } else {
      console.log('  (no comments found)');
    }
  }
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  if (e instanceof Error && e.stack) {
    console.error('\nStack trace:', e.stack);
  }
  process.exit(1);
});
