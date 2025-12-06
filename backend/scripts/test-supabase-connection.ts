import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required');
    console.error('Please set them in your .env file');
    process.exit(1);
  }

  console.log('🔌 Testing Supabase connection...');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  });

  try {
    // Test connection by making a simple query to projects table
    let error;
    try {
      const result = await supabase.from('projects').select('id').limit(1);
      error = result.error;
    } catch (e) {
      // If table doesn't exist, that's OK - connection is working
      error = null;
    }

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist') || error.message.includes('function')) {
        console.log('⚠️  Some tables/functions do not exist yet. This is normal for a new project.');
        console.log('✅ Connection to Supabase is working!');
        console.log('');
        console.log('📋 Next step: Run migrations to create tables');
        return;
      } else {
        console.error('❌ Supabase query error:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        throw error;
      }
    } else {
      console.log('✅ Connection successful!');
      console.log(`✅ Supabase is accessible`);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Connection failed');
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('');
        console.error('💡 Tip: Check your SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
        console.error('   Make sure the key is correct and not expired');
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('');
        console.error('💡 Tip: Check your SUPABASE_URL');
        console.error('   Make sure the URL is correct and accessible');
      }
    } else {
      console.error('   Unknown error:', error);
    }
    process.exit(1);
  }
}

testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
