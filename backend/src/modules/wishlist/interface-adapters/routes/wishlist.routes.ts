import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../application/types';
import { WishlistController } from '../controllers/wishlist.controller';

const router = Router();
const controller = container.get<WishlistController>(TYPES.WishlistController);

/** POST /api/wishlist - Add email to wishlist (optional projectId for landing embed) */
router.post('/', async (req: Request, res: Response) => {
  try {
    const email = req.body?.email as string | undefined;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const projectId = (req.body?.projectId as string | undefined)?.trim() || undefined;

    const result = await controller.addToWishlist({ email, projectId });

    if (!result.isSuccess) {
      if (result.error.message.includes('already exists')) {
        return res.status(409).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json({
      id: result.data.id,
      email: result.data.email,
      projectId: result.data.projectId ?? null,
      createdAt: result.data.createdAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** GET /api/wishlist/count - Get total wishlist count */
router.get('/count', async (req: Request, res: Response) => {
  try {
    const result = await controller.getWishlistCount();

    if (!result.isSuccess) {
      return res.status(500).json({ error: result.error.message });
    }

    return res.status(200).json({
      count: result.data.count,
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
