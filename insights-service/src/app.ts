import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import "./infrastructure/bootstrap/container";
import { requireServiceAuth } from "./middleware/service-auth";
import healthRoutes from "./routes/health.routes";
import diagnosticsRoutes from "./routes/diagnostics.routes";
import internalInsightsRoutes from "./routes/internal-insights.routes";

const app = express();

const allowedOrigins = env.FRONTEND_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, origin);
      return cb(null, false);
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "insights-service",
    status: "running",
    docs: "Use /health and /internal/insights/*",
  });
});

app.use("/health", healthRoutes);
app.use("/diagnostics", requireServiceAuth, diagnosticsRoutes);
app.use("/internal/insights", requireServiceAuth, internalInsightsRoutes);

export default app;
