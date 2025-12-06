import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ReportPresenter } from '../presenters/report.presenter';

const router = Router();
const presenter = container.get<ReportPresenter>(TYPES.ReportPresenter);

// Get report by token (public endpoint)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const result = await presenter.getReportByToken({
      token: req.params.token,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'ReportNotFoundError') {
        return res.status(404).json({ error: 'Report not found' });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

