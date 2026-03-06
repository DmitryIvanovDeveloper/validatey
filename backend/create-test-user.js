const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loginTestUser() {
  try {
    console.log('Logging in test user...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (error) {
      console.error('Error logging in:', error);
      return;
    }

    console.log('Login successful!');
    console.log('Access token exists:', !!data.session?.access_token);
    console.log('User ID:', data.user?.id);

  } catch (e) {
    console.error('Exception:', e);
  }
}

loginTestUser();