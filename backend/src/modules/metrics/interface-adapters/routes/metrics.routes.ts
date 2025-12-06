import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { MetricsPresenter } from '../presenters/metrics.presenter';

const router = Router();
const presenter = container.get<MetricsPresenter>(TYPES.MetricsPresenter);

// Calculate metrics for project
router.post('/calculate/:projectId', async (req: Request, res: Response) => {
  try {
    const result = await presenter.calculateMetrics({
      projectId: req.params.projectId,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get metrics for project
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetMetricsUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

