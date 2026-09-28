import ResultEx from "../../../../infrastructure/result/result";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class GetPatternCommentsUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: {
    projectId: string;
    patternType: string;
    patternIndex?: number;
    commentIdsFromQuery?: string[];
  }): Promise<ResultEx<{ comments: Record<string, unknown>[]; total: number; pattern: Record<string, unknown> | null }, Error>> {
    const result = await this.repository.listPatternComments(input);
    if (!result.isSuccess) return ResultEx.failure(result.error);
    return ResultEx.success({
      comments: result.data.comments,
      total: result.data.comments.length,
      pattern: result.data.pattern as Record<string, unknown> | null,
    });
  }
}
