import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResponsePresenter } from '../presenters/response.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

// List responses for moderation (public-link responses): GET /projects/:projectId/responses/moderation?status=pending
router.get('/moderation', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const userId = (req.headers['x-user-id'] || req.body?.userId) as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    const status = req.query.status as string | undefined;
    const moderationStatus = status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined;
    const result = await presenter.listResponsesForModeration({
      projectId,
      userId,
      moderationStatus: moderationStatus ?? null,
    });
    if (!result.isSuccess) {
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }
    const responses = result.data.responses.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    }));
    return res.status(200).json({ responses });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Moderate a response: PATCH /projects/:projectId/responses/:responseId/moderation
router.patch('/:responseId/moderation', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const responseId = req.params.responseId;
    const userId = (req.headers['x-user-id'] || req.body?.userId) as string | undefined;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }
    const status = req.body?.status;
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }
    const result = await presenter.moderateResponse({ responseId, userId, status });
    if (!result.isSuccess) {
      if (result.error.name === 'ResponseNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError' || result.error.name === 'ModerationNotAllowedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }
    const r = result.data.response;
    return res.status(200).json({
      response: {
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

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

// Export responses (JSON or CSV)
router.get('/export', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await presenter.exportResponses({ projectId, format });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `responses-${projectId}-${new Date().toISOString().slice(0, 10)}.${format}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(result.data.content);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
