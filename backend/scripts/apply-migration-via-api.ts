import * as dotenv from 'dotenv';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

async function applyMigrationViaAPI() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
      process.exit(1);
    }

    console.log('🔌 Attempting to apply migration via Supabase REST API...');

    // Supabase не поддерживает выполнение произвольного SQL через REST API
    // Нужно использовать PostgreSQL напрямую или Supabase Dashboard
    
    console.log('⚠️  Supabase REST API does not support direct SQL execution.');
    console.log('\n📋 Please apply the migration manually:');
    console.log('\n1. Open Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/dvqjihptybojcuydqbts/editor/18592?schema=public');
    console.log('\n2. Copy and paste this SQL:');
    console.log('\n' + '='.repeat(60));
    
    const migrationSQL = `
ALTER TABLE audio_analysis_sessions 
ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_feedback JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_feedback ON audio_analysis_sessions USING GIN (feedback);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_timeline_feedback ON audio_analysis_sessions USING GIN (timeline_feedback);

COMMENT ON COLUMN audio_analysis_sessions.feedback IS 'Массив строк с feedback в формате JSON: ["text1", "text2", ...]';
COMMENT ON COLUMN audio_analysis_sessions.timeline_feedback IS 'Массив объектов timeline feedback в формате JSON: [{"seconds": 1.0, "comment": "...", "type": "...", ...}, ...]';
`.trim();
    
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(60));
    console.log('\n3. Click "Run" to execute');
    console.log('\n4. After migration, test with: npm run test:supabase');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

applyMigrationViaAPI();


