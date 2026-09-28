import { Router } from "express";
import researchInternalRoutes from "../modules/research/interface-adapters/routes/research.internal.routes";
import commentsInternalRoutes from "../modules/comments/interface-adapters/routes/comments.internal.routes";
import commentsFlatInternalRoutes from "../modules/comments/interface-adapters/routes/comments-flat.internal.routes";
import scraperInternalRoutes from "../modules/scraper/interface-adapters/routes/scraper.internal.routes";
import earlySignalsInternalRoutes from "../modules/signals/interface-adapters/routes/early-signals.internal.routes";

const router = Router({ mergeParams: true });

router.use("/projects/:projectId/research", researchInternalRoutes);
router.use("/projects/:projectId/comments", commentsInternalRoutes);
router.use("/projects/:projectId/scraper", scraperInternalRoutes);
router.use("/projects/:projectId/early-signals", earlySignalsInternalRoutes);
router.use("/comments", commentsFlatInternalRoutes);

router.all("*", (req, res) => {
  res.status(404).json({
    error: "Insights internal route not found",
    path: req.path,
    method: req.method,
  });
});

export default router;
