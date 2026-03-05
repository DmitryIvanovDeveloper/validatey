/**
 * Check waitlist embed on site: landing page + embed script + API.
 * Run: node scripts/check-waitlist-embed.js
 * Set BASE=http://localhost:8080 SLUG=project-23071e04 for local.
 */
const BASE = process.env.BASE || 'http://localhost:8080';
const SLUG = process.env.SLUG || 'project-23071e04';

async function check() {
  let ok = true;
  const landingUrl = `${BASE}/l/${SLUG}/`;
  const embedUrl = `${BASE}/embed/waitlist.js`;
  const apiUrl = `${BASE}/api/wishlist`;

  console.log('Checking waitlist embed on site...\n');

  const landingRes = await fetch(landingUrl, { redirect: 'follow' });
  if (!landingRes.ok) {
    console.log('FAIL: Landing page', landingUrl, landingRes.status);
    ok = false;
  } else {
    const html = await landingRes.text();
    const hasContainer = html.includes('id="validatey-waitlist"');
    const hasScript = html.includes('embed/waitlist.js');
    const hasSection = html.includes('Get notified') || html.includes('waitlist');
    console.log('Landing', landingUrl, landingRes.status);
    console.log('  Widget container (id=validatey-waitlist):', hasContainer ? 'YES' : 'NO');
    console.log('  Embed script (embed/waitlist.js):', hasScript ? 'YES' : 'NO');
    if (!hasContainer || !hasScript) {
      console.log('  -> Re-upload landing zip that includes the waitlist snippet to see the widget on the page.');
    }
  }

  const scriptRes = await fetch(embedUrl);
  if (!scriptRes.ok) {
    console.log('FAIL: Embed script', embedUrl, scriptRes.status);
    ok = false;
  } else {
    console.log('Embed script', embedUrl, scriptRes.status, scriptRes.headers.get('content-type'));
  }

  const testEmail = `embed-verify-${Date.now()}@example.com`;
  const postRes = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, projectId: '23071e04-a90f-4b66-bcd5-fd2f8498a3e2' }),
  });
  const postData = postRes.ok ? await postRes.json() : null;
  if (postRes.status !== 201) {
    console.log('FAIL: Wishlist API POST', postRes.status, postData || await postRes.text());
    ok = false;
  } else {
    console.log('Wishlist API POST', postRes.status, 'projectId:', postData?.projectId || 'ok');
  }

  console.log(ok ? '\nAll checks passed.' : '\nSome checks failed.');
  process.exit(ok ? 0 : 1);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
