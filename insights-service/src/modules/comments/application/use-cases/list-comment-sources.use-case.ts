import ResultEx from "../../../../infrastructure/result/result";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class ListCommentSourcesUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(projectId: string): Promise<ResultEx<{ sources: Record<string, unknown>[] }, Error>> {
    const result = await this.repository.listSources(projectId);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    return ResultEx.success({ sources: result.data });
  }
}
