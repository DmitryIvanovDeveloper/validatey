import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env from backend root (same as painkiller-assistent scripts)
dotenv.config();

async function applyMigration() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
      process.exit(1);
    }

    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📝 Applying migration: Adding JSON fields...');

    // Применяем миграцию через RPC или прямой SQL
    const migrationSQL = `
      -- Добавляем JSON поля для feedback и timeline_feedback
      ALTER TABLE audio_analysis_sessions 
      ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS timeline_feedback JSONB DEFAULT '[]'::jsonb;

      -- Создаем индексы для JSON полей (для быстрого поиска)
      CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_feedback ON audio_analysis_sessions USING GIN (feedback);
      CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_timeline_feedback ON audio_analysis_sessions USING GIN (timeline_feedback);

      -- Комментарии к полям
      COMMENT ON COLUMN audio_analysis_sessions.feedback IS 'Массив строк с feedback в формате JSON: ["text1", "text2", ...]';
      COMMENT ON COLUMN audio_analysis_sessions.timeline_feedback IS 'Массив объектов timeline feedback в формате JSON: [{"seconds": 1.0, "comment": "...", "type": "...", ...}, ...]';
    `;

    // Supabase JS клиент не поддерживает выполнение произвольного SQL напрямую
    // Нужно использовать REST API или выполнить через Dashboard
    console.log('⚠️  Supabase JS client does not support direct SQL execution.');
    console.log('📋 Please apply the migration manually through Supabase Dashboard:');
    console.log('   1. Open: https://supabase.com/dashboard/project/dvqjihptybojcuydqbts/editor/18592?schema=public');
    console.log('   2. Copy SQL from: backend/supabase-migration-json-fields.sql');
    console.log('   3. Paste and execute in SQL Editor');
    
    // Проверяем, существуют ли уже поля
    console.log('\n🔍 Checking if fields already exist...');
    const { data: tables, error: tablesError } = await supabase
      .from('audio_analysis_sessions')
      .select('feedback, timeline_feedback')
      .limit(1);

    if (tablesError) {
      if (tablesError.message.includes('column') && tablesError.message.includes('does not exist')) {
        console.log('❌ Fields do not exist yet. Migration needs to be applied.');
      } else {
        console.log('⚠️  Error checking fields:', tablesError.message);
      }
    } else {
      console.log('✅ Fields may already exist (or table is empty)');
    }

    console.log('\n✅ Migration script ready. Please apply SQL manually through Dashboard.');

  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

applyMigration();


