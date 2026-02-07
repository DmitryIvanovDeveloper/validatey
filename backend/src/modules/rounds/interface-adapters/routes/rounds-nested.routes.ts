import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { RoundController } from '../controllers/round.controller';

const ROUND_TYPES = ['survey', 'interview', 'ab_test', 'field'] as const;
const ROUND_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;

const router = Router({ mergeParams: true });
const controller = container.get<RoundController>(TYPES.RoundController);

// GET /projects/:projectId/rounds
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.listByProject({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /projects/:projectId/rounds
router.post('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : 'Round';
    const type = typeof req.body?.type === 'string' && ROUND_TYPES.includes(req.body.type as typeof ROUND_TYPES[number])
      ? req.body.type
      : 'survey';
    const parentRoundId = typeof req.body?.parentRoundId === 'string' ? req.body.parentRoundId : undefined;
    const sortOrder = typeof req.body?.sortOrder === 'number' ? req.body.sortOrder : undefined;
    const result = await controller.create({
      projectId,
      title: title || 'Round',
      type,
      parentRoundId: parentRoundId ?? null,
      sortOrder,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/rounds/:roundId
router.get('/:roundId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const roundId = req.params.roundId;
    if (!projectId || !roundId) {
      return res.status(400).json({ error: 'Project ID and Round ID are required' });
    }
    const result = await controller.get({ projectId, roundId });
    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// PATCH /projects/:projectId/rounds/:roundId
router.patch('/:roundId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const roundId = req.params.roundId;
    if (!projectId || !roundId) {
      return res.status(400).json({ error: 'Project ID and Round ID are required' });
    }
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;
    const status = typeof body.status === 'string' && ROUND_STATUSES.includes(body.status as typeof ROUND_STATUSES[number])
      ? body.status
      : undefined;
    const type = typeof body.type === 'string' && ROUND_TYPES.includes(body.type as typeof ROUND_TYPES[number])
      ? body.type
      : undefined;
    const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : undefined;
    const results = body.results !== undefined ? body.results : undefined;
    const result = await controller.update({
      projectId,
      roundId,
      title,
      status,
      type,
      sortOrder,
      results,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /projects/:projectId/rounds/:roundId
router.delete('/:roundId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const roundId = req.params.roundId;
    if (!projectId || !roundId) {
      return res.status(400).json({ error: 'Project ID and Round ID are required' });
    }
    const result = await controller.delete({ projectId, roundId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
