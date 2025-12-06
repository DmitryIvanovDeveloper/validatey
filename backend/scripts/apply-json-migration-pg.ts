import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function applyMigration() {
  let client: Client | null = null;

  try {
    // Получаем connection string из Supabase URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
      process.exit(1);
    }

    // Извлекаем host из URL (например: dvqjihptybojcuydqbts.supabase.co)
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      console.error('❌ Invalid SUPABASE_URL format');
      process.exit(1);
    }

    const projectRef = urlMatch[1];
    const dbHost = `${projectRef}.supabase.co`;
    const dbPort = 5432;
    const dbName = 'postgres';
    const dbUser = 'postgres';
    
    // Для Supabase нужно использовать connection pooling или direct connection
    // Попробуем использовать connection string из .env если есть
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || supabaseServiceKey;
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=require`;

    console.log('🔌 Connecting to Supabase PostgreSQL...');
    console.log(`   Host: ${dbHost}`);
    
    client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Читаем SQL миграцию
    const migrationPath = path.join(__dirname, '..', 'scripts', 'apply-migration-direct.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Applying migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');

    // Проверяем, что поля добавлены
    console.log('\n🔍 Verifying migration...');
    const checkResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audio_analysis_sessions' 
      AND column_name IN ('feedback', 'timeline_feedback')
      ORDER BY column_name;
    `);

    if (checkResult.rows.length === 2) {
      console.log('✅ Fields verified:');
      checkResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Fields check returned unexpected results:', checkResult.rows);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

applyMigration();


