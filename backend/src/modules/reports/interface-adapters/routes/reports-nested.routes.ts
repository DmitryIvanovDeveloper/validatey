import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ReportController } from '../controllers/report.controller';

const router = Router({ mergeParams: true });
const controller = container.get<ReportController>(TYPES.ReportController);

// GET /projects/:projectId/report — report view data from live metrics (template-aware)
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.getReportData({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /projects/:projectId/report/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const result = await controller.generateReport({
      projectId,
      includePDF: req.body.includePDF || false,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    // Return 202 Accepted for async task
    return res.status(202).json({ message: 'Report generation queued', reportId: result.data.report.id });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/report/html
router.get('/html', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    // TODO: Add GetReportHtmlUseCase
    return res.status(501).json({ error: 'Get report HTML not implemented yet', projectId });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/report/pdf
router.get('/pdf', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    // TODO: Add GetReportPdfUseCase
    return res.status(501).json({ error: 'Get report PDF not implemented yet', projectId });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

