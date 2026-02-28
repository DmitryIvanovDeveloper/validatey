import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { AdminAccessDeniedError } from '../../domain/errors/admin.error';
import { SupabaseAuthProvider } from '../../../auth/infrastructure/supabase-auth-provider';
import { ListFeedbackUseCase } from '../../../feedback/application/use-cases/list-feedback.use-case';
import { AnalyzeFeedbackUseCase } from '../../../feedback/application/use-cases/analyze-feedback.use-case';
import { TYPES as FEEDBACK_TYPES } from '../../../feedback/infrastructure/bootstrap/types';
import { ListWishlistUseCase } from '../../../wishlist/application/use-cases/list-wishlist.use-case';
import { TYPES as WISHLIST_TYPES } from '../../../wishlist/application/types';

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

/** GET /api/admin/feedback — list all feedback tickets (admin only). Session from cookie. */
router.get('/feedback', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const listFeedbackUseCase = container.get<ListFeedbackUseCase>(FEEDBACK_TYPES.ListFeedbackUseCase);
    const feedbackResult = await listFeedbackUseCase.execute({ callerUserId: user.id });

    if (!feedbackResult.isSuccess) {
      if (feedbackResult.error instanceof AdminAccessDeniedError) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      return res.status(500).json({ error: feedbackResult.error instanceof Error ? feedbackResult.error.message : 'Unknown error' });
    }

    const listUsersUseCase = container.get<ListUsersUseCase>(TYPES.ListUsersUseCase);
    const usersResult = await listUsersUseCase.execute({ callerUserId: user.id });
    const userMap = new Map<string, { email: string | null; displayName: string | null }>();
    if (usersResult.isSuccess && usersResult.data.users) {
      for (const u of usersResult.data.users) {
        userMap.set(u.id, { email: u.email ?? null, displayName: u.displayName ?? null });
      }
    }

    const author = (userId: string | null) =>
      userId ? (userMap.get(userId) ?? { email: null, displayName: null }) : { email: null, displayName: null };

    const feedback = feedbackResult.data.feedback.map((f) => {
      const { email, displayName } = author(f.userId);
      return {
        id: f.id,
        type: f.type,
        text: f.text,
        screenshotUrl: f.screenshotUrl,
        userId: f.userId,
        authorEmail: email,
        authorDisplayName: displayName,
        pageUrl: f.pageUrl,
        createdAt: f.createdAt.toISOString(),
      };
    });
    return res.json({ feedback });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

/** POST /api/admin/feedback/analyze — AI analysis of feedback (admin only). Session from cookie. Body not used: backend loads all feedback from Supabase. */
router.post('/feedback/analyze', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const analyzeFeedbackUseCase = container.get<AnalyzeFeedbackUseCase>(FEEDBACK_TYPES.AnalyzeFeedbackUseCase);
    const result = await analyzeFeedbackUseCase.execute({ callerUserId: user.id });

    if (!result.isSuccess) {
      if (result.error instanceof AdminAccessDeniedError) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      return res.status(500).json({ error: result.error instanceof Error ? result.error.message : 'Unknown error' });
    }

    return res.json({ analysis: result.data.analysis });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

/** GET /api/admin/wishlist — list all wishlist entries (admin only). Session from cookie. */
router.get('/wishlist', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const listWishlistUseCase = container.get<ListWishlistUseCase>(WISHLIST_TYPES.ListWishlistUseCase);
    const result = await listWishlistUseCase.execute({ callerUserId: user.id });

    if (!result.isSuccess) {
      if (result.error instanceof AdminAccessDeniedError) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      return res.status(500).json({ error: result.error instanceof Error ? result.error.message : 'Unknown error' });
    }

    return res.json({ wishlist: result.data.wishlist });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

export default router;
