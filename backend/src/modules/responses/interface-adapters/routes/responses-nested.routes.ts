import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResponsePresenter } from '../presenters/response.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

// Get responses by project (nested route: /projects/:projectId/responses)
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    console.log('[responses-nested.routes] Getting responses for project:', projectId);
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const result = await presenter.getResponsesByProjectId({ projectId });

    if (!result.isSuccess) {
      console.error('[responses-nested.routes] Error getting responses:', result.error);
      return res.status(400).json({ error: result.error.message });
    }

    // Serialize dates to ISO strings
    const responses = result.data.responses.map(response => ({
      ...response,
      createdAt: response.createdAt instanceof Date ? response.createdAt.toISOString() : response.createdAt,
      updatedAt: response.updatedAt instanceof Date ? response.updatedAt.toISOString() : response.updatedAt,
    }));

    console.log('[responses-nested.routes] Returning', responses.length, 'responses');
    return res.status(200).json({ responses });
  } catch (error) {
    console.error('[responses-nested.routes] Exception:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
