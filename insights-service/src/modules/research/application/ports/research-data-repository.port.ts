import ResultEx from "../../../../infrastructure/result/result";

export interface StoredResearchDataLite {
  readonly projectId: string;
  readonly lastResearchRunAt: Date | null;
  readonly synthesisReport?: Record<string, unknown> | null;
  readonly userStories?: Array<Record<string, unknown>> | null;
  readonly researchStatus?: string | null;
}

export interface ResearchDataRepositoryPort {
  findByProjectId(projectId: string): Promise<ResultEx<StoredResearchDataLite | null, Error>>;
  touchResearchRun(projectId: string): Promise<ResultEx<Date, Error>>;
}
