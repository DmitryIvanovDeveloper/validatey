/**
 * POST local audio file to /api/projects/:projectId/transcription (Whisper).
 *
 * Usage:
 *   node scripts/transcribe-local-file.mjs <path-to-audio> <projectId> <userId>
 * Or set in .env: TRANSCRIBE_PROJECT_ID, TRANSCRIBE_USER_ID
 *   node scripts/transcribe-local-file.mjs <path-to-audio>
 *
 * Requires: backend running (default http://localhost:8080), OPENAI_API_KEY, Supabase migration applied.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Load .env from backend root if dotenv didn't (cwd may differ)
import dotenv from 'dotenv';
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local') });

const filePath = process.argv[2] || process.env.TRANSCRIBE_FILE;
const projectId =
  process.argv[3] || process.env.TRANSCRIBE_PROJECT_ID || process.env.TEST_PROJECT_ID;
const userId = process.argv[4] || process.env.TRANSCRIBE_USER_ID || process.env.TEST_USER_ID;
const baseUrl = (process.env.API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

if (!filePath || !fs.existsSync(filePath)) {
  console.error('File not found. Usage: node scripts/transcribe-local-file.mjs <audio-path> [projectId] [userId]');
  process.exit(1);
}
if (!projectId || !userId) {
  console.error(
    'Missing projectId or userId. Pass as args or set TRANSCRIBE_PROJECT_ID and TRANSCRIBE_USER_ID (or TEST_PROJECT_ID / TEST_USER_ID) in backend/.env'
  );
  process.exit(1);
}

const buf = fs.readFileSync(filePath);
const name = path.basename(filePath);
const ext = path.extname(name).toLowerCase();
const mime =
  ext === '.wav'
    ? 'audio/wav'
    : ext === '.mp3'
      ? 'audio/mpeg'
      : ext === '.webm'
        ? 'audio/webm'
        : 'application/octet-stream';

const form = new FormData();
form.append('audio', new Blob([buf], { type: mime }), name);

const url = `${baseUrl}/api/projects/${projectId}/transcription`;
console.error('POST', url);
console.error('File:', filePath, `(${buf.length} bytes)`);

const res = await fetch(url, {
  method: 'POST',
  headers: { 'x-user-id': userId },
  body: form,
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = text;
}

console.log(JSON.stringify({ status: res.status, body: json }, null, 2));
process.exit(res.ok ? 0 : 1);
