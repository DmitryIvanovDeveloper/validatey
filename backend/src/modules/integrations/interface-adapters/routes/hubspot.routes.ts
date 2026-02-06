import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';

const router = Router();

/** Type for fetch() response to avoid conflict with Express Response */
type FetchResponse = Awaited<ReturnType<typeof fetch>>;

const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_CONTACTS_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';
const SCOPES = 'crm.objects.contacts.read';

/**
 * GET /api/integrations/hubspot/status
 * Returns whether HubSpot is connected for the current user.
 */
router.get('/status', async (req: Request, res: Response) => {
  const configured = !!(process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET);
  const userId = (req.headers['x-user-id'] as string)?.trim();
  let connected = false;
  if (userId && configured) {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from('hubspot_tokens').select('user_id').eq('user_id', userId).maybeSingle();
      connected = !!data?.user_id;
    } catch {
      // ignore
    }
  }
  res.json({ connected, configured });
});

/**
 * GET /api/integrations/hubspot/authorize
 * When Accept: application/json or query json=1: returns { url } for frontend to redirect.
 * Otherwise redirects to HubSpot (legacy).
 */
router.get('/authorize', async (req: Request, res: Response) => {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const returnTo = (req.query.returnTo as string) || '/projects';
  if (!clientId) {
    res.status(501).json({
      error: 'HubSpot integration is not configured',
      message: 'Set HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET to enable HubSpot OAuth.',
    });
    return;
  }
  const redirectUri =
    process.env.HUBSPOT_REDIRECT_URI ||
    `${process.env.FRONTEND_ORIGIN || 'http://localhost:5174'}/integrations/hubspot/callback`;
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES)}&state=${encodeURIComponent(returnTo)}`;

  const wantsJson = req.query.json === '1' || req.headers.accept?.includes('application/json');
  if (wantsJson) {
    res.json({ url: authUrl });
    return;
  }
  res.redirect(302, authUrl);
});

/**
 * POST /api/integrations/hubspot/callback
 * Body: { code }. Header: x-user-id.
 * Exchanges code for token and stores for user.
 */
router.post('/callback', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string)?.trim();
  if (!userId) {
    res.status(400).json({ error: 'x-user-id header is required' });
    return;
  }
  const code = (req.body?.code as string)?.trim();
  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(501).json({ error: 'HubSpot integration is not configured' });
    return;
  }
  const redirectUri =
    process.env.HUBSPOT_REDIRECT_URI ||
    `${process.env.FRONTEND_ORIGIN || 'http://localhost:5174'}/integrations/hubspot/callback`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
  let tokenRes: FetchResponse;
  try {
    tokenRes = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (e) {
    console.error('HubSpot token exchange request failed', e);
    res.status(502).json({ error: 'Failed to connect to HubSpot' });
    return;
  }
  const data = (await tokenRes.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    message?: string;
    error?: string;
  };
  if (!tokenRes.ok) {
    res.status(400).json({ error: data.message || data.error || 'Token exchange failed' });
    return;
  }
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresIn = data.expires_in; // seconds
  if (!accessToken) {
    res.status(400).json({ error: 'No access_token in response' });
    return;
  }
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
  try {
    const supabase = getSupabaseClient();
    await supabase.from('hubspot_tokens').upsert(
      {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.error('HubSpot token save failed', e);
    res.status(500).json({ error: 'Failed to save connection' });
    return;
  }
  res.json({ ok: true });
});

/**
 * GET /api/integrations/hubspot/contacts?segment=all|recent
 * Returns list of contacts with email. segment=recent: last 30 days.
 */
router.get('/contacts', async (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string)?.trim();
  if (!userId) {
    res.status(400).json({ error: 'x-user-id header is required' });
    return;
  }
  const segment = (req.query.segment as string) || 'all';
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch {
    res.status(500).json({ error: 'Database unavailable' });
    return;
  }
  const { data: row } = await supabase.from('hubspot_tokens').select('access_token').eq('user_id', userId).single();
  if (!row?.access_token) {
    res.status(401).json({ error: 'HubSpot not connected' });
    return;
  }
  const token = row.access_token as string;
  const props = 'email,firstname,lastname,createdate';
  const limit = 500;
  let url = `${HUBSPOT_CONTACTS_URL}?properties=${encodeURIComponent(props)}&limit=${limit}`;
  if (segment === 'recent') {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceMs = since.getTime();
    url += `&sorts=${encodeURIComponent('-createdate')}`;
    // HubSpot search: we'll filter by createdate in memory if needed, or use search endpoint
  }
  let apiRes: FetchResponse;
  try {
    apiRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.error('HubSpot contacts request failed', e);
    res.status(502).json({ error: 'Failed to fetch contacts from HubSpot' });
    return;
  }
  const json = (await apiRes.json().catch(() => ({}))) as {
    results?: Array<{ properties?: { email?: string; createdate?: string } }>;
    message?: string;
    error?: string;
  };
  if (!apiRes.ok) {
    res.status(apiRes.status).json({ error: json.message || json.error || 'HubSpot API error' });
    return;
  }
  const results = json.results || [];
  let emails = [...new Set(results.map((c) => c.properties?.email).filter(Boolean))] as string[];
  if (segment === 'recent') {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    emails = [...new Set(
      results
        .filter((r) => {
          const created = r.properties?.createdate;
          if (!created) return false;
          return new Date(created).getTime() >= thirtyDaysAgo;
        })
        .map((r) => r.properties?.email)
        .filter(Boolean)
    )] as string[];
  }
  res.json({ emails });
});

export default router;
