import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectPresenter } from '../presenters/project.presenter';

const router = Router();
const presenter = container.get<ProjectPresenter>(TYPES.ProjectPresenter);

// Create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.headers['x-user-id']) as string | undefined;
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const result = await presenter.createProject({
      userId,
      name: req.body?.name,
      segment: req.body?.segment,
      hypothesis: req.body?.hypothesis,
      marketContext: req.body?.marketContext,
      targetAudience: req.body?.targetAudience,
      cost: req.body?.cost,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    // Возвращаем проект напрямую, не обернутый в объект
    const project = result.data.project;
    const createdAt = project.createdAt != null && typeof project.createdAt.toISOString === 'function'
      ? project.createdAt.toISOString()
      : new Date().toISOString();
    const updatedAt = project.updatedAt != null && typeof project.updatedAt.toISOString === 'function'
      ? project.updatedAt.toISOString()
      : new Date().toISOString();
    return res.status(201).json({
      id: project.id,
      name: project.name,
      segment: project.segment,
      hypothesis: project.hypothesis,
      marketContext: project.marketContext,
      status: project.status,
      createdAt,
      updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// List projects for user (must be before GET /:id so that GET / is matched first)
router.get('/', async (req: Request, res: Response) => {
  try {
    const rawUserId = (req.body?.userId ?? req.headers['x-user-id']) as string | undefined;
    const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';
    const listAll = process.env.NODE_ENV === 'development' && req.query.list === 'all';

    if (!listAll && !userId) {
      return res.status(400).json({
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const result = await presenter.listProjects({
      userId,
      listAll,
    });

    if (!result.isSuccess) {
      console.error('List projects error:', result.error);
      if (result.error instanceof Error) {
        console.error('Error stack:', result.error.stack);
      }
      return res.status(500).json({
        error: result.error.message || 'Failed to list projects',
        details: process.env.NODE_ENV === 'development' ? result.error.toString() : undefined
      });
    }

    const projects = result.data.projects.map(p => {
      const createdAt = p.createdAt != null && typeof p.createdAt.toISOString === 'function' ? p.createdAt.toISOString() : new Date().toISOString();
      const updatedAt = p.updatedAt != null && typeof p.updatedAt.toISOString === 'function' ? p.updatedAt.toISOString() : new Date().toISOString();
      return { id: p.id, name: p.name, status: p.status, createdAt, updatedAt };
    });

    return res.status(200).json(projects);
  } catch (error) {
    console.error('List projects exception:', error);
    if (error instanceof Error) {
      console.error('Exception stack:', error.stack);
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
    });
  }
});

// Get project by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.headers['x-user-id']) as string | undefined;
    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const result = await presenter.getProject({
      projectId: req.params.id,
      userId,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.headers['x-user-id']) as string | undefined;
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const projectId = req.params.id;
    
    // Log request details (without full data to avoid log spam)
    console.log('📝 Update project request:', {
      projectId,
      userId,
      hasName: !!req.body?.name,
      hasStatus: !!req.body?.status,
      hasSegment: !!req.body?.segment,
      hasHypothesis: !!req.body?.hypothesis,
      hasMarketContext: !!req.body?.marketContext,
      marketContextKeys: req.body?.marketContext ? Object.keys(req.body.marketContext) : [],
      hasTargetAudience: !!req.body?.targetAudience,
      hasCost: req.body?.cost !== undefined,
    });

    const result = await presenter.updateProject({
      projectId,
      userId,
      name: req.body?.name,
      status: req.body?.status,
      segment: req.body?.segment,
      hypothesis: req.body?.hypothesis,
      marketContext: req.body?.marketContext,
      targetAudience: req.body?.targetAudience,
      cost: req.body?.cost,
      scenarioTemplateSlug: req.body?.scenarioTemplateSlug,
    });

    if (!result.isSuccess) {
      console.error('❌ Update project failed:', {
        projectId,
        errorName: result.error?.name,
        errorMessage: result.error instanceof Error ? result.error.message : String(result.error),
      });

      if (result.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    // Serialize dates to ISO strings for JSON response
    const responseData = {
      project: {
        ...result.data.project,
        createdAt: result.data.project.createdAt instanceof Date 
          ? result.data.project.createdAt.toISOString() 
          : result.data.project.createdAt,
        updatedAt: result.data.project.updatedAt instanceof Date 
          ? result.data.project.updatedAt.toISOString() 
          : result.data.project.updatedAt,
      }
    };

    console.log('✅ Update project success:', { projectId, projectName: result.data.project.name });
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Update project exception:', {
      projectId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.headers['x-user-id']) as string | undefined;
    if (!userId) {
      return res.status(400).json({
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const result = await presenter.deleteProject({
      projectId: req.params.id,
      userId,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      if (result.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

