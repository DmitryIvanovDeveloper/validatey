import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectLandingController } from '../controllers/project-landing.controller';

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
 * DELETE /api/project-landings/:projectId
 * Delete landing for a project
 * Requires authentication
 */
router.delete('/:projectId', async (req: Request, res: Response) => {
  await controller.deleteLanding(req, res);
});

export default router;