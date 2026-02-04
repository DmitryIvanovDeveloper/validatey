import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { DeletionRequestPresenter } from '../presenters/deletion-request.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<DeletionRequestPresenter>(TYPES.DeletionRequestPresenter);

/** GET /projects/:projectId/deletion-requests — list deletion requests for project (auth recommended in middleware). */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await presenter.listDeletionRequestsByProject({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    const requests = result.data.requests.map((r) => ({
      ...r,
      requestedAt: r.requestedAt instanceof Date ? r.requestedAt.toISOString() : r.requestedAt,
      completedAt: r.completedAt ? (r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt) : null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** POST /projects/:projectId/deletion-requests/:requestId/execute — execute deletion (anonymize PII), mark request completed. */
router.post('/:requestId/execute', async (req: Request, res: Response) => {
  try {
    const requestId = req.params.requestId;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    const result = await presenter.executeDeletionRequest({ requestId });
    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'DeletionRequestNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    return res.status(200).json({
      requestId: result.data.requestId,
      status: result.data.status,
      completedAt: result.data.completedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
