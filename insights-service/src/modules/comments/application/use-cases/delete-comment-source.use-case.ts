import ResultEx from "../../../../infrastructure/result/result";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class DeleteCommentSourceUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: { projectId: string; sourceId: string }): Promise<ResultEx<void, Error>> {
    const result = await this.repository.deleteSource(input.projectId, input.sourceId);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    if (!result.data) return ResultEx.failure(new Error("Comment source not found"));
    return ResultEx.success(undefined);
  }
}
