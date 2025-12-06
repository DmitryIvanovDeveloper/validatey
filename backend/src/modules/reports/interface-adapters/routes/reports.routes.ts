import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ReportPresenter } from '../presenters/report.presenter';

const router = Router();
const presenter = container.get<ReportPresenter>(TYPES.ReportPresenter);

// Generate report
router.post('/generate/:projectId', async (req: Request, res: Response) => {
  try {
    const result = await presenter.generateReport({
      projectId: req.params.projectId,
      includePDF: req.body.includePDF || false,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get report by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetReportsByProjectIdUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

