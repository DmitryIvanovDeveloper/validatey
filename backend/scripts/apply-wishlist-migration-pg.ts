#!/usr/bin/env ts-node

import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import 'dotenv/config';

async function applyWishlistMigration() {
  try {
    console.log('Applying wishlist migration using PostgreSQL client...');
    
    // Get database connection from Supabase URL
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is required');
    }
    
    // Extract database connection details from Supabase URL
    // Supabase connection string format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    // We need to construct this from the Supabase URL
    // For now, we'll use a direct connection if DB_URL is available, or construct from Supabase URL
    
    const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
    
    if (!dbUrl && !supabaseServiceKey) {
      throw new Error('Either DATABASE_URL/DB_URL or SUPABASE_SERVICE_ROLE_KEY is required for direct database access');
    }
    
    // If we have DATABASE_URL, use it directly
    let connectionString = dbUrl;
    
    // If not, try to construct from Supabase URL (this is a fallback)
    if (!connectionString) {
      console.warn('⚠️  DATABASE_URL not found. Please set DATABASE_URL in .env for direct database access.');
      console.warn('   Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
      throw new Error('DATABASE_URL is required for direct database migration');
    }
    
    const pool = new Pool({
      connectionString,
      ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
    });
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260222000001_create_wishlist.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute the entire SQL file
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('✅ Wishlist migration applied successfully!');
    } finally {
      client.release();
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 Alternative: Apply the migration manually in Supabase Dashboard:');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Copy the contents of: backend/supabase/migrations/20260222000001_create_wishlist.sql');
    console.error('   3. Paste and execute the SQL');
    process.exit(1);
  }
}

applyWishlistMigration().catch(console.error);
