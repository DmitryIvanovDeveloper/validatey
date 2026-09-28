import { Router } from "express";
import { container } from "../../../../infrastructure/bootstrap/container";
import { TYPES } from "../../infrastructure/bootstrap/types";
import { CommentsController } from "../controllers/comments.controller";

const router = Router({ mergeParams: true });
const commentsController = container.get<CommentsController>(TYPES.CommentsController);

function commentIdFromReq(req: { params: unknown }): string {
  const params = req.params as Record<string, string | undefined>;
  return params.id || "";
}

router.get("/:id", async (req, res) => {
  const commentId = commentIdFromReq(req);
  const result = await commentsController.getCommentById(commentId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data.comment);
});

export default router;
