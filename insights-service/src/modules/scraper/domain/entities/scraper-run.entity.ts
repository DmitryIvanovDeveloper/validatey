import { randomUUID } from "crypto";
import type { RunStats } from "../value-objects/run-stats.vo";

export type ScraperRunStatus = "pending" | "running" | "completed" | "failed" | "partially_failed";

export interface ScraperRun {
  readonly id: string;
  readonly scraperSourceId: string;
  readonly projectId: string;
  readonly status: ScraperRunStatus;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly errorMessage: string | null;
  readonly rawResult: Record<string, unknown> | null;
  readonly insightsSummary: string | null;
  readonly stats: RunStats | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function createPendingRun(scraperSourceId: string, projectId: string): ScraperRun {
  const now = new Date();
  return {
    id: randomUUID(),
    scraperSourceId,
    projectId,
    status: "pending",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    rawResult: null,
    insightsSummary: null,
    stats: null,
    createdAt: now,
    updatedAt: now,
  };
}
