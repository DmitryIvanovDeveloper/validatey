import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TaskPresenter } from '../presenters/task.presenter';

const router = Router();
const presenter = container.get<TaskPresenter>(TYPES.TaskPresenter);

// Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await presenter.createTask({
      type: req.body.type,
      payload: req.body.payload,
      maxRetries: req.body.maxRetries,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetTaskUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get tasks by status
router.get('/status/:status', async (req: Request, res: Response) => {
  try {
    // TODO: Add ListTasksByStatusUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

