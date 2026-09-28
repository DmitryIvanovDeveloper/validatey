import { Router } from "express";
import { container } from "../../../../infrastructure/bootstrap/container";
import { TYPES } from "../../infrastructure/bootstrap/types";
import { EarlySignalsController } from "../controllers/early-signals.controller";

const router = Router({ mergeParams: true });
const earlySignalsController = container.get<EarlySignalsController>(TYPES.EarlySignalsController);

function projectIdFromReq(req: { params: unknown }): string {
  const params = req.params as Record<string, string | undefined>;
  return params.projectId || "";
}

router.get("/", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await earlySignalsController.getByProjectId(projectId);
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

export default router;
