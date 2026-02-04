import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
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

/** POST /api/auth/register { email, password } → set cookie, return { user } */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email as string)?.trim();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const session = await authProvider.signUpWithEmailPassword(email, password);
    if (session.accessToken) {
      res.cookie(COOKIE_NAME, session.accessToken, COOKIE_OPTS);
    }
    return res.status(201).json({
      user: session.user,
      requiresEmailConfirmation: !session.accessToken,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Registration failed';
    let status = 400;
    if (message.startsWith('RATE_LIMIT:')) {
      status = 429;
      return res.status(status).json({ error: message.replace(/^RATE_LIMIT:\s*/, '') });
    }
    if (message.toLowerCase().includes('already registered')) status = 409;
    return res.status(status).json({ error: message });
  }
});

/** POST /api/auth/login { email, password } → set cookie, return { user } */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email as string)?.trim();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const session = await authProvider.signInWithEmailPassword(email, password);
    res.cookie(COOKIE_NAME, session.accessToken, COOKIE_OPTS);
    return res.json({ user: session.user });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sign in failed';
    return res.status(401).json({ error: message });
  }
});

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

/** POST /api/auth/link-previous-user { previousUserId } → reassign projects from anonymous id to current user (requires session) */
router.post('/link-previous-user', async (req: Request, res: Response) => {
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
    const previousUserId = (req.body?.previousUserId as string)?.trim();
    if (!previousUserId) {
      return res.status(400).json({ error: 'previousUserId is required' });
    }
    if (previousUserId === user.id) {
      return res.json({ linked: 0 });
    }
    const projectRepo = container.get<ProjectRepositoryPort>(PROJECT_TYPES.ProjectRepository);
    const result = await projectRepo.reassignUserId(previousUserId, user.id);
    if (!result.isSuccess) {
      return res.status(500).json({ error: result.error.message });
    }
    return res.json({ linked: result.data });
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
