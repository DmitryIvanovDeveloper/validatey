import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ScraperController } from '../controllers/scraper.controller';
import type { CustomSelectors } from '../../domain/value-objects/custom-selectors.vo';
import { parseCustomSelectors } from '../../domain/value-objects/custom-selectors.vo';
import { ScraperValidationError } from '../../domain/errors/scraper.error';
import { isScraperSourceType } from '../../domain/value-objects/scraper-source-type.vo';
import { isScheduleFrequency } from '../../domain/value-objects/schedule-frequency.vo';
import { RESEARCH_GOAL_LABELS, RESEARCH_GOAL_PRESETS, isResearchGoal } from '../../domain/value-objects/research-goal.vo';

const router = Router({ mergeParams: true });
const controller = container.get<ScraperController>(TYPES.ScraperController);

function parseBodyAdd(body: Record<string, unknown>, projectId: string) {
  const type = typeof body.type === 'string' ? body.type : '';
  const urls = Array.isArray(body.urls) ? (body.urls as string[]) : [];
  const whatToCollect = Array.isArray(body.whatToCollect)
    ? (body.whatToCollect as string[])
    : Array.isArray(body.what_to_collect)
      ? (body.what_to_collect as string[])
      : [];
  const frequency = typeof body.frequency === 'string' ? body.frequency : 'once';
  const aiProcessing =
    typeof body.aiProcessing === 'string'
      ? body.aiProcessing
      : typeof body.ai_processing === 'string'
        ? body.ai_processing
        : 'none';
  const name = typeof body.name === 'string' ? body.name.trim() || null : null;
  const researchGoal =
    typeof body.researchGoal === 'string' && isResearchGoal(body.researchGoal)
      ? body.researchGoal
      : typeof body.research_goal === 'string' && isResearchGoal(body.research_goal)
        ? body.research_goal
        : null;
  const customSelectors = parseCustomSelectors(body.customSelectors ?? body.custom_selectors);
  const stopOnFirstError =
    body.stopOnFirstError === false ? false : body.stop_on_first_error === false ? false : true;
  if (!isScraperSourceType(type)) {
    return { error: 'Invalid type' };
  }
  if (!isScheduleFrequency(frequency)) {
    return { error: 'Invalid frequency' };
  }
  return {
    projectId,
    type,
    name,
    researchGoal: researchGoal ?? undefined,
    urls,
    whatToCollect,
    frequency,
    aiProcessing: aiProcessing as 'analyze_trends' | 'compare_with_us' | 'none',
    customSelectors: customSelectors ?? null,
    stopOnFirstError,
  };
}

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.getStats({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/dashboard-metrics', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const limit =
      typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const result = await controller.getDashboardMetrics({
      projectId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/presets', (_req: Request, res: Response) => {
  return res.status(200).json({
    labels: RESEARCH_GOAL_LABELS,
    presets: RESEARCH_GOAL_PRESETS,
  });
});

router.post('/suggest', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const body = req.body ?? {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const projectContext =
      body.projectContext && typeof body.projectContext === 'object'
        ? {
            name: typeof body.projectContext.name === 'string' ? body.projectContext.name : undefined,
            description:
              typeof body.projectContext.description === 'string'
                ? body.projectContext.description
                : undefined,
          }
        : undefined;
    const result = await controller.suggest({
      projectId,
      message,
      projectContext,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const result = await controller.listSources({ projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const parsed = parseBodyAdd(req.body ?? {}, projectId);
    if ('error' in parsed) {
      return res.status(400).json({ error: parsed.error });
    }
    const result = await controller.addSource(parsed);
    if (!result.isSuccess) {
      const err = result.error;
      const payload = err instanceof ScraperValidationError
        ? { error: err.message, fields: err.fields }
        : { error: err.message };
      return res.status(400).json(payload);
    }
    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/runs/:runId/generate-insights', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const runId = req.params.runId;
    if (!projectId || !runId) {
      return res.status(400).json({ error: 'Project ID and run ID are required' });
    }
    const result = await controller.generateRunInsights({ projectId, runId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/results', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    const scraperSourceId = typeof req.query.scraperSourceId === 'string' ? req.query.scraperSourceId : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const result = await controller.getResults({
      projectId,
      scraperSourceId: scraperSourceId || undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const id = req.params.id;
    if (!projectId || !id) {
      return res.status(400).json({ error: 'Project ID and source ID are required' });
    }
    const listResult = await controller.listSources({ projectId });
    if (!listResult.isSuccess) {
      return res.status(400).json({ error: listResult.error.message });
    }
    const source = listResult.data.sources.find((s) => s.id === id);
    if (!source) {
      return res.status(404).json({ error: 'Scraper source not found' });
    }
    return res.status(200).json(source);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const id = req.params.id;
    if (!projectId || !id) {
      return res.status(400).json({ error: 'Project ID and source ID are required' });
    }
    const body = req.body ?? {};
    const update: UpdatePayload = { id, projectId };
    if (typeof body.name === 'string') update.name = body.name.trim() || null;
    if (
      (typeof body.researchGoal === 'string' && isResearchGoal(body.researchGoal)) ||
      (typeof body.research_goal === 'string' && isResearchGoal(body.research_goal))
    ) {
      update.researchGoal = (body.researchGoal ?? body.research_goal) as UpdatePayload['researchGoal'];
    }
    if (Array.isArray(body.urls)) update.urls = body.urls as string[];
    if (Array.isArray(body.whatToCollect)) update.whatToCollect = body.whatToCollect as string[];
    if (Array.isArray(body.what_to_collect)) update.whatToCollect = body.what_to_collect as string[];
    if (typeof body.frequency === 'string' && isScheduleFrequency(body.frequency)) {
      update.frequency = body.frequency;
    }
    const aiOpt = body.aiProcessing ?? body.ai_processing;
    if (typeof aiOpt === 'string' && ['analyze_trends', 'compare_with_us', 'none'].includes(aiOpt)) {
      update.aiProcessing = aiOpt as 'analyze_trends' | 'compare_with_us' | 'none';
    }
    if (body.customSelectors !== undefined || body.custom_selectors !== undefined) {
      update.customSelectors = parseCustomSelectors(body.customSelectors ?? body.custom_selectors) ?? null;
    }
    const result = await controller.updateSource(update);
    if (!result.isSuccess) {
      const err = result.error;
      const payload = err instanceof ScraperValidationError
        ? { error: err.message, fields: err.fields }
        : { error: err.message };
      return res.status(400).json(payload);
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

type UpdatePayload = {
  id: string;
  projectId: string;
  name?: string | null;
  researchGoal?: import('../../domain/value-objects/research-goal.vo').ResearchGoal | null;
  urls?: string[];
  whatToCollect?: string[];
  frequency?: 'once' | 'daily' | 'weekly';
  aiProcessing?: 'analyze_trends' | 'compare_with_us' | 'none';
  customSelectors?: CustomSelectors | null;
  stopOnFirstError?: boolean;
};

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const id = req.params.id;
    if (!projectId || !id) {
      return res.status(400).json({ error: 'Project ID and source ID are required' });
    }
    const result = await controller.deleteSource({ id, projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const scraperSourceId = req.params.id;
    if (!projectId || !scraperSourceId) {
      return res.status(400).json({ error: 'Project ID and source ID are required' });
    }
    const result = await controller.runScraper({ scraperSourceId, projectId });
    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
