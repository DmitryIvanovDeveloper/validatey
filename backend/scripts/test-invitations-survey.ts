#!/usr/bin/env ts-node
/**
 * Test survey platforms API in invitations module.
 * Usage: npx ts-node --transpile-only scripts/test-invitations-survey.ts
 */
import fetch from 'node-fetch';

async function main() {
  console.log('Testing new invitations survey platforms endpoint...');

  try {
    const response = await fetch('http://localhost:8080/api/projects/e42b2f67-9502-428a-b97f-d1b14b30d366/invitations/suggest-platforms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Platforms count:', data.platforms?.length || 0);
    console.log('First platform:', data.platforms?.[0]);
  } catch (error) {
    console.error('Network error:', error);
  }
}

main();