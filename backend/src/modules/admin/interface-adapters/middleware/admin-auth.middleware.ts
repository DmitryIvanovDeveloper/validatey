import { Request, Response, NextFunction } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { AUTH_TYPES } from '../../../auth/infrastructure/bootstrap/types';
import { SupabaseAuthProvider } from '../../../auth/infrastructure/supabase-auth-provider';
import { AdminAccessDeniedError } from '../../domain/errors/admin.error';
import { TYPES as ADMIN_TYPES } from '../../infrastructure/bootstrap/types';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';

const COOKIE_NAME = 'validatey_auth';
const COOKIE_REFRESH_NAME = 'validatey_refresh';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    displayName: string | null;
  };
}

export async function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    const refreshToken = req.cookies?.[COOKIE_REFRESH_NAME];
    const authProvider = new SupabaseAuthProvider();

    let user = null;

    if (token) {
      user = await authProvider.getUserFromAccessToken(token);
    }

    if (!user && refreshToken) {
      const session = await authProvider.refreshSession(refreshToken);
      if (session?.accessToken) {
        // Обновляем куки с новыми токенами
        const isProduction = process.env.NODE_ENV === 'production';
        const COOKIE_OPTS = {
          httpOnly: true,
          secure: isProduction,
          sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        };

        res.cookie(COOKIE_NAME, session.accessToken, COOKIE_OPTS);
        if (session.refreshToken) {
          res.cookie(COOKIE_REFRESH_NAME, session.refreshToken, COOKIE_OPTS);
        }
        user = session.user;
      }
    }

    if (!user) {
      res.status(401).json({ error: 'No session' });
      return;
    }

    // Проверяем роль пользователя
    const getUserRole = container.get<GetUserRolePort>(AUTH_TYPES.GetUserRole);
    const role = await getUserRole.getRole(user.id);

    if (role !== 'admin') {
      next(new AdminAccessDeniedError(user.id));
      return;
    }

    // Добавляем пользователя в request
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    next();
  } catch (error) {
    next(error);
  }
}