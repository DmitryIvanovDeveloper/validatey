import { Router, Request, Response } from 'express';
import { SupabaseAuthProvider } from '../../infrastructure/supabase-auth-provider';

const router = Router();
const authProvider = new SupabaseAuthProvider();

const COOKIE_NAME = 'validatey_auth';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

/** GET /api/auth/google-url?redirect_to=https://frontend/auth/callback → { url } */
router.get('/google-url', async (req: Request, res: Response) => {
  try {
    const redirectTo = (req.query.redirect_to as string)?.trim();
    if (!redirectTo) {
      return res.status(400).json({ error: 'redirect_to query is required' });
    }
    const url = await authProvider.getGoogleAuthUrl(redirectTo);
    return res.json({ url });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Auth error' });
  }
});

/** POST /api/auth/session { access_token } → set cookie, return { user } */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const accessToken = (req.body?.access_token as string)?.trim();
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' });
    }
    const user = await authProvider.getUserFromAccessToken(accessToken);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.cookie(COOKIE_NAME, accessToken, COOKIE_OPTS);
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Auth error' });
  }
});

/** GET /api/auth/session → from cookie, return { user } or 401 */
router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }
    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.status(401).json({ error: 'Invalid session' });
    }
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Auth error' });
  }
});

/** POST /api/auth/sign-out → clear cookie */
router.post('/sign-out', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.status(204).send();
});

export default router;
