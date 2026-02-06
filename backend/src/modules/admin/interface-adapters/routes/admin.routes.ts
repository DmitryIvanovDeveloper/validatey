import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { AdminAccessDeniedError } from '../../domain/errors/admin.error';
import { SupabaseAuthProvider } from '../../../auth/infrastructure/supabase-auth-provider';

const router = Router();
const authProvider = new SupabaseAuthProvider();
const COOKIE_NAME = 'validatey_auth';

/** GET /api/admin/users — list all users (admin only). Session from cookie. */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const listUsersUseCase = container.get<ListUsersUseCase>(TYPES.ListUsersUseCase);
    const result = await listUsersUseCase.execute({ callerUserId: user.id });

    if (!result.isSuccess) {
      if (result.error instanceof AdminAccessDeniedError) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      return res.status(500).json({ error: result.error instanceof Error ? result.error.message : 'Unknown error' });
    }

    return res.json({ users: result.data.users });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

export default router;
