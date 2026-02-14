import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { AUTH_TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { GetUserRolePort } from '../../application/ports/get-user-role.port';
import { SupabaseAuthProvider } from '../../infrastructure/supabase-auth-provider';

const router = Router();
const authProvider = new SupabaseAuthProvider();

const COOKIE_NAME = 'validatey_auth';
const COOKIE_REFRESH_NAME = 'validatey_refresh';
// Cross-origin (frontend on validatey.vercel.app, backend on validatey-backend.vercel.app) requires SameSite=None so the cookie is sent with fetch(credentials: 'include').
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

function setSessionCookies(res: Response, accessToken: string, refreshToken?: string): void {
  res.cookie(COOKIE_NAME, accessToken, COOKIE_OPTS);
  if (refreshToken) {
    res.cookie(COOKIE_REFRESH_NAME, refreshToken, COOKIE_OPTS);
  }
}

function clearSessionCookies(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/', sameSite: COOKIE_OPTS.sameSite, secure: COOKIE_OPTS.secure });
  res.clearCookie(COOKIE_REFRESH_NAME, { path: '/', sameSite: COOKIE_OPTS.sameSite, secure: COOKIE_OPTS.secure });
}

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

/** POST /api/auth/login { email, password } → set cookie, return { user, role } */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = (req.body?.email as string)?.trim();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const session = await authProvider.signInWithEmailPassword(email, password);
    if (!session.accessToken) {
      return res.status(500).json({ error: 'Sign in failed' });
    }
    const getRole = container.get<GetUserRolePort>(AUTH_TYPES.GetUserRole);
    const role = await getRole.getRole(session.user.id);
    setSessionCookies(res, session.accessToken, session.refreshToken);
    return res.json({ user: session.user, role });
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

/** POST /api/auth/session { access_token } → set cookie, return { user, role } */
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
    const getRole = container.get<GetUserRolePort>(AUTH_TYPES.GetUserRole);
    const role = await getRole.getRole(user.id);
    res.cookie(COOKIE_NAME, accessToken, COOKIE_OPTS);
    return res.json({ user, role });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Auth error' });
  }
});

/** GET /api/auth/session → from cookie (or refresh token if access expired), return { user, role } or 401 */
router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    const refreshToken = req.cookies?.[COOKIE_REFRESH_NAME];
    const getRole = container.get<GetUserRolePort>(AUTH_TYPES.GetUserRole);

    if (token) {
      const user = await authProvider.getUserFromAccessToken(token);
      if (user) {
        const role = await getRole.getRole(user.id);
        return res.json({ user, role });
      }
    }

    if (refreshToken) {
      const session = await authProvider.refreshSession(refreshToken);
      if (session?.accessToken) {
        setSessionCookies(res, session.accessToken, session.refreshToken);
        const role = await getRole.getRole(session.user.id);
        return res.json({ user: session.user, role });
      }
    }

    clearSessionCookies(res);
    return res.status(401).json({ error: 'No session' });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Auth error' });
  }
});


/** POST /api/auth/sign-out → clear cookies */
router.post('/sign-out', (_req: Request, res: Response) => {
  clearSessionCookies(res);
  return res.status(204).send();
});

export default router;
