import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../application/types';
import { WishlistController } from '../controllers/wishlist.controller';

const router = Router({ mergeParams: true });
const controller = container.get<WishlistController>(TYPES.WishlistController);

/** GET /api/projects/:projectId/wishlist — List waitlist entries for project. Auth: x-user-id header. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req.headers['x-user-id'] as string) || '';

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await controller.listByProject(projectId, userId);

    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      if (err.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
