/**
 * Reset research cooldown for a project so "Start Research" becomes available.
 * Usage: npx ts-node scripts/reset-research-cooldown.ts <projectId>
 */
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

async function main() {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error('Usage: npx ts-node scripts/reset-research-cooldown.ts <projectId>');
    process.exit(1);
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('research_data')
    .update({ last_research_run_at: '2026-02-28T00:00:00.000Z' })
    .eq('project_id', projectId);

  if (error) {
    console.error('Failed to reset cooldown:', error.message);
    process.exit(1);
  }
  console.log('Cooldown reset for project:', projectId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
