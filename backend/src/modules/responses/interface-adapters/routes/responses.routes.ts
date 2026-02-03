import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResponsePresenter } from '../presenters/response.presenter';

const router = Router();
const presenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

// Get responses by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetResponsesByProjectIdUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get response by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetResponseUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;



