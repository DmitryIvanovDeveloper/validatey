import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

type Pattern = {
  type: string;
  label: string;
  count?: number;
  percentage?: number;
  supportsHypothesis?: boolean;
  commentIds?: string[];
  [k: string]: unknown;
};

export class GetPatternAnalysisUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(projectId: string): Promise<ResultEx<Record<string, unknown>, Error>> {
    try {
      const repoResult = await this.repository.getPatternAnalysis(projectId);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      const analysis = repoResult.data;
      const patterns = [...((analysis.patterns as Pattern[]) ?? [])].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
      return ResultEx.success({ ...analysis, patterns });
    } catch (error) {
      logger.error("comments.pattern-analysis.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
