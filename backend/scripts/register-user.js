/**
 * One-off script to register a user via API. Run after backend is up:
 *   node scripts/register-user.js
 * Or: node scripts/register-user.js <email> <password>
 */
const email = process.argv[2] || 'dmitry.ivanov.developer@mail.com';
const password = process.argv[3] || 'Qweasdzxc117';
const base = process.env.API_BASE_URL || 'http://localhost:3000';

async function main() {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Registration failed:', res.status, data.error || data);
    process.exit(1);
  }
  console.log('Registered:', data.user?.email || data.user?.id);
}

main();
