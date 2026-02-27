import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../application/ports/project-repository.port';

const router = Router();

/**
 * GET /api/public/projects/by-slug/:slug
 * Resolve project by public slug for guest view. Returns minimal project (id, name, publicSlug) only when public access is enabled.
 * No auth required.
 */
router.get('/by-slug/:slug', async (req: Request, res: Response) => {
  try {
    const slug = (req.params.slug || '').trim();
    if (!slug) {
      return res.status(400).json({ error: 'slug is required' });
    }

    const repository = container.get<ProjectRepositoryPort>(TYPES.ProjectRepository);
    const result = await repository.findByPublicSlug(slug);

    if (!result.isSuccess) {
      return res.status(404).json({ error: result.error.message });
    }

    const project = result.data;
    if (!project.publicAccessEnabled || project.publicSlug !== slug) {
      return res.status(404).json({ error: 'Project not found or guest view not enabled' });
    }

    return res.status(200).json({
      id: project.id,
      name: project.name,
      publicSlug: project.publicSlug,
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
