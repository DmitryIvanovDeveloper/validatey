import { Router } from "express";
import { container } from "../../../../infrastructure/bootstrap/container";
import { TYPES } from "../../infrastructure/bootstrap/types";
import { CommentsController } from "../controllers/comments.controller";

const router = Router({ mergeParams: true });
const commentsController = container.get<CommentsController>(TYPES.CommentsController);

function projectIdFromReq(req: { params: unknown }): string {
  const params = req.params as Record<string, string | undefined>;
  return params.projectId || "";
}

router.post("/fetch", async (req, res) => {
  const result = await commentsController.fetchComments();
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(202).json(result.data);
});

router.get("/fetch/status", async (req, res) => {
  const result = await commentsController.getFetchStatus();
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/activity", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const bucketRaw = req.query.bucket;
  const bucket = bucketRaw === "week" ? "week" : "month";
  const maxBucketsRaw = typeof req.query.maxBuckets === "string" ? parseInt(req.query.maxBuckets, 10) : 12;
  const maxBuckets = Number.isFinite(maxBucketsRaw) ? Math.min(Math.max(maxBucketsRaw, 1), 60) : 12;
  const result = await commentsController.getCommentsActivity({ projectId, bucket, maxBuckets });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/freshness", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await commentsController.getCommentsFreshness(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const rawLimit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
  const periodMonths = typeof req.query.periodMonths === "string" ? parseInt(req.query.periodMonths, 10) : undefined;
  const sourceId = typeof req.query.sourceId === "string" ? req.query.sourceId : undefined;
  const result = await commentsController.getComments({
    projectId,
    limit: Number.isFinite(rawLimit) ? rawLimit : undefined,
    periodMonths: Number.isFinite(periodMonths) ? periodMonths : undefined,
    sourceId,
  });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.post("/sources", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const sourceTypeRaw = req.body?.sourceType;
  const sourceType = sourceTypeRaw === "hackernews" ? "hackernews" : sourceTypeRaw === "reddit" ? "reddit" : null;
  if (!sourceType) {
    res.status(400).json({ error: "Valid sourceType is required" });
    return;
  }
  const result = await commentsController.createSource({
    projectId,
    sourceType,
    redditUrl: typeof req.body?.redditUrl === "string" ? req.body.redditUrl : undefined,
    hnUrl: typeof req.body?.hnUrl === "string" ? req.body.hnUrl : undefined,
    hnFeedType: typeof req.body?.hnFeedType === "string" ? req.body.hnFeedType : undefined,
  });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(201).json({ source: result.data });
});

router.get("/sources", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await commentsController.getSources(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/patterns", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await commentsController.getPatternAnalysis(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/suggested-outreach", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const rawLimit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;
  const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
  const result = await commentsController.getSuggestedOutreach(projectId, limit);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/by-author", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const author = typeof req.query.author === "string" ? req.query.author.trim() : "";
  if (!author) {
    res.status(400).json({ error: "author is required" });
    return;
  }
  const sourceTypeRaw = req.query.sourceType;
  const sourceType = sourceTypeRaw === "reddit" || sourceTypeRaw === "hackernews" ? sourceTypeRaw : undefined;
  const rawLimit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 50;
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;
  const result = await commentsController.getCommentsByAuthor({ projectId, author, sourceType, limit });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/patterns/:patternType/comments", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const patternType = params.patternType || "";
  const patternIndexRaw = req.query.patternIndex;
  const patternIndex = typeof patternIndexRaw === "string" && /^\d+$/.test(patternIndexRaw) ? parseInt(patternIndexRaw, 10) : undefined;
  const commentIdsRaw = req.query.commentIds;
  const commentIdsFromQuery =
    typeof commentIdsRaw === "string"
      ? commentIdsRaw
          .split(",")
          .map((x) => x.trim())
          .filter((x) => x.length > 0)
      : undefined;
  const result = await commentsController.getPatternComments({ projectId, patternType, patternIndex, commentIdsFromQuery });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.delete("/sources/:sourceId", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const sourceId = params.sourceId || "";
  const result = await commentsController.deleteSource({ projectId, sourceId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(204).send();
});

export default router;
