import { Router, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { AdminController } from '../controllers/admin.controller';
import { adminAuthMiddleware, AuthenticatedRequest } from '../middleware/admin-auth.middleware';
import { AdminAccessDeniedError } from '../../domain/errors/admin.error';

const router = Router();
const controller = container.get<AdminController>(TYPES.AdminController);

/** GET /api/admin/users — list all users (admin only). */
router.get('/users', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await controller.listUsers(req.user!.id);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      res.status(403).json({ error: 'Admin access required' });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/** GET /api/admin/feedback — list all feedback tickets (admin only). */
router.get('/feedback', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await controller.listFeedback(req.user!.id);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      res.status(403).json({ error: 'Admin access required' });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/** POST /api/admin/feedback/analyze — AI analysis of feedback (admin only). */
router.post('/feedback/analyze', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await controller.analyzeFeedback(req.user!.id);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      res.status(403).json({ error: 'Admin access required' });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

/** GET /api/admin/wishlist — list all wishlist entries (admin only). */
router.get('/wishlist', adminAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await controller.listWishlist(req.user!.id);
    res.json(result);
  } catch (error) {
    if (error instanceof AdminAccessDeniedError) {
      res.status(403).json({ error: 'Admin access required' });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

export default router;
