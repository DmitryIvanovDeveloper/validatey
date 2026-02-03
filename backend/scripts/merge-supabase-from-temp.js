'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tempPath = path.join(root, 'temp.env');
const envPath = path.join(root, '.env');

if (!fs.existsSync(tempPath)) {
  console.error('temp.env not found');
  process.exit(1);
}

const tempLines = fs.readFileSync(tempPath, 'utf8').split(/\r?\n/);
const supabaseUrl = tempLines.find(l => /^SUPABASE_URL=/.test(l));
const supabaseAnon = tempLines.find(l => /^SUPABASE_ANON_KEY=/.test(l));
const supabaseService = tempLines.find(l => /^SUPABASE_SERVICE_ROLE_KEY=/.test(l));

if (!supabaseUrl || !supabaseAnon) {
  console.error('temp.env must contain SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

let envContent;
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/^SUPABASE_URL=.*/m, supabaseUrl);
  envContent = envContent.replace(/^SUPABASE_ANON_KEY=.*/m, supabaseAnon);
  // Remove or replace SERVICE_ROLE_KEY so URL and key are from same project (use anon if no service in temp.env)
  if (supabaseService) {
    envContent = envContent.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*/m, supabaseService);
  } else {
    envContent = envContent.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*/m, '# SUPABASE_SERVICE_ROLE_KEY= (using anon from temp.env)');
  }
} else {
  envContent = [supabaseUrl, supabaseAnon].join('\n') + '\n';
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Updated .env with SUPABASE_URL and SUPABASE_ANON_KEY from temp.env');
console.log('SUPABASE_URL:', supabaseUrl.replace(/=.*/, '=***'));
