import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class GetCommentsByAuthorUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: {
    projectId: string;
    author: string;
    sourceType?: "reddit" | "hackernews";
    limit?: number;
  }): Promise<ResultEx<{ comments: Array<Record<string, unknown>> }, Error>> {
    try {
      const limit = Math.max(1, Math.min(input.limit ?? 50, 200));
      const repoResult = await this.repository.getByAuthor({
        projectId: input.projectId,
        author: input.author,
        sourceType: input.sourceType,
        limit,
      });
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      const comments = repoResult.data.map((row) => {
        const url = String(row.context_url ?? row.url ?? "").toLowerCase();
        const sourceType =
          url.includes("ycombinator.com") || url.includes("news.ycombinator.com")
            ? "hackernews"
            : "reddit";
        return {
          id: String(row.id ?? ""),
          sourceId: String(row.source_id ?? ""),
          projectId: String(row.project_id ?? ""),
          externalId: String(row.external_id ?? ""),
          content: String(row.content ?? ""),
          author: row.author ? String(row.author) : null,
          url: String(row.url ?? ""),
          contextTitle: row.context_title ? String(row.context_title) : null,
          contextUrl: row.context_url ? String(row.context_url) : null,
          createdAt: new Date(String(row.created_at ?? new Date().toISOString())).toISOString(),
          fetchedAt: new Date(String(row.fetched_at ?? new Date().toISOString())).toISOString(),
          processedAt: row.processed_at ? new Date(String(row.processed_at)).toISOString() : null,
          sourceType,
        };
      });
      return ResultEx.success({ comments });
    } catch (error) {
      logger.error("comments.by-author.exception", { input, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
