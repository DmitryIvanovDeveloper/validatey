import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ScenarioController } from '../controllers/scenario.controller';

const router = Router({ mergeParams: true });
const controller = container.get<ScenarioController>(TYPES.ScenarioController);

// POST /projects/:projectId/scenarios/generate
router.post('/generate', async (req: Request, res: Response) => {
  const projectId = req.params.projectId;
  console.log('🔵 [BACKEND] Scenario generation request received:', {
    projectId,
    userId: req.headers['x-user-id'],
    hasSegment: !!req.body.segment,
    hasHypothesis: !!req.body.hypothesis,
    hasPrompt: !!req.body.prompt,
    body: req.body
  });

  try {
    // Validate x-user-id header (required per requirements)
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      console.error('❌ [BACKEND] Missing x-user-id header');
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    // Validate projectId in body matches URL parameter (if provided)
    if (req.body.projectId && req.body.projectId !== projectId) {
      console.error('❌ [BACKEND] projectId mismatch:', {
        urlParam: projectId,
        bodyParam: req.body.projectId
      });
      return res.status(400).json({ error: 'projectId in body must match URL parameter' });
    }

    console.log('✅ [BACKEND] Calling controller.generateScenario...');
    const result = await controller.generateScenario({
      projectId,
      userId, // Pass userId for ownership validation
      segment: req.body.segment,
      hypothesis: req.body.hypothesis,
      marketContext: req.body.marketContext,
      templateSlug: req.body.templateSlug,
      metadata: req.body.metadata,
      prompt: req.body.prompt, // Optional prompt override
    });
    
    console.log('📥 [BACKEND] Controller result:', {
      isSuccess: result.isSuccess
    });

    if (!result.isSuccess) {
      // Check error type for appropriate status code
      const error = result.error;
      const rawMessage = error?.message || 'Unknown error';
      console.error('❌ [BACKEND] Scenario generation failed:', {
        errorName: error?.name,
        errorMessage: rawMessage
      });

      const isBlocked =
        rawMessage.includes('403') ||
        rawMessage.includes('Cloudflare') ||
        rawMessage.includes('<!DOCTYPE') ||
        rawMessage.includes('ByteString') ||
        rawMessage.length > 400;
      const errorMessage = isBlocked
        ? 'Scenario generation failed: AI service unavailable (blocked or 403). Try again later or set CEREBRAS_API_KEY / LLM_SERVICE_URL.'
        : rawMessage;

      if (error?.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: error.message });
      }
      if (error?.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: error.message });
      }
      return res.status(400).json({ error: errorMessage });
    }

    // Status is already computed in use case
    // Serialize dates to ISO 8601 format as per requirements
    // Safely access result.data - it should exist if isSuccess is true
    let scenarioData;
    try {
      // Check if result has data before accessing it
      if (!result.hasData()) {
        console.error('❌ [BACKEND] Result does not have data even though isSuccess is true');
        return res.status(500).json({ error: 'Result has no data despite success' });
      }
      
      const responseData = result.data;
      if (!responseData || !responseData.scenario) {
        console.error('❌ [BACKEND] Missing scenario data in result:', {
          hasData: !!responseData,
          hasScenario: !!responseData?.scenario
        });
        return res.status(500).json({ error: 'Missing scenario data in response' });
      }

      scenarioData = responseData.scenario;
    } catch (dataError) {
      console.error('❌ [BACKEND] Error accessing result.data:', {
        error: dataError,
        message: dataError instanceof Error ? dataError.message : String(dataError),
        stack: dataError instanceof Error ? dataError.stack : undefined
      });
      return res.status(500).json({ 
        error: dataError instanceof Error ? dataError.message : 'Error accessing result data' 
      });
    }

    console.log('✅ [BACKEND] Scenario generated successfully:', {
      scenarioId: scenarioData?.id,
      projectId: scenarioData?.projectId,
      version: scenarioData?.version,
      status: scenarioData?.status
    });
    
    try {
      const toIso = (d: unknown): string => {
        if (d == null) return new Date().toISOString();
        if (typeof (d as Date).toISOString === 'function') return (d as Date).toISOString();
        const parsed = new Date(d as string);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      };
      const createdAt = toIso(scenarioData.createdAt);
      const updatedAt = toIso(scenarioData.updatedAt);

      return res.status(201).json({
        scenario: {
          ...scenarioData,
          createdAt,
          updatedAt,
        },
      });
    } catch (serializeError) {
      console.error('❌ [BACKEND] Error serializing scenario data:', serializeError);
      const serializeErrorMessage = serializeError instanceof Error ? serializeError.message : 'Unknown serialization error';
      return res.status(500).json({ error: `Error serializing scenario data: ${serializeErrorMessage}` });
    }
  } catch (error) {
    console.error('❌ [BACKEND] Generate scenario error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [BACKEND] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ error: errorMessage });
  }
});

// GET /projects/:projectId/scenarios
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    if (version) {
      // Get specific version
      const result = await controller.getScenario({
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
      // Get latest scenario for project (so "select project" view can show step 3 LLM output)
      const result = await controller.getScenario({ projectId });
      if (!result.isSuccess) {
        if (result.error.name === 'ScenarioNotFoundError') {
          return res.status(404).json({ error: result.error.message });
        }
        return res.status(400).json({ error: result.error.message });
      }
      const scenario = result.data.scenario;
      const toIso = (d: unknown): string => {
        if (d == null) return new Date().toISOString();
        if (typeof (d as Date).toISOString === 'function') return (d as Date).toISOString();
        const parsed = new Date(d as string);
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      };
      return res.status(200).json({
        scenario: {
          id: scenario.id,
          projectId: scenario.projectId,
          content: scenario.content ?? '',
          version: scenario.version,
          isGenerated: scenario.isGenerated,
          isEdited: scenario.isEdited,
          createdAt: toIso(scenario.createdAt),
          updatedAt: toIso(scenario.updatedAt),
        },
      });
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

    const result = await controller.getScenario({
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
    const result = await controller.saveScenarioVersion({
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

