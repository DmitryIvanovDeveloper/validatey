/**
 * Debug: call Google Places Autocomplete API and log raw response.
 * Run: npx ts-node scripts/test-google-places-api.ts
 * Requires: GOOGLE_PLACES_API_KEY in .env
 */
import 'dotenv/config';

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();

async function main() {
  if (!apiKey) {
    console.error('GOOGLE_PLACES_API_KEY not set');
    process.exit(1);
  }

  const input = 'pizza in';
  console.log('Request:', { url: PLACES_AUTOCOMPLETE_URL, input });

  try {
    const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({ input }),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response (raw):', text.slice(0, 2000));

    if (res.ok) {
      const json = JSON.parse(text);
      console.log('Keys:', Object.keys(json));
      if (json.suggestions) {
        console.log('Suggestions count:', json.suggestions.length);
        if (json.suggestions[0]) {
          console.log('First suggestion keys:', Object.keys(json.suggestions[0]));
          console.log('First suggestion:', JSON.stringify(json.suggestions[0], null, 2).slice(0, 800));
        }
      }
    }
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

main();
