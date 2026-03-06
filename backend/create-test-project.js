const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProject() {
  try {
    console.log('Logging in test user...');

    // First login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Logged in, user ID:', authData.user?.id);

    // Create project
    const projectData = {
      name: 'Test Attention Economy Project',
      segment: {
        description: 'Indie creators interested in peer-to-peer feedback exchange',
        demographics: {
          text: 'Solo developers, side-project creators, indie founders'
        }
      },
      hypothesis: {
        description: 'Credit-based economy will motivate indie creators to give and receive feedback',
        assumptions: [
          'Creators are willing to pay time for quality feedback',
          'Peer feedback is more valuable than expert feedback for early-stage ideas',
          'Credit system reduces friction in feedback exchange'
        ]
      },
      scenarioTemplateSlug: 'wtp' // Willingness to Pay template
    };

    console.log('Creating project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: authData.user.id,
        name: projectData.name,
        segment: projectData.segment,
        hypothesis: projectData.hypothesis,
        scenario_template_slug: projectData.scenarioTemplateSlug
      })
      .select()
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return;
    }

    console.log('Project created successfully:', project.id);
    console.log('Project details:', {
      id: project.id,
      name: project.name,
      status: project.status
    });

  } catch (e) {
    console.error('Exception:', e);
  }
}

createTestProject();