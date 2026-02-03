import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResponsePresenter } from '../presenters/response.presenter';

const router = Router();
const presenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

// Get responses by project (MUST be before /:id route)
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    console.log('[responses.routes] Getting responses for project:', projectId);
    
    const result = await presenter.getResponsesByProjectId({ projectId });

    if (!result.isSuccess) {
      console.error('[responses.routes] Error getting responses:', result.error);
      return res.status(400).json({ error: result.error.message });
    }

    // Serialize dates to ISO strings
    const responses = result.data.responses.map(response => ({
      ...response,
      createdAt: response.createdAt instanceof Date ? response.createdAt.toISOString() : response.createdAt,
      updatedAt: response.updatedAt instanceof Date ? response.updatedAt.toISOString() : response.updatedAt,
    }));

    console.log('[responses.routes] Returning', responses.length, 'responses');
    return res.status(200).json({ responses });
  } catch (error) {
    console.error('[responses.routes] Exception:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get response by ID (MUST be after /project/:projectId route)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if this is actually a projectId request (shouldn't happen, but just in case)
    if (id === 'project') {
      return res.status(400).json({ error: 'Invalid route. Use /project/:projectId instead' });
    }
    // TODO: Add GetResponseUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;



