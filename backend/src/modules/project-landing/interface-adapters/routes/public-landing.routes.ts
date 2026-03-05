import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { PublicLandingController } from '../controllers/public-landing.controller';

const router = Router();
const controller = container.get<PublicLandingController>(TYPES.PublicLandingController);

/**
 * GET /:slug/* — specific files (css, js, etc.)
 * Must be before /:slug so that /l/slug/path matches here.
 */
router.get('/:slug/*', async (req: Request, res: Response) => {
  const fullPath = (req.params as Record<string, string>)['0'] || '';
  (req.params as Record<string, string>).filepath = fullPath;
  await controller.serveLandingFile(req, res);
});

/**
 * GET /:slug — landing root. Redirect to /:slug/ when no trailing slash so relative links (css, js) resolve under /l/slug/
 */
router.get('/:slug', async (req: Request, res: Response) => {
  const urlNoQuery = req.originalUrl.split('?')[0];
  if (!urlNoQuery.endsWith('/')) {
    const query = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    res.redirect(302, urlNoQuery + '/' + query);
    return;
  }
  (req.params as Record<string, string>).filepath = 'index.html';
  await controller.serveLandingFile(req, res);
});

export default router;