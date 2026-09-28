import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export type CommentsFreshnessDto = {
  oldestCommentAt: string;
  newestCommentAt: string;
  totalCount: number;
  isStale: boolean;
};

const STALE_DAYS = 30;

export class GetCommentsFreshnessUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(projectId: string): Promise<ResultEx<CommentsFreshnessDto | null, Error>> {
    try {
      const repoResult = await this.repository.getFreshness(projectId);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      if (!repoResult.data) return ResultEx.success(null);
      const data = repoResult.data;
      // Keep use-case-level policy guard in application layer.
      const isStale =
        new Date(data.newestCommentAt).getTime() <
        Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
      return ResultEx.success({ ...data, isStale });
    } catch (error) {
      logger.error("comments.freshness.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
