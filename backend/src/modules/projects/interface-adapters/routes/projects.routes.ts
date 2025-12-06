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
      targetAudience: req.body?.targetAudience,
      cost: req.body?.cost,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    // Возвращаем проект напрямую, не обернутый в объект
    const project = result.data.project;
    return res.status(201).json({
      id: project.id,
      name: project.name,
      segment: project.segment,
      hypothesis: project.hypothesis,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
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

// List projects for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.headers['x-user-id']) as string | undefined;
    
    // For now, require userId. In production, this should come from auth token
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required',
        hint: 'Provide x-user-id header or userId in request body'
      });
    }

    const result = await presenter.listProjects({ userId });

    if (!result.isSuccess) {
      console.error('List projects error:', result.error);
      // Log full error for debugging
      if (result.error instanceof Error) {
        console.error('Error stack:', result.error.stack);
      }
      return res.status(500).json({ 
        error: result.error.message || 'Failed to list projects',
        details: process.env.NODE_ENV === 'development' ? result.error.toString() : undefined
      });
    }

    // Return just the projects array as per requirements (not wrapped in object)
    // Format: [{ id, name, status, createdAt, updatedAt }, ...]
    const projects = result.data.projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

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

    const result = await presenter.updateProject({
      projectId: req.params.id,
      userId,
      name: req.body?.name,
      status: req.body?.status,
      segment: req.body?.segment,
      hypothesis: req.body?.hypothesis,
      targetAudience: req.body?.targetAudience,
      cost: req.body?.cost,
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

    // First check access
    const getResult = await presenter.getProject({
      projectId: req.params.id,
      userId,
    });

    if (!getResult.isSuccess) {
      if (getResult.error.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: getResult.error.message });
      }
      if (getResult.error.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: getResult.error.message });
      }
      return res.status(400).json({ error: getResult.error.message });
    }

    // TODO: Add delete use case
    return res.status(501).json({ error: 'Delete not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

