import { Router } from "express";
import { env } from "../config/env";

const router = Router();

router.get("/env", (_req, res) => {
  res.status(200).json({
    service: "insights-service",
    nodeEnv: env.NODE_ENV,
    hasInternalServiceToken: Boolean(env.INTERNAL_SERVICE_TOKEN),
    timestamp: new Date().toISOString(),
  });
});

export default router;
