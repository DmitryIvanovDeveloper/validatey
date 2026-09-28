import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentDto } from "./get-comment-by-id.use-case";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export type GetCommentsInput = {
  projectId: string;
  limit?: number;
  sourceId?: string;
  periodMonths?: number;
};

export class GetCommentsUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: GetCommentsInput): Promise<ResultEx<{ comments: CommentDto[]; totalCount: number; hasMore: boolean }, Error>> {
    try {
      const maxLimit = Math.min(Math.max(input.limit ?? 50, 1), 200);
      const repoResult = await this.repository.listByProject({
        projectId: input.projectId,
        limit: maxLimit,
        sourceId: input.sourceId,
        periodMonths: input.periodMonths,
      });
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      const rows = repoResult.data;
      const comments: CommentDto[] = rows.map((row) => ({
        id: String(row.id ?? ""),
        sourceId: String(row.source_id ?? ""),
        projectId: String(row.project_id ?? ""),
        externalId: String(row.external_id ?? ""),
        content: String(row.content ?? ""),
        author: String(row.author ?? ""),
        url: String(row.url ?? ""),
        contextTitle: String(row.context_title ?? ""),
        contextUrl: String(row.context_url ?? ""),
        createdAt: new Date(String(row.created_at ?? new Date().toISOString())).toISOString(),
        fetchedAt: new Date(String(row.fetched_at ?? new Date().toISOString())).toISOString(),
        isProcessed: Boolean(row.is_processed ?? false),
        processedAt: row.processed_at ? new Date(String(row.processed_at)).toISOString() : null,
        importOrigin: String(row.import_origin ?? ""),
        subsourceName: String(row.subsource_name ?? ""),
        score: typeof row.score === "number" ? row.score : undefined,
        depth: typeof row.depth === "number" ? row.depth : undefined,
      }));

      // lightweight total estimate for API compatibility
      const totalCount = comments.length;
      const hasMore = comments.length === maxLimit;

      return ResultEx.success({ comments, totalCount, hasMore });
    } catch (error) {
      logger.error("comments.get.exception", { input, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
