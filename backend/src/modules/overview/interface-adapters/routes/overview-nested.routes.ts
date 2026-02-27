import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { OverviewController } from '../controllers/overview.controller';

const router = Router({ mergeParams: true });
const controller = container.get<OverviewController>(TYPES.OverviewController);

/** GET /projects/:projectId/overview — Overview command center data. Auth: x-user-id header OR guestSlug (query or x-guest-slug header) for guest view. */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const guestSlug = (req.query.guestSlug || req.headers['x-guest-slug']) as string | undefined;
    const trimmedGuestSlug = typeof guestSlug === 'string' ? guestSlug.trim() || undefined : undefined;
    const userId = (req.headers['x-user-id'] || req.body?.userId) as string | undefined;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    if (!trimmedGuestSlug && !userId) {
      return res.status(400).json({
        error: 'userId or guestSlug is required',
        hint: 'Provide x-user-id header or guestSlug query / x-guest-slug header',
      });
    }

    const result = await controller.getOverview({
      projectId,
      userId: trimmedGuestSlug ? undefined : userId,
      guestSlug: trimmedGuestSlug,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(500).json({ error: result.error.message });
    }

    const data = result.data;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
