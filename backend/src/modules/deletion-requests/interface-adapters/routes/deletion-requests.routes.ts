import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { DeletionRequestController } from '../controllers/deletion-request.controller';

const router = Router();
const controller = container.get<DeletionRequestController>(TYPES.DeletionRequestController);

/** POST /api/deletion-requests — create a deletion request (public; e.g. from privacy form). */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, identifier, requestedBy } = req.body || {};
    const result = await controller.createDeletionRequest({
      projectId: projectId ?? '',
      identifier: identifier ?? '',
      requestedBy: requestedBy ?? null,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(201).json({
      request: {
        ...result.data.request,
        requestedAt: result.data.request.requestedAt.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
