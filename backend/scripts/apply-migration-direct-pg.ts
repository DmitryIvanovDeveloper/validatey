import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env from backend root (same as painkiller-assistent scripts)
dotenv.config();

async function applyMigrationDirect() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Проверяем существование полей
    console.log('🔍 Checking current schema...');
    const { data: testData, error: testError } = await supabase
      .from('audio_analysis_sessions')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('column') && testError.message.includes('does not exist')) {
      console.log('⚠️  Table structure issue detected');
    } else if (testError) {
      console.log('⚠️  Error:', testError.message);
    } else {
      console.log('✅ Table exists');
    }

    console.log('\n📝 Applying migration via Supabase REST API...');
    console.log('⚠️  Supabase JS client does not support DDL operations directly.');
    console.log('📋 Please apply the migration manually through Supabase Dashboard:');
    console.log('\n1. Open: https://supabase.com/dashboard/project/dvqjihptybojcuydqbts/editor/18592?schema=public');
    console.log('2. Copy SQL from: backend/scripts/apply-migration-direct.sql');
    console.log('3. Paste and execute in SQL Editor');
    
    console.log('\n📄 SQL to execute:');
    console.log('='.repeat(60));
    console.log(`
ALTER TABLE audio_analysis_sessions 
ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_feedback JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_feedback ON audio_analysis_sessions USING GIN (feedback);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_timeline_feedback ON audio_analysis_sessions USING GIN (timeline_feedback);

COMMENT ON COLUMN audio_analysis_sessions.feedback IS 'Массив строк с feedback в формате JSON: ["text1", "text2", ...]';
COMMENT ON COLUMN audio_analysis_sessions.timeline_feedback IS 'Массив объектов timeline feedback в формате JSON: [{"seconds": 1.0, "comment": "...", "type": "...", ...}, ...]';
    `.trim());
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

applyMigrationDirect();


