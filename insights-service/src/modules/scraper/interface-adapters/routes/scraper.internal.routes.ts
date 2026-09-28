import { Router } from "express";
import { container } from "../../../../infrastructure/bootstrap/container";
import { TYPES } from "../../infrastructure/bootstrap/types";
import { ScraperController } from "../controllers/scraper.controller";
import { parseCustomSelectors, type CustomSelectors } from "../../domain/value-objects/custom-selectors.vo";
import { isScraperSourceType } from "../../domain/value-objects/scraper-source-type.vo";
import { isScheduleFrequency } from "../../domain/value-objects/schedule-frequency.vo";
import { isResearchGoal } from "../../domain/value-objects/research-goal.vo";
import { ScraperValidationError } from "../../domain/errors/scraper.error";

const router = Router({ mergeParams: true });
const scraperController = container.get<ScraperController>(TYPES.ScraperController);

type UpdatePayload = {
  id: string;
  projectId: string;
  name?: string | null;
  researchGoal?: import("../../domain/value-objects/research-goal.vo").ResearchGoal | null;
  urls?: string[];
  whatToCollect?: string[];
  frequency?: "once" | "daily" | "weekly";
  aiProcessing?: "analyze_trends" | "compare_with_us" | "none";
  customSelectors?: CustomSelectors | null;
  stopOnFirstError?: boolean;
};

function projectIdFromReq(req: { params: unknown }): string {
  const params = req.params as Record<string, string | undefined>;
  return params.projectId || "";
}

function parseBodyAdd(body: Record<string, unknown>, projectId: string) {
  const type = typeof body.type === "string" ? body.type : "";
  const urls = Array.isArray(body.urls) ? (body.urls as string[]) : [];
  const whatToCollect = Array.isArray(body.whatToCollect)
    ? (body.whatToCollect as string[])
    : Array.isArray(body.what_to_collect)
      ? (body.what_to_collect as string[])
      : [];
  const frequency = typeof body.frequency === "string" ? body.frequency : "once";
  const aiProcessing =
    typeof body.aiProcessing === "string"
      ? body.aiProcessing
      : typeof body.ai_processing === "string"
        ? body.ai_processing
        : "none";
  const name = typeof body.name === "string" ? body.name.trim() || null : null;
  const researchGoal =
    typeof body.researchGoal === "string" && isResearchGoal(body.researchGoal)
      ? body.researchGoal
      : typeof body.research_goal === "string" && isResearchGoal(body.research_goal)
        ? body.research_goal
        : null;
  const customSelectors = parseCustomSelectors(body.customSelectors ?? body.custom_selectors);
  const stopOnFirstError = body.stopOnFirstError === false ? false : body.stop_on_first_error === false ? false : true;
  if (!isScraperSourceType(type)) return { error: "Invalid type" };
  if (!isScheduleFrequency(frequency)) return { error: "Invalid frequency" };
  return {
    projectId,
    type,
    name,
    researchGoal: researchGoal ?? undefined,
    urls,
    whatToCollect,
    frequency,
    aiProcessing: aiProcessing as "analyze_trends" | "compare_with_us" | "none",
    customSelectors: customSelectors ?? null,
    stopOnFirstError,
  };
}

router.get("/stats", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await scraperController.getStats({ projectId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/dashboard-metrics", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const limitRaw = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
  const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;
  const result = await scraperController.getDashboardMetrics({ projectId, limit });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/presets", async (req, res) => {
  res.status(200).json(scraperController.getPresets());
});

router.post("/suggest", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  const result = await scraperController.suggest({ projectId, message });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const result = await scraperController.listSources({ projectId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.post("/", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const parsed = parseBodyAdd(req.body ?? {}, projectId);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = await scraperController.addSource(parsed);
  if (result.isSuccess) {
    res.status(201).json(result.data);
    return;
  }
  const err = result.error;
  const payload = err instanceof ScraperValidationError ? { error: err.message, fields: err.fields } : { error: err.message };
  res.status(400).json(payload);
});

router.post("/runs/:runId/generate-insights", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const runId = params.runId || "";
  const result = await scraperController.generateRunInsights({ projectId, runId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/results", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const scraperSourceId = typeof req.query.scraperSourceId === "string" ? req.query.scraperSourceId : undefined;
  const limitRaw = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : undefined;
  const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;
  const result = await scraperController.getResults({ projectId, scraperSourceId, limit });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

router.get("/:id", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const id = params.id || "";
  const result = await scraperController.listSources({ projectId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  const source = result.data.sources.find((s) => s.id === id);
  if (!source) {
    res.status(404).json({ error: "Scraper source not found" });
    return;
  }
  res.status(200).json(source);
});

router.patch("/:id", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const id = params.id || "";
  const body = req.body ?? {};
  const update: UpdatePayload = { id, projectId };
  if (typeof body.name === "string") update.name = body.name.trim() || null;
  if (
    (typeof body.researchGoal === "string" && isResearchGoal(body.researchGoal)) ||
    (typeof body.research_goal === "string" && isResearchGoal(body.research_goal))
  ) {
    update.researchGoal = (body.researchGoal ?? body.research_goal) as UpdatePayload["researchGoal"];
  }
  if (Array.isArray(body.urls)) update.urls = body.urls as string[];
  if (Array.isArray(body.whatToCollect)) update.whatToCollect = body.whatToCollect as string[];
  if (Array.isArray(body.what_to_collect)) update.whatToCollect = body.what_to_collect as string[];
  if (typeof body.frequency === "string" && isScheduleFrequency(body.frequency)) {
    update.frequency = body.frequency;
  }
  const aiOpt = body.aiProcessing ?? body.ai_processing;
  if (typeof aiOpt === "string" && ["analyze_trends", "compare_with_us", "none"].includes(aiOpt)) {
    update.aiProcessing = aiOpt as "analyze_trends" | "compare_with_us" | "none";
  }
  if (body.customSelectors !== undefined || body.custom_selectors !== undefined) {
    update.customSelectors = parseCustomSelectors(body.customSelectors ?? body.custom_selectors) ?? null;
  }
  if (body.stopOnFirstError !== undefined || body.stop_on_first_error !== undefined) {
    update.stopOnFirstError = body.stopOnFirstError === false ? false : body.stop_on_first_error === false ? false : true;
  }
  const result = await scraperController.updateSource(update);
  if (result.isSuccess) {
    res.status(200).json(result.data);
    return;
  }
  const err = result.error;
  const payload = err instanceof ScraperValidationError ? { error: err.message, fields: err.fields } : { error: err.message };
  res.status(400).json(payload);
});

router.delete("/:id", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const id = params.id || "";
  const result = await scraperController.deleteSource({ id, projectId });
  if (result.isSuccess) {
    res.status(204).send();
    return;
  }
  res.status(400).json({ error: result.error.message });
});

router.post("/:id/run", async (req, res) => {
  const projectId = projectIdFromReq(req);
  const params = req.params as Record<string, string | undefined>;
  const id = params.id || "";
  const result = await scraperController.runScraper({ scraperSourceId: id, projectId });
  if (!result.isSuccess) {
    res.status(400).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.data);
});

export default router;
