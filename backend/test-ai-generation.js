const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLandingGeneration() {
  try {
    console.log('Testing AI landing generation...');

    // Get projectId and language from command line arguments
    const projectId = process.argv[2];
    const language = process.argv[3] || 'en';

    if (!projectId) {
      console.error('Usage: node test-ai-generation.js <projectId> [language]');
      console.error('Example: node test-ai-generation.js 151e3211-d7f2-41ce-b283-edb457fb1a5f en');
      process.exit(1);
    }

    // Get project data for AI generation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Project fetch error:', projectError);
      return;
    }

    console.log('Project loaded:', project.name);

    console.log('Sending landing generation request...');

    // Actually call the API directly (server is running on localhost:8080)
    const apiUrl = `http://localhost:8080/api/project-landings/${projectId}/generate-ai`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'x-user-id': '4cc56fc4-3814-4c0b-9ac9-6168fc2795c4'
      },
      body: JSON.stringify({
        language: language
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('Landing generated successfully!');
    console.log('Response:', result);

    console.log('Files created in uploads/landings/');

  } catch (e) {
    console.error('Exception:', e);
  }
}

testLandingGeneration();