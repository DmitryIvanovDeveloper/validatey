#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile: string) {
  const migrationPath = path.join(__dirname, '../supabase/migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    return false;
  }

  console.log(`Running migration: ${migrationFile}`);

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error('Migration failed:', error);
          return false;
        }
      }
    }

    console.log(`Migration ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`Migration ${migrationFile} failed:`, error);
    return false;
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: npm run db:migrate <migration-file.sql>');
    process.exit(1);
  }

  const success = await runMigration(migrationFile);

  if (!success) {
    process.exit(1);
  }

  console.log('Migration completed');
}

main().catch(console.error);