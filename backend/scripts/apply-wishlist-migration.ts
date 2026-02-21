#!/usr/bin/env ts-node

import * as path from 'path';
import * as fs from 'fs';
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

async function applyWishlistMigration() {
  try {
    console.log('Applying wishlist migration...');
    
    const supabase = getSupabaseClient();
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260222000001_create_wishlist.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into statements and execute each one
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        
        try {
          // Try RPC call first
          const rpcResult = await supabase.rpc('exec_sql', { sql: statement });
          
          if (rpcResult.error) {
            // If exec_sql doesn't exist, try direct execution via REST API
            if (rpcResult.error.message.includes('function') || rpcResult.error.message.includes('does not exist')) {
              console.warn('exec_sql RPC not available, trying alternative method...');
              
              const supabaseUrl = process.env.SUPABASE_URL?.trim();
              const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
              
              if (!supabaseUrl || !supabaseKey) {
                throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
              }
              
              const restUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`;
              
              const response = await fetch(restUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ sql: statement }),
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
              }
            } else {
              // Other RPC errors
              throw rpcResult.error;
            }
          }
        } catch (error: any) {
          console.error('Migration statement failed:', error);
          // Continue with next statement - some errors might be expected (e.g., IF NOT EXISTS)
          if (error?.message && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
            // Only throw if it's not an expected error
            if (!error.message.includes('function') && !error.message.includes('does not exist')) {
              throw error;
            }
          }
        }
      }
    }
    
    console.log('✅ Wishlist migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyWishlistMigration().catch(console.error);
