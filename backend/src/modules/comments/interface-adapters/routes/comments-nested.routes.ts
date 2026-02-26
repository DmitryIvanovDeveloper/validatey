import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../types';
import { CommentController } from '../controllers/comment.controller';

const router = Router({ mergeParams: true });
const controller = container.get<CommentController>(COMMENT_TYPES.CommentController);

// POST /api/projects/:projectId/comments/fetch
// Start fetching comments from Reddit or Hacker News
router.post('/fetch', async (req: Request, res: Response) => {
  await controller.fetchComments(req, res);
});

// GET /api/projects/:projectId/comments/fetch/status
// Get the status of current/last fetch operation
router.get('/fetch/status', async (req: Request, res: Response) => {
  await controller.getFetchStatus(req, res);
});

// GET /api/projects/:projectId/comments/test-fetch?hnUrl=...
// Test direct fetch without job system
router.get('/test-fetch', async (req: Request, res: Response) => {
  await controller.testFetch(req, res);
});

// GET /api/projects/:projectId/comments
// Get comments for a project with optional filters
router.get('/', async (req: Request, res: Response) => {
  await controller.getComments(req, res);
});

// POST /api/projects/:projectId/comments/sources
// Create a new comment source
router.post('/sources', async (req: Request, res: Response) => {
  await controller.createSource(req, res);
});

// GET /api/projects/:projectId/comments/sources
// Get all comment sources for a project
router.get('/sources', async (req: Request, res: Response) => {
  await controller.getSources(req, res);
});

// GET /api/projects/:projectId/comments/patterns
// Analyze collected comments and detect patterns (myths, failures, advice, validation)
router.get('/patterns', async (req: Request, res: Response) => {
  await controller.analyzePatterns(req, res);
});

// GET /api/projects/:projectId/comments/patterns/:patternType/comments
// Get all comments belonging to a specific pattern
router.get('/patterns/:patternType/comments', async (req: Request, res: Response) => {
  await controller.getPatternComments(req, res);
});

// DELETE /api/projects/:projectId/comments/sources/:sourceId
// Delete a comment source and all its comments
router.delete('/sources/:sourceId', async (req: Request, res: Response) => {
  await controller.deleteSource(req, res);
});

export default router;