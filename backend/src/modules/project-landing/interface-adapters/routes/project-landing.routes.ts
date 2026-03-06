import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectLandingController } from '../controllers/project-landing.controller';
import { GenerateLandingUseCase } from '../../application/use-cases/generate-landing.use-case';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = container.get<ProjectLandingController>(TYPES.ProjectLandingController);

/**
 * POST /api/project-landings/:projectId/upload
 * Upload and deploy a landing page archive for a project
 * Requires authentication
 */
router.post('/:projectId/upload', upload.single('archive'), async (req: Request, res: Response) => {
  await controller.uploadLanding(req, res);
});

/**
 * GET /api/project-landings/:projectId
 * Get landing information for a project
 * Requires authentication
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  await controller.getProjectLanding(req, res);
});

/**
 * POST /api/project-landings/:projectId/generate-ai
 * Generate landing page with AI for a project
 * Requires authentication
 */
router.post('/:projectId/generate-ai', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.headers['x-user-id'] as string;
    const customPrompt = req.body?.customPrompt as string | undefined;

    if (!userId) {
      return res.status(400).json({ error: 'x-user-id header is required' });
    }

    const useCase = container.get<GenerateLandingUseCase>(TYPES.GenerateLandingUseCase);
    const result = await useCase.execute({
      projectId,
      userId,
      customPrompt
    });

    if (!result.isSuccess) {
      return res.status(result.error.name === 'ProjectAccessDeniedError' ? 403 : 400)
        .json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    console.error('Generate AI landing error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/project-landings/:projectId
 * Delete landing for a project
 * Requires authentication
 */
router.delete('/:projectId', async (req: Request, res: Response) => {
  await controller.deleteLanding(req, res);
});

export default router;