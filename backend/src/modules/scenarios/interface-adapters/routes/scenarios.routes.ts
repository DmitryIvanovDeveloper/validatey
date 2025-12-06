import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ScenarioPresenter } from '../presenters/scenario.presenter';

const router = Router();
const presenter = container.get<ScenarioPresenter>(TYPES.ScenarioPresenter);

// Generate scenario via LLM
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate x-user-id header (required per requirements)
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const result = await presenter.generateScenario({
      projectId: req.body.projectId,
      userId, // Pass userId for ownership validation
      segment: req.body.segment,
      hypothesis: req.body.hypothesis,
      metadata: req.body.metadata,
      prompt: req.body.prompt, // Optional prompt override
    });

    if (!result.isSuccess) {
      // Check error type for appropriate status code
      if (result.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    // Serialize dates to ISO 8601 format
    const scenarioData = result.data.scenario;
    return res.status(201).json({
      scenario: {
        ...scenarioData,
        createdAt: scenarioData.createdAt.toISOString(),
        updatedAt: scenarioData.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Save scenario version (manual edit)
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await presenter.saveScenarioVersion({
      projectId: req.body.projectId,
      content: req.body.content,
      metadata: req.body.metadata,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get scenario
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    const result = await presenter.getScenario({
      projectId: req.params.projectId,
      version,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'ScenarioNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

