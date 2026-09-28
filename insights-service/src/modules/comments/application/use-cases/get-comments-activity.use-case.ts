import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export type CommentsActivityBucket = {
  bucket: string;
  count: number;
};

export class GetCommentsActivityUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: {
    projectId: string;
    bucket: "week" | "month";
    maxBuckets: number;
  }): Promise<ResultEx<{ buckets: CommentsActivityBucket[] }, Error>> {
    try {
      const repoResult = await this.repository.getActivity(input);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      return ResultEx.success({ buckets: repoResult.data });
    } catch (error) {
      logger.error("comments.activity.exception", { input, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
