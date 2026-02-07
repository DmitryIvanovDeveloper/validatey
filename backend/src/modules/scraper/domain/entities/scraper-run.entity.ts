import { randomUUID } from 'crypto';
import type { RunStats } from '../value-objects/run-stats.vo';

export type ScraperRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partially_failed';

export interface ScraperRun {
  readonly id: string;
  readonly scraperSourceId: string;
  readonly projectId: string;
  readonly status: ScraperRunStatus;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly errorMessage: string | null;
  readonly rawResult: Record<string, unknown> | null;
  /** AI-generated summary/insights from rawResult (markdown or plain text). */
  readonly insightsSummary: string | null;
  /** Quality metrics (urlsSuccess, totalItems, etc.). */
  readonly stats: RunStats | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ScraperRunEntity {
  private constructor(
    public readonly id: string,
    public readonly scraperSourceId: string,
    public readonly projectId: string,
    public readonly status: ScraperRunStatus,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly errorMessage: string | null,
    public readonly rawResult: Record<string, unknown> | null,
    public readonly insightsSummary: string | null,
    public readonly stats: RunStats | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(scraperSourceId: string, projectId: string): ScraperRunEntity {
    const now = new Date();
    return new ScraperRunEntity(
      randomUUID(),
      scraperSourceId,
      projectId,
      'pending',
      null,
      null,
      null,
      null,
      null,
      null,
      now,
      now
    );
  }

  static fromData(data: ScraperRun): ScraperRunEntity {
    return new ScraperRunEntity(
      data.id,
      data.scraperSourceId,
      data.projectId,
      data.status,
      data.startedAt ? new Date(data.startedAt) : null,
      data.completedAt ? new Date(data.completedAt) : null,
      data.errorMessage,
      data.rawResult,
      data.insightsSummary ?? null,
      data.stats ?? null,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  markRunning(): ScraperRunEntity {
    return new ScraperRunEntity(
      this.id,
      this.scraperSourceId,
      this.projectId,
      'running',
      new Date(),
      null,
      null,
      this.rawResult,
      this.insightsSummary,
      this.stats,
      this.createdAt,
      new Date()
    );
  }

  markCompleted(rawResult: Record<string, unknown>, stats: RunStats | null = null): ScraperRunEntity {
    return new ScraperRunEntity(
      this.id,
      this.scraperSourceId,
      this.projectId,
      'completed',
      this.startedAt,
      new Date(),
      null,
      rawResult,
      this.insightsSummary,
      stats,
      this.createdAt,
      new Date()
    );
  }

  markPartiallyFailed(
    rawResult: Record<string, unknown>,
    errorMessage: string,
    stats: RunStats | null = null
  ): ScraperRunEntity {
    return new ScraperRunEntity(
      this.id,
      this.scraperSourceId,
      this.projectId,
      'partially_failed',
      this.startedAt,
      new Date(),
      errorMessage,
      rawResult,
      this.insightsSummary,
      stats,
      this.createdAt,
      new Date()
    );
  }

  markFailed(errorMessage: string): ScraperRunEntity {
    return new ScraperRunEntity(
      this.id,
      this.scraperSourceId,
      this.projectId,
      'failed',
      this.startedAt,
      new Date(),
      errorMessage,
      this.rawResult,
      this.insightsSummary,
      this.stats,
      this.createdAt,
      new Date()
    );
  }

  withInsightsSummary(insightsSummary: string): ScraperRunEntity {
    return new ScraperRunEntity(
      this.id,
      this.scraperSourceId,
      this.projectId,
      this.status,
      this.startedAt,
      this.completedAt,
      this.errorMessage,
      this.rawResult,
      insightsSummary,
      this.stats,
      this.createdAt,
      new Date()
    );
  }

  toData(): ScraperRun {
    return {
      id: this.id,
      scraperSourceId: this.scraperSourceId,
      projectId: this.projectId,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      errorMessage: this.errorMessage,
      rawResult: this.rawResult,
      insightsSummary: this.insightsSummary,
      stats: this.stats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
