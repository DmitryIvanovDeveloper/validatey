import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ScenarioPresenter } from '../presenters/scenario.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<ScenarioPresenter>(TYPES.ScenarioPresenter);

// POST /projects/:projectId/scenarios/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate x-user-id header (required per requirements)
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const projectId = req.params.projectId;
    
    // Validate projectId in body matches URL parameter (if provided)
    if (req.body.projectId && req.body.projectId !== projectId) {
      return res.status(400).json({ error: 'projectId in body must match URL parameter' });
    }

    const result = await presenter.generateScenario({
      projectId,
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

    // Status is already computed in use case
    // Serialize dates to ISO 8601 format as per requirements
    const scenarioData = result.data.scenario;
    return res.status(201).json({
      scenario: {
        ...scenarioData,
        createdAt: scenarioData.createdAt.toISOString(),
        updatedAt: scenarioData.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate scenario error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/scenarios
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    if (version) {
      // Get specific version
      const result = await presenter.getScenario({
        projectId,
        version,
      });

      if (!result.isSuccess) {
        if (result.error.name === 'ScenarioNotFoundError') {
          return res.status(404).json({ error: result.error.message });
        }
        return res.status(400).json({ error: result.error.message });
      }

      return res.status(200).json(result.data);
    } else {
      // List all scenarios for project
      // TODO: Add ListScenariosByProjectIdUseCase
      return res.status(501).json({ error: 'List scenarios not implemented yet' });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/scenarios/:scenarioId
router.get('/:scenarioId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const scenarioId = req.params.scenarioId;
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    const result = await presenter.getScenario({
      projectId,
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

// PUT /projects/:projectId/scenarios/:scenarioId
router.put('/:scenarioId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const result = await presenter.saveScenarioVersion({
      projectId,
      content: req.body.content,
      metadata: req.body.metadata,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

