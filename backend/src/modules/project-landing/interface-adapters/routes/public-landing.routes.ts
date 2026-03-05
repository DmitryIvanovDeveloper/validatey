import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { PublicLandingController } from '../controllers/public-landing.controller';

const router = Router();
const controller = container.get<PublicLandingController>(TYPES.PublicLandingController);

/**
 * GET /:slug/*
 * Serve landing page files by slug
 * Public access - no authentication required
 * Supports subdomains like yourproject.validatey.com
 */
router.get('/:slug', async (req: Request, res: Response) => {
  // Handle root path - serve index.html
  req.params.filepath = 'index.html';
  await controller.serveLandingFile(req, res);
});

/**
 * GET /:slug/*
 * Serve specific landing page files
 * Public access - no authentication required
 */
router.get('/:slug/*', async (req: Request, res: Response) => {
  // Extract filepath from wildcard route
  const fullPath = req.params[0] || '';
  req.params.filepath = fullPath;
  await controller.serveLandingFile(req, res);
});

export default router;