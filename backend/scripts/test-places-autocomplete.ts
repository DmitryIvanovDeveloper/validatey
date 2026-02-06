/**
 * Test script: call Google Places Autocomplete API directly.
 * Run: npx ts-node scripts/test-places-autocomplete.ts
 * Requires: GOOGLE_PLACES_API_KEY in .env
 */
import 'dotenv/config';

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();

async function test() {
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY not set');
    process.exit(1);
  }

  const testPhrase = 'pizza near';
  console.log('Testing phrase:', JSON.stringify(testPhrase));
  console.log('');

  try {
    const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({ input: testPhrase }),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response (first 1500 chars):', text.slice(0, 1500));
    console.log('');

    if (!res.ok) {
      console.error('API error:', text);
      process.exit(1);
    }

    const data = JSON.parse(text) as unknown;
    console.log('Response keys:', Object.keys(data as object));
    const suggestions = (data as { suggestions?: unknown[] }).suggestions ?? [];
    console.log('Suggestions count:', suggestions.length);
    if (suggestions.length > 0) {
      console.log('First suggestion:', JSON.stringify(suggestions[0], null, 2));
    }
  } catch (e) {
    console.error('Request failed:', e);
    process.exit(1);
  }
}

test();
