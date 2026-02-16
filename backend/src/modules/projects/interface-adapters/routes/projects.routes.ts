import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectController } from '../controllers/project.controller';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';

const router = Router();
const controller = container.get<ProjectController>(TYPES.ProjectController);
const presenter = controller;

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
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : undefined;
    const listAll = process.env.NODE_ENV === 'development' && req.query.list === 'all';

    console.log('[Projects Route] GET / - Diagnostics:', {
      rawUserId,
      userId,
      workspaceId,
      listAll,
      nodeEnv: process.env.NODE_ENV,
      queryList: req.query.list,
      queryWorkspaceId: req.query.workspaceId,
      headers: {
        'x-user-id': req.headers['x-user-id'],
        'user-agent': req.headers['user-agent']?.substring(0, 50)
      }
    });

    if (!listAll && !userId && !workspaceId) {
      console.log('[Projects Route] Returning 400: userId or workspaceId required');
      return res.status(400).json({
        error: 'userId or workspaceId is required',
        hint: 'Provide x-user-id header, userId in request body, or workspaceId query parameter'
      });
    }

    const result = await presenter.listProjects({
      userId,
      listAll,
      workspaceId,
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

    console.log('[Projects Route] Returning projects:', {
      count: projects.length,
      listAll,
      userId: listAll ? 'N/A (listAll=true)' : userId,
      projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status }))
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
      consentText: req.body?.consentText,
      dataUsageText: req.body?.dataUsageText,
      privacyPolicyUrl: req.body?.privacyPolicyUrl,
      termsOfServiceUrl: req.body?.termsOfServiceUrl,
      scenarioTemplateSlug: req.body?.scenarioTemplateSlug,
      publicAccessEnabled: req.body?.publicAccessEnabled,
      publicSlug: req.body?.publicSlug,
      maxPublicResponses: req.body?.maxPublicResponses,
      requirePublicEmail: req.body?.requirePublicEmail,
      captchaEnabled: req.body?.captchaEnabled,
      deadline: req.body?.deadline,
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
    const p = result.data.project;
    const responseData = {
      project: {
        ...p,
        deadline: p.deadline instanceof Date ? p.deadline.toISOString() : p.deadline,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
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

// Diagnostic route for debugging
router.get('/diagnostic', async (req: Request, res: Response) => {
  try {
    console.log('[Diagnostic] Starting database diagnostic...');

    const supabase = getSupabaseClient();
    console.log('[Diagnostic] Supabase client created');

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('[Diagnostic] Connection test failed:', connectionError);
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: connectionError.message
      });
    }

    console.log('[Diagnostic] Connection successful, total projects:', connectionTest);

    // Get all projects (for debugging)
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, name, user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('[Diagnostic] Failed to fetch projects:', allError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch projects',
        error: allError.message
      });
    }

    console.log('[Diagnostic] Sample projects:', allProjects);

    return res.json({
      status: 'success',
      totalProjects: connectionTest,
      sampleProjects: allProjects,
      userIdFromHeader: req.headers['x-user-id'],
      environment: {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: process.env.SUPABASE_URL?.replace(/https?:\/\/[^@]+@/, 'https://[REDACTED]@')
      }
    });
  } catch (error) {
    console.error('[Diagnostic] Exception:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Diagnostic failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

