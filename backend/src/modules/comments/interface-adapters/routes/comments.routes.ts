import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { COMMENT_TYPES } from '../../types';
import { CommentController } from '../controllers/comment.controller';

const router = Router();
const controller = container.get<CommentController>(COMMENT_TYPES.CommentController);

// GET /api/comments/:id
// Get a specific comment by ID (not project-specific)
router.get('/:id', async (req: Request, res: Response) => {
  await controller.getCommentById(req, res);
});

export default router;