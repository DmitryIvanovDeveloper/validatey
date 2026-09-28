import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class GetSuggestedOutreachUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(
    projectId: string,
    limit = 20,
  ): Promise<
    ResultEx<
      {
        commenters: Array<{
          author: string;
          sourceType: "reddit" | "hackernews";
          commentCount: number;
          supportingCount: number;
          lastCommentAt: string;
          profileUrl: string;
        }>;
      },
      Error
    >
  > {
    try {
      const repoResult = await this.repository.getSuggestedOutreach(projectId, limit);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      return ResultEx.success({ commenters: repoResult.data });
    } catch (error) {
      logger.error("comments.suggested-outreach.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
