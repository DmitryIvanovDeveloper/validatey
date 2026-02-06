/**
 * A/B Test: Google Places Autocomplete
 *
 * Compares synthesis reports with and without Google Places data.
 * Run: npx ts-node scripts/ab-test-google-places.ts [projectId] [userId]
 *
 * Requires: Backend running on API_BASE (default http://localhost:3000)
 * Env: API_BASE, or pass as 3rd arg
 */
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.API_BASE || process.argv[4] || 'http://localhost:3000';
const PROJECT_ID = process.argv[2] || 'dcdb1e69-e6ac-4670-a368-d0e2af8bcc92';
const USER_ID = process.argv[3] || '557d8359-8503-478b-940b-e43df58e924a';

const COLLECT_BODY = {
  geography: 'Moscow, Russia',
  segment: 'B2B SaaS founders',
  productDescription: 'Validation survey platform for product-market fit',
};

async function collect(skipAutocomplete: boolean) {
  const res = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/research/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': USER_ID,
    },
    body: JSON.stringify({
      ...COLLECT_BODY,
      skipAutocomplete,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Collect failed (skipAutocomplete=${skipAutocomplete}): ${res.status} ${text}`);
  }
  return res.json();
}

async function synthesis() {
  const res = await fetch(`${API_BASE}/api/projects/${PROJECT_ID}/research/synthesis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': USER_ID,
    },
    body: '{}',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Synthesis failed: ${res.status} ${text}`);
  }
  return res.json();
}

type SynthesisResponse = { report: { summary?: string; recommendations?: string[] } };

function compareReports(a: SynthesisResponse, b: SynthesisResponse) {
  const sa = (a.report?.summary ?? '').trim();
  const sb = (b.report?.summary ?? '').trim();
  const ra = a.report?.recommendations ?? [];
  const rb = b.report?.recommendations ?? [];

  const summarySame = sa === sb;
  const recsSame = ra.length === rb.length && ra.every((r, i) => r === rb[i]);

  return {
    summarySame,
    summaryLengthA: sa.length,
    summaryLengthB: sb.length,
    recsSame,
    recsCountA: ra.length,
    recsCountB: rb.length,
  };
}

async function main() {
  console.log('A/B Test: Google Places Autocomplete');
  console.log('Project:', PROJECT_ID, '| API:', API_BASE);
  console.log('Collect params:', JSON.stringify(COLLECT_BODY, null, 2));
  console.log('');

  // 1) With autocomplete
  console.log('1. Collect WITH autocomplete...');
  const collectA = await collect(false);
  console.log('   ', collectA);
  console.log('2. Synthesis...');
  const synthA = await synthesis();
  const outDir = path.join(__dirname, '../ab-test-output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'report-with-places.json'),
    JSON.stringify(synthA, null, 2)
  );
  console.log('   Saved to ab-test-output/report-with-places.json');

  // 2) Without autocomplete
  console.log('');
  console.log('3. Collect WITHOUT autocomplete...');
  const collectB = await collect(true);
  console.log('   ', collectB);
  console.log('4. Synthesis...');
  const synthB = await synthesis();
  fs.writeFileSync(
    path.join(outDir, 'report-without-places.json'),
    JSON.stringify(synthB, null, 2)
  );
  console.log('   Saved to ab-test-output/report-without-places.json');

  // 5) Compare
  const cmp = compareReports(synthA as SynthesisResponse, synthB as SynthesisResponse);
  console.log('');
  console.log('=== Comparison ===');
  console.log('Summary same:', cmp.summarySame, '| lengths:', cmp.summaryLengthA, 'vs', cmp.summaryLengthB);
  console.log('Recommendations same:', cmp.recsSame, '| counts:', cmp.recsCountA, 'vs', cmp.recsCountB);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
