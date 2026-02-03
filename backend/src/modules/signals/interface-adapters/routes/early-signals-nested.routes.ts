import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { EarlySignalsPresenter } from '../presenters/early-signals.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<EarlySignalsPresenter>(TYPES.EarlySignalsPresenter);

router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const result = await presenter.getEarlySignalsByProjectId({ projectId });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    const signals = result.data.signals.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      description: s.description,
      timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : s.timestamp,
    }));

    return res.status(200).json({ signals });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
