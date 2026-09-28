import { Router } from "express";
import { container } from "../../../../infrastructure/bootstrap/container";
import { TYPES } from "../../infrastructure/bootstrap/types";
import { ResearchController } from "../controllers/research.controller";

const router = Router({ mergeParams: true });
const researchController = container.get<ResearchController>(TYPES.ResearchController);

function projectIdFromReq(req: { params: unknown }): string {
  const params = req.params as Record<string, string | undefined>;
  return params.projectId || "";
}

router.get("/canvas", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await researchController.getCanvas(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/availability", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await researchController.checkAvailability(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }

  res.status(200).json(result.data);
});

router.post("/synthesis", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await researchController.synthesis(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.post("/collect", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await researchController.collect(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.post("/assistant", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  const result = await researchController.assistant(projectId, message);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.post("/user-stories", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await researchController.userStories(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

export default router;
