// Script to reset research cooldown for a project
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or hardcode for testing
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Project identifier (slug or ID)
const projectSlug = 'give-to-get-hypothesis';

async function resetCooldown() {
  try {
    console.log(`Resetting cooldown for project: ${projectSlug}`);

    // First, find the project by slug
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('slug', projectSlug)
      .single();

    if (projectError || !project) {
      console.error('Project not found:', projectError);
      return;
    }

    console.log(`Found project: ${project.name} (ID: ${project.id})`);

    // Reset the cooldown by setting last_research_run_at to past date
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 25); // 25 hours ago to ensure cooldown is reset

    const { data, error } = await supabase
      .from('research_data')
      .update({
        last_research_run_at: pastDate.toISOString()
      })
      .eq('project_id', project.id);

    if (error) {
      console.error('Error resetting cooldown:', error);
    } else {
      console.log('✅ Cooldown reset successfully!');
      console.log(`New last_research_run_at: ${pastDate.toISOString()}`);
    }

  } catch (error) {
    console.error('Exception:', error);
  }
}

resetCooldown();