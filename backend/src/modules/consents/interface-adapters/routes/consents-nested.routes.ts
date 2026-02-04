import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ConsentPresenter } from '../presenters/consent.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<ConsentPresenter>(TYPES.ConsentPresenter);

/** GET /projects/:projectId/consents/export?format=json|csv — export consents for audit. */
router.get('/export', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await presenter.exportConsents({ projectId, format });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `consents-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(result.data.content);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
