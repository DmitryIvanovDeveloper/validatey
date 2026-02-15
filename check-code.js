// Check if our code changes are present
const fs = require('fs');
const path = require('path');

const hnFetcherPath = path.join(__dirname, 'backend/src/modules/comments/infrastructure/fetchers/hacker-news-fetcher.ts');

try {
  const content = fs.readFileSync(hnFetcherPath, 'utf8');

  // Check if our changes are present
  const hasRealApi = content.includes('Real API implementation');
  const hasLogging = content.includes('console.log(`[HN Fetcher] Starting to fetch comments');

  console.log('HN Fetcher has real API:', hasRealApi);
  console.log('HN Fetcher has logging:', hasLogging);

  // Check repository
  const repoPath = path.join(__dirname, 'backend/src/modules/comments/infrastructure/repositories/supabase-comment-source.repository.ts');
  const repoContent = fs.readFileSync(repoPath, 'utf8');
  const hasHnUrl = repoContent.includes('hnUrl: row.hn_url');

  console.log('Repository has hnUrl mapping:', hasHnUrl);

} catch (error) {
  console.error('Error:', error.message);
}