const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateLanding() {
  try {
    console.log('Generating landing with redesigned prompt...');

    const projectId = '151e3211-d7f2-41ce-b283-edb457fb1a5f';
    const language = 'en';

    // Get project data
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

    // Prepare landing generation request
    const generationRequest = {
      projectId: projectId,
      language: language,
      customPrompt: `Create a stunning, conversion-focused landing page for "Personalized App Discovery" - a platform that helps indie developers validate their app ideas through forum research and AI analysis.

Focus on:
- Premium SaaS aesthetic (like Stripe, Linear, Notion)
- Emotional storytelling that builds desire and trust
- Sophisticated color palette with emerald accents
- Generous whitespace and elegant typography
- Interactive elements that feel luxurious
- Strong social proof and credibility signals
- Frictionless email capture for the waitlist

Make it feel like a $50K+ designed landing page that inspires confidence and drives signups.`
    };

    // Call the API directly
    const apiUrl = `http://localhost:8080/api/project-landings/${projectId}/generate-ai`;

    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify(generationRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('Landing generated successfully!');
    console.log('Result:', result);

    // Check if file was created
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'backend/uploads/landings');

    try {
      const files = fs.readdirSync(uploadsDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      console.log('HTML files in uploads:', htmlFiles);

      if (htmlFiles.length > 0) {
        const latestFile = htmlFiles.sort().pop();
        console.log('Latest generated file:', latestFile);

        // Show first 200 chars of the generated HTML
        const filePath = path.join(uploadsDir, latestFile);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('\n--- Generated HTML preview ---');
        console.log(content.substring(0, 500) + '...');
      }
    } catch (err) {
      console.log('Could not read generated files:', err.message);
    }

  } catch (e) {
    console.error('Exception:', e);
  }
}

generateLanding();