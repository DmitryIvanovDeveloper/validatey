#!/usr/bin/env ts-node
/**
 * Test survey platforms suggestion for project "PII Guardian".
 * Usage: npx ts-node --transpile-only scripts/test-survey-platforms.ts
 */
import 'dotenv/config';
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { getSupabaseClient } from '../src/infrastructure/database/supabase-client';

async function main() {
  const supabase = getSupabaseClient();

  const { data: projects, error: e1 } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', '%PII Guardian%');

  if (e1) {
    console.error('Projects error:', e1);
    return;
  }
  if (!projects?.length) {
    console.error('Project "PII Guardian" not found.');
    return;
  }

  const projectId = projects[0].id;
  console.log('Testing survey platforms suggestion for project:', projects[0].name, '| id:', projectId);

  // Test the API endpoint
  const response = await fetch(`http://localhost:8080/api/projects/${projectId}/survey-platforms-suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('Response status:', response.status);
  const result = await response.json();
  console.log('Response:', JSON.stringify(result, null, 2));
}

main().catch(console.error);