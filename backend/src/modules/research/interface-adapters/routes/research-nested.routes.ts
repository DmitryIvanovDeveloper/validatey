import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResearchController } from '../controllers/research.controller';
import { ResearchCooldownError } from '../../domain/errors/research.error';
import { UserStoriesGenerationError } from '../../application/ports/user-stories-llm.port';

const router = Router({ mergeParams: true });
const controller = container.get<ResearchController>(TYPES.ResearchController);

router.get('/canvas', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.getCanvas({ projectId });
    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/availability', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.checkAvailability({ projectId });
    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/synthesis', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.generateSynthesis({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/collect', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.collectData({
      projectId,
      sources: req.body?.sources,
      geography: typeof req.body?.geography === 'string' ? req.body.geography.trim() || undefined : undefined,
      segment: typeof req.body?.segment === 'string' ? req.body.segment.trim() || undefined : undefined,
      productDescription:
        typeof req.body?.productDescription === 'string' ? req.body.productDescription.trim() || undefined : undefined,
      skipAutocomplete: req.body?.skipAutocomplete === true,
    });
    if (!result.isSuccess) {
      // NEW: Специальная обработка ResearchCooldownError
      if (result.error instanceof ResearchCooldownError) {
        return res.status(429).json(result.error.toHttpResponse()); // 429 Too Many Requests - semantically correct
      }
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/assistant', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await controller.sendAssistantMessage({
      projectId,
      message,
      conversationHistory: req.body?.conversationHistory,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** POST /user-stories — returns JSON only (userStories[], generatedAt). MD formatting is frontend responsibility. */
router.post('/user-stories', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.generateUserStories({ projectId });
    if (!result.isSuccess) {
      const err = result.error;
      const payload: { error: string; contentPreview?: string } = { error: err.message };
      if (err instanceof UserStoriesGenerationError && err.contentPreview) {
        payload.contentPreview = err.contentPreview;
      }
      return res.status(400).json(payload);
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
