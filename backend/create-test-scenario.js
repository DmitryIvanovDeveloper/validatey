const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestScenario() {
  try {
    console.log('Logging in test user...');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    const projectId = 'c9918d5d-48f6-43f9-870d-4b6e747bc6fd';

    // Sample WTP (Willingness to Pay) scenario content
    const scenarioContent = {
      questions: [
        {
          id: 'q1',
          type: 'scale',
          title: 'How severe is the problem you\'re trying to solve?',
          description: 'Rate on a scale from 1 (minor inconvenience) to 10 (critical business blocker)',
          min: 1,
          max: 10,
          required: true
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'What solutions are you currently using?',
          description: 'Select all that apply',
          options: [
            'Free tools (Google Forms, surveys)',
            'Expensive research agencies',
            'Internal team research',
            'No research at all',
            'Other'
          ],
          allowMultiple: true,
          required: true
        },
        {
          id: 'q3',
          type: 'scale',
          title: 'How much would you pay for a credit-based feedback exchange platform?',
          description: 'Monthly subscription price you\'d be willing to pay',
          options: [
            '$0 (I prefer free peer exchange)',
            '$5-10 (reasonable for indie creators)',
            '$15-25 (worth it for quality feedback)',
            '$25+ (premium service level)'
          ],
          required: true
        },
        {
          id: 'q4',
          type: 'open_text',
          title: 'What would make you participate in a credit-based feedback economy?',
          description: 'Share your thoughts on the proposed attention economy model',
          required: false
        }
      ]
    };

    console.log('Creating scenario for project:', projectId);

    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        project_id: projectId,
        content: scenarioContent,
        is_generated: false,
        is_edited: false,
        metadata: {
          tone: 'professional',
          length: 'medium',
          template: 'wtp'
        }
      })
      .select()
      .single();

    if (scenarioError) {
      console.error('Scenario creation error:', scenarioError);
      return;
    }

    console.log('Scenario created successfully!');
    console.log('Scenario ID:', scenario.id);
    console.log('Questions count:', scenarioContent.questions.length);

    // Create a round for the project
    console.log('Creating round for project...');
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        project_id: projectId,
        title: 'Attention Economy Validation Round 1',
        type: 'survey',
        status: 'active'
      })
      .select()
      .single();

    if (roundError) {
      console.error('Round creation error:', roundError);
      return;
    }

    console.log('Round created:', round.id);

    // Link scenario to round
    await supabase
      .from('scenarios')
      .update({ round_id: round.id })
      .eq('id', scenario.id);

    console.log('Scenario linked to round');

  } catch (e) {
    console.error('Exception:', e);
  }
}

createTestScenario();